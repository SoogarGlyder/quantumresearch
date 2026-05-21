"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar"; 
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { 
  STATUS_SESI, 
  TIPE_SESI, 
  PREFIX_BARCODE, 
  PERAN, 
  KONFIGURASI_SISTEM,
  STATUS_USER,
  PERIODE_BELAJAR,
  PESAN_SISTEM,
  GAMIFIKASI
} from "../utils/constants";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ============================================================================
// 1. GEOFENCING LOGIC
// ============================================================================
function isLokasiValid(lokasi) {
  if (!lokasi?.lat || !lokasi?.lng) return false;

  const { LAT, LNG, RADIUS_METER } = PERIODE_BELAJAR.LOKASI_HQ;
  const R = 6371e3; 
  const φ1 = (lokasi.lat * Math.PI) / 180;
  const φ2 = (LAT * Math.PI) / 180;
  const Δφ = ((LAT - lokasi.lat) * Math.PI) / 180;
  const Δλ = ((LNG - lokasi.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c) <= RADIUS_METER;
}

// ============================================================================
// 2. EXTRA ACTION: AMBIL DAFTAR GURU (SUDAH DIFILTER BERDASARKAN CABANG SISWA)
// ============================================================================
export async function ambilDaftarGuruDropdown() {
  try {
    await connectToDatabase();
    
    // 1. Ambil sesi token siswa yang sedang membuka scanner
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    // 2. Tarik data profil siswa untuk membaca kodeCabang-nya
    const siswa = await User.findById(userId).select("kodeCabang").lean();
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    // 3. Bangun query dasar pencarian pengajar aktif
    let queryPengajar = {
      peran: PERAN.PENGAJAR.id,
      status: STATUS_USER.AKTIF 
    };

    //  FIX: Jika siswa memiliki cabang, kunci agar hanya memuat guru dari cabang yang sama
    if (siswa.kodeCabang) {
      queryPengajar.kodeCabang = siswa.kodeCabang;
    }

    const daftarGuru = await User.find(queryPengajar)
      .select("_id nama")
      .sort({ nama: 1 })
      .lean();

    // Mapping ID menjadi string agar aman dikirim lintas komponen Next.js
    const dataAman = daftarGuru.map(guru => ({
      _id: guru._id.toString(),
      nama: guru.nama
    }));

    return responseHelper.success("Daftar guru berhasil dimuat.", dataAman);
  } catch (error) {
    console.error("[ERROR ambilDaftarGuruDropdown]:", error);
    return responseHelper.error("Gagal memuat daftar guru pendamping.");
  }
}

// ============================================================================
// 3. CORE SCAN LOGIC (SISWA)
// ============================================================================
export async function prosesHasilScan(teksQR, mapelPilihan, pengajarPilihan, lokasi) {
  try {
    await connectToDatabase();
    
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const siswa = await User.findById(userId);
    if (!siswa || siswa.status !== STATUS_USER.AKTIF) {
      return responseHelper.error("Akun dinonaktifkan atau tidak ditemukan.");
    }

    const sekarang = new Date();
    const tglHariIni = timeHelper.getTglJakarta(sekarang);

    let jenisQR = null;
    let jadwalIdDariQR = null;

    if (teksQR.startsWith(PREFIX_BARCODE.KELAS)) {
      jenisQR = TIPE_SESI.KELAS;
      jadwalIdDariQR = teksQR.replace(PREFIX_BARCODE.KELAS, "");
    } else if (teksQR === PREFIX_BARCODE.KONSUL) {
      jenisQR = TIPE_SESI.KONSUL;
    }

    if (!jenisQR) return responseHelper.error("⚠️ Barcode tidak valid atau tidak dikenali.");

    let sesiAktif = null;

    if (jenisQR === TIPE_SESI.KELAS) {
      if (!jadwalIdDariQR || jadwalIdDariQR.length !== 24) {
        return responseHelper.error("⚠️ Format barcode kelas tidak valid.");
      }
      sesiAktif = await StudySession.findOne({ siswaId: userId, jadwalId: jadwalIdDariQR });
    } else {
      sesiAktif = await StudySession.findOne({
        siswaId: userId, jenisSesi: TIPE_SESI.KONSUL, status: STATUS_SESI.BERJALAN.id
      });
    }

    if (sesiAktif) {
      const tglSesiLama = timeHelper.getTglJakarta(sesiAktif.waktuMulai);
      if (tglSesiLama !== tglHariIni) {
        if (!sesiAktif.waktuSelesai) {
          sesiAktif.status = STATUS_SESI.SELESAI.id;
          sesiAktif.waktuSelesai = sesiAktif.waktuMulai; 
          await sesiAktif.save();
        }
        sesiAktif = null; 
      } else if (sesiAktif.waktuSelesai) {
        return responseHelper.success("✅ Anda sudah melakukan Check-out untuk kelas ini.");
      }
    }

    // --- LOGIKA PULANG SISWA (Check-Out) ---
    if (sesiAktif) {
      const durasiMenit = Math.floor((sekarang - sesiAktif.waktuMulai) / 60000);

      if (sesiAktif.jenisSesi === TIPE_SESI.KELAS) {
        const minBelajar = KONFIGURASI_SISTEM.MIN_DURASI_BELAJAR_SAH; 
        if (durasiMenit < minBelajar) {
          return responseHelper.error(`Belum ${minBelajar} menit. Mohon tunggu sejenak.`);
        }

        let menitExtra = 0;
        const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tglHariIni })
          .select("jamSelesai pengajarId")
          .lean();

        if (jadwal) {
          const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00+07:00`);
          if (sekarang > waktuSelesaiJadwal) {
            const hitungExtra = Math.floor((sekarang - waktuSelesaiJadwal) / 60000);
            if (hitungExtra > 15) menitExtra = hitungExtra;
          }
        }

        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sekarang;
        sesiAktif.konsulExtraMenit = menitExtra;
        await sesiAktif.save();

        if (menitExtra > 0 && jadwal?.pengajarId) {
          const { awal, akhir } = timeHelper.getRentangHari(sekarang);
          
          const updateRecord = await AbsensiPengajar.updateOne(
            { 
              pengajarId: jadwal.pengajarId, 
              waktuMasuk: { $gte: awal, $lte: akhir },
              "riwayatEkstraKelas.jadwalId": jadwal._id 
            },
            { 
              $max: { "riwayatEkstraKelas.$.menitEkstra": menitExtra } 
            }
          );

          if (updateRecord.matchedCount === 0) {
            await AbsensiPengajar.updateOne(
              { 
                pengajarId: jadwal.pengajarId, 
                waktuMasuk: { $gte: awal, $lte: akhir } 
              },
              { 
                $push: { riwayatEkstraKelas: { jadwalId: jadwal._id, menitEkstra: menitExtra } } 
              }
            );
          }

          const absenGuru = await AbsensiPengajar.findOne({
            pengajarId: jadwal.pengajarId,
            waktuMasuk: { $gte: awal, $lte: akhir }
          }).select("riwayatEkstraKelas").lean();

          if (absenGuru) {
            const totalHarian = absenGuru.riwayatEkstraKelas.reduce((sum, item) => sum + item.menitEkstra, 0);
            await AbsensiPengajar.updateOne(
              { _id: absenGuru._id },
              { $set: { totalMenitEkstraHarian: totalHarian } }
            );
          }
        }

        let expDapat = GAMIFIKASI.EXP.HADIR_KELAS;
        if (menitExtra >= 30) {
          expDapat += Math.floor(menitExtra / 30) * GAMIFIKASI.EXP.KONSUL_PER_30_MENIT;
        } else if (menitExtra >= KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH) {
          expDapat += GAMIFIKASI.EXP.KONSUL_DASAR;
        }

        let lencanaBaru = [];
        const lencanaDimiliki = siswa.koleksiLencana?.map(l => l.idLencana) || [];
        const jamSelesai = sekarang.getHours();

        if (!lencanaDimiliki.includes(GAMIFIKASI.LENCANA.FIRST_BLOOD)) {
          lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.FIRST_BLOOD, tanggalDidapat: sekarang });
        }
        if (jamSelesai >= 18 && !lencanaDimiliki.includes(GAMIFIKASI.LENCANA.BURUNG_HANTU)) {
          lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.BURUNG_HANTU, tanggalDidapat: sekarang });
        }

        siswa.totalExp += expDapat;
        if (lencanaBaru.length > 0) siswa.koleksiLencana.push(...lencanaBaru);
        
        const misiUpdates = updateMisiSiswa(siswa, tglHariIni, { jenis: "HADIR_KELAS" });
        await siswa.save();

        let pesanAkhir = `Check-out Berhasil! ✨ +${expDapat} EXP`;
        if (menitExtra > 0) pesanAkhir += ` (Ekstra Konsul ${menitExtra}m)`;
        if (lencanaBaru.length > 0) pesanAkhir += ` 🏅 Mendapat ${lencanaBaru.length} Lencana!`;
        if (misiUpdates > 0) pesanAkhir += ` 🎯 Misi Harian selesai!`;

        revalidatePath("/", "layout"); 
        return responseHelper.success(pesanAkhir);
      }

      if (sesiAktif.jenisSesi === TIPE_SESI.KONSUL) {
        const minKonsul = KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH;
        if (durasiMenit < minKonsul) {
          await StudySession.deleteOne({ _id: sesiAktif._id }); 
          revalidatePath("/", "layout");
          return responseHelper.success("Sesi Konsul dibatalkan (durasi < 5 menit).");
        }

        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sekarang;
        await sesiAktif.save();
        
        let expDapat = GAMIFIKASI.EXP.KONSUL_DASAR;
        if (durasiMenit >= 30) {
          expDapat += Math.floor(durasiMenit / 30) * GAMIFIKASI.EXP.KONSUL_PER_30_MENIT;
        }

        let lencanaBaru = [];
        const lencanaDimiliki = siswa.koleksiLencana?.map(l => l.idLencana) || [];
        const jamSelesai = sekarang.getHours();

        if (!lencanaDimiliki.includes(GAMIFIKASI.LENCANA.FIRST_BLOOD)) lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.FIRST_BLOOD, tanggalDidapat: sekarang });
        if (jamSelesai >= 18 && !lencanaDimiliki.includes(GAMIFIKASI.LENCANA.BURUNG_HANTU)) lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.BURUNG_HANTU, tanggalDidapat: sekarang });

        siswa.totalExp += expDapat;
        if (lencanaBaru.length > 0) siswa.koleksiLencana.push(...lencanaBaru);

        const misiUpdates = updateMisiSiswa(siswa, tglHariIni, { jenis: "KONSUL", durasi: durasiMenit, jam: jamSelesai });
        await siswa.save();

        let pesanAkhir = `Sesi Konsul Selesai! ✨ +${expDapat} EXP`;
        if (lencanaBaru.length > 0) pesanAkhir += ` 🏅 Mendapat ${lencanaBaru.length} Lencana!`;
        if (misiUpdates > 0) pesanAkhir += ` 🎯 Misi Harian selesai!`;

        revalidatePath("/", "layout");
        return responseHelper.success(pesanAkhir);
      }
    }

    // --- LOGIKA MASUK SISWA (Check-In) ---
    if (jenisQR === TIPE_SESI.KELAS) {
      const jadwal = await Jadwal.findById(jadwalIdDariQR)
        .select("tanggal kelasTarget mapel jamMulai jamSelesai pengajarId")
        .populate("pengajarId", "kodeCabang")
        .lean();
      
      if (!jadwal) return responseHelper.error("⚠️ Sesi kelas tidak ditemukan.");
      
      if (jadwal.pengajarId && jadwal.pengajarId.kodeCabang && siswa.kodeCabang && jadwal.pengajarId.kodeCabang !== siswa.kodeCabang) {
         return responseHelper.error("⛔ Akses Ditolak! Ini adalah QR jadwal dari cabang lain.");
      }

      if (jadwal.tanggal !== tglHariIni) return responseHelper.error("⚠️ Barcode kedaluwarsa.");
      if (jadwal.kelasTarget !== siswa.kelas) return responseHelper.error(`⚠️ Khusus kelas ${jadwal.kelasTarget}.`);

      const waktuMulaiJadwal = new Date(`${tglHariIni}T${jadwal.jamMulai}:00+07:00`);
      const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00+07:00`);

      const windowScanStart = new Date(waktuMulaiJadwal.getTime() - KONFIGURASI_SISTEM.WINDOW_SCAN_MASUK_MENIT * 60000);
      
      if (sekarang < windowScanStart) return responseHelper.error(`Scan dibuka ${KONFIGURASI_SISTEM.WINDOW_SCAN_MASUK_MENIT}m sebelum kelas.`);
      if (sekarang > waktuSelesaiJadwal) return responseHelper.error("Gagal! Sesi kelas sudah berakhir.");

      let telat = sekarang > waktuMulaiJadwal ? Math.floor((sekarang - waktuMulaiJadwal) / 60000) : 0;

      await StudySession.create({
        siswaId: userId, jenisSesi: TIPE_SESI.KELAS, namaMapel: jadwal.mapel,
        jadwalId: jadwal._id, terlambatMenit: telat, status: STATUS_SESI.BERJALAN.id, waktuMulai: Thermal
      });

      let pesanTambahan = "";
      if (sekarang.getHours() < 15) {
        if (updateMisiSiswa(siswa, tglHariIni, { jenis: "DATANG_AWAL" }) > 0) {
          await siswa.save();
          pesanTambahan = " 🎯 Misi Datang Awal selesai!";
        }
      }

      revalidatePath("/", "layout");
      return responseHelper.success(`Check-in Berhasil! ${telat > 0 ? '(Terlambat '+telat+'m)' : 'Tepat Waktu!'}${pesanTambahan}`);
    }

    if (jenisQR === TIPE_SESI.KONSUL) {
      if (!mapelPilihan) return responseHelper.error("Pilih Mata Pelajaran konsul dahulu!");
      
      if (!pengajarPilihan || pengajarPilihan.trim() === "") {
        return responseHelper.error("Pilih Pengajar Pendamping konsul dahulu!");
      }
      
      await StudySession.create({
        siswaId: userId, 
        jenisSesi: TIPE_SESI.KONSUL, 
        namaMapel: mapelPilihan.trim(),
        pengajarPendamping: pengajarPilihan === "MANDIRI" ? null : pengajarPilihan,
        status: STATUS_SESI.BERJALAN.id, 
        waktuMulai: sekarang
      });

      let pesanTambahan = "";
      if (sekarang.getHours() < 15) {
        if (updateMisiSiswa(siswa, tglHariIni, { jenis: "DATANG_AWAL" }) > 0) {
          await siswa.save();
          pesanTambahan = " 🎯 Misi Datang Awal selesai!";
        }
      }

      revalidatePath("/", "layout");
      return responseHelper.success(`Sesi Konsul ${mapelPilihan} dimulai.${pesanTambahan}`);
    }

  } catch (error) {
    console.error("[ERROR Scan QR Siswa]:", error);
    return responseHelper.error("Terjadi gangguan sistem absensi.");
  }
}

// ============================================================================
// 4. CORE SCAN LOGIC (STAFF/PENGAJAR)
// ============================================================================
export async function absenPengajarAction(teksQR, lokasi) {
  try {
    await connectToDatabase();
    const { userId, peran } = await authHelper.ambilSesi();
    
    if (!userId || (peran !== PERAN.PENGAJAR.id && peran !== PERAN.ADMIN.id)) {
      return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    }

    if (teksQR !== PREFIX_BARCODE.ADMIN) return responseHelper.error("⚠️ Barcode Staf tidak valid.");

    const sekarang = new Date();
    const { awal, akhir } = timeHelper.getRentangHari(sekarang);

    let absenHariIni = await AbsensiPengajar.findOne({
      pengajarId: userId, waktuMasuk: { $gte: awal, $lte: akhir }
    }).lean();

    if (absenHariIni) {
      if (absenHariIni.waktuKeluar) {
         return responseHelper.success("✅ Anda sudah melakukan Clock-Out hari ini.");
      }

      const payloadOut = { waktuKeluar: sekarang };
      if (lokasi) payloadOut.lokasiScanKeluar = lokasi;

      await AbsensiPengajar.updateOne({ _id: absenHariIni._id }, { $set: payloadOut });

      revalidatePath("/", "layout");
      revalidatePath(PERAN.PENGAJAR.home);
      return responseHelper.success("✅ Clock-Out Berhasil! Terima kasih.");
      
    } else {
      const dataAbsenBaru = { pengajarId: userId, waktuMasuk: sekarang, status: "HADIR" };
      if (lokasi) dataAbsenBaru.lokasiScanMasuk = lokasi;

      await AbsensiPengajar.create(dataAbsenBaru);

      revalidatePath("/", "layout");
      revalidatePath(PERAN.PENGAJAR.home);
      return responseHelper.success("✅ Clock-In Berhasil!");
    }

  } catch (error) {
    console.error("[ERROR Absen Pengajar]:", error);
    return responseHelper.error("Gagal memproses absen.");
  }
}

// ============================================================================
// 5. GAMIFICATION INTERNAL HELPER
// ============================================================================
function updateMisiSiswa(siswa, tanggalSekarang, aksi) {
  let adaUpdate = 0;
  if (!siswa.misiHarian || siswa.misiHarian.tanggal !== tanggalSekarang) return adaUpdate;

  siswa.misiHarian.daftar.forEach(misi => {
    if (misi.selesai) return; 
    let tercapai = false;

    if (aksi.jenis === "HADIR_KELAS" && misi.kodeMisi === "HADIR_KELAS") {
      misi.progress = 1; tercapai = true;
    } else if (aksi.jenis === "KONSUL" && misi.kodeMisi.startsWith("KONSUL_")) {
      if (misi.kodeMisi === "KONSUL_30" && aksi.durasi >= 30) tercapai = true;
      if (misi.kodeMisi === "KONSUL_60" && aksi.durasi >= 60) tercapai = true;
      if (misi.kodeMisi === "KONSUL_MALAM" && aksi.jam >= 18) tercapai = true;
      if (tercapai) misi.progress = misi.target;
    } else if (aksi.jenis === "DATANG_AWAL" && misi.kodeMisi === "DATANG_AWAL") {
      misi.progress = 1; tercapai = true;
    }

    if (tercapai) { misi.selesai = true; adaUpdate++; }
  });

  return adaUpdate;
}