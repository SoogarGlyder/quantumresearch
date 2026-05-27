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
  STATUS_SESI, TIPE_SESI, PREFIX_BARCODE, PERAN,
  KONFIGURASI_SISTEM, STATUS_USER, PERIODE_BELAJAR,
  PESAN_SISTEM, GAMIFIKASI
} from "../utils/constants";
import { revalidatePath } from "next/cache";
import MisiSiswa from "../models/MisiSiswa";

function isLokasiValid(lokasi) {
  if (!lokasi?.lat || !lokasi?.lng) return false;
  const { LAT, LNG, RADIUS_METER } = PERIODE_BELAJAR.LOKASI_HQ;
  const R = 6371e3;
  const φ1 = (lokasi.lat * Math.PI) / 180;
  const φ2 = (LAT * Math.PI) / 180;
  const Δφ = ((LAT - lokasi.lat) * Math.PI) / 180;
  const Δλ = ((LNG - lokasi.lng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) <= RADIUS_METER;
}

export async function ambilDaftarGuruDropdown() {
  try {
    await connectToDatabase();
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const siswa = await User.findById(userId).select("kodeCabang").lean();
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    let queryPengajar = { peran: PERAN.PENGAJAR.id, status: STATUS_USER.AKTIF };
    if (siswa.kodeCabang) queryPengajar.kodeCabang = siswa.kodeCabang;

    const daftarGuru = await User.find(queryPengajar).select("_id nama").sort({ nama: 1 }).lean();
    const dataAman = daftarGuru.map(guru => ({ _id: guru._id.toString(), nama: guru.nama }));

    return responseHelper.success("Daftar guru berhasil dimuat.", dataAman);
  } catch (error) {
    console.error("[ERROR ambilDaftarGuruDropdown]:", error);
    return responseHelper.error("Gagal memuat daftar guru pendamping.");
  }
}

export async function prosesHasilScan(teksQR, mapelPilihan, pengajarPilihan, lokasi) {
  try {
    await connectToDatabase();
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    // misiHarian sudah tidak ada di User schema, jadi diabaikan saja dari seleksi
    const siswa = await User.findById(userId).select("nama kelas status kodeCabang totalExp koleksiLencana");
    if (!siswa || siswa.status !== STATUS_USER.AKTIF) return responseHelper.error("Akun dinonaktifkan/tidak ditemukan.");

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
      if (!jadwalIdDariQR || jadwalIdDariQR.length !== 24) return responseHelper.error("⚠️ Format barcode kelas tidak valid.");
      sesiAktif = await StudySession.findOne({ siswaId: userId, jadwalId: jadwalIdDariQR });
    } else {
      sesiAktif = await StudySession.findOne({ siswaId: userId, jenisSesi: TIPE_SESI.KONSUL, status: STATUS_SESI.BERJALAN.id });
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

    // --- LOGIKA PULANG (CHECK-OUT) ---
    if (sesiAktif) {
      const durasiMenit = Math.floor((sekarang - sesiAktif.waktuMulai) / 60000);

      if (sesiAktif.jenisSesi === TIPE_SESI.KELAS) {
        if (durasiMenit < KONFIGURASI_SISTEM.MIN_DURASI_BELAJAR_SAH) {
          return responseHelper.error(`Belum ${KONFIGURASI_SISTEM.MIN_DURASI_BELAJAR_SAH} menit. Mohon tunggu.`);
        }

        let menitExtra = 0;
        const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tglHariIni }).select("jamSelesai pengajarId").lean();

        if (jadwal && jadwal.jamSelesai) {
          const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00+07:00`);
          if (!isNaN(waktuSelesaiJadwal.getTime()) && sekarang > waktuSelesaiJadwal) {
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
            { pengajarId: jadwal.pengajarId, waktuMasuk: { $gte: awal, $lte: akhir }, "riwayatEkstraKelas.jadwalId": jadwal._id },
            { $max: { "riwayatEkstraKelas.$.menitEkstra": menitExtra } }
          );

          if (updateRecord.matchedCount === 0) {
            await AbsensiPengajar.updateOne(
              { pengajarId: jadwal.pengajarId, waktuMasuk: { $gte: awal, $lte: akhir } },
              { $push: { riwayatEkstraKelas: { jadwalId: jadwal._id, menitEkstra: menitExtra } } }
            );
          }

          const absenGuru = await AbsensiPengajar.findOne({ pengajarId: jadwal.pengajarId, waktuMasuk: { $gte: awal, $lte: akhir } }).select("riwayatEkstraKelas").lean();
          if (absenGuru) {
            const totalHarian = absenGuru.riwayatEkstraKelas.reduce((sum, item) => sum + item.menitEkstra, 0);
            await AbsensiPengajar.updateOne({ _id: absenGuru._id }, { $set: { totalMenitEkstraHarian: totalHarian } });
          }
        }

        let expDapat = GAMIFIKASI.EXP.HADIR_KELAS;
        if (menitExtra >= 30) expDapat += Math.floor(menitExtra / 30) * GAMIFIKASI.EXP.KONSUL_PER_30_MENIT;
        else if (menitExtra >= KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH) expDapat += GAMIFIKASI.EXP.KONSUL_DASAR;

        let lencanaBaru = [];
        const lencanaDimiliki = siswa.koleksiLencana?.map(l => l.idLencana) || [];
        const jamSelesai = sekarang.getHours();

        if (!lencanaDimiliki.includes(GAMIFIKASI.LENCANA.FIRST_BLOOD)) lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.FIRST_BLOOD, tanggalDidapat: sekarang });
        if (jamSelesai >= 18 && !lencanaDimiliki.includes(GAMIFIKASI.LENCANA.BURUNG_HANTU)) lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.BURUNG_HANTU, tanggalDidapat: sekarang });

        // Update profil User (EXP dan Lencana)
        siswa.totalExp += expDapat;
        if (lencanaBaru.length > 0) siswa.koleksiLencana.push(...lencanaBaru);
        await siswa.save(); 

        // Update Misi secara terpisah
        await updateMisiSiswa(userId, tglHariIni, { jenis: "HADIR_KELAS" });

        let pesanAkhir = `Check-out Berhasil! ✨ +${expDapat} EXP`;
        if (menitExtra > 0) pesanAkhir += ` (Ekstra ${menitExtra}m)`;
        revalidatePath("/", "layout");
        return responseHelper.success(pesanAkhir);
      }

      if (sesiAktif.jenisSesi === TIPE_SESI.KONSUL) {
        if (durasiMenit < KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH) {
          await StudySession.deleteOne({ _id: sesiAktif._id });
          revalidatePath("/", "layout");
          return responseHelper.success("Sesi Konsul dibatalkan (durasi < 5 menit).");
        }

        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sekarang;
        await sesiAktif.save();

        let expDapat = GAMIFIKASI.EXP.KONSUL_DASAR;
        if (durasiMenit >= 30) expDapat += Math.floor(durasiMenit / 30) * GAMIFIKASI.EXP.KONSUL_PER_30_MENIT;

        // Update Profil
        siswa.totalExp += expDapat;
        await siswa.save();

        // Update Misi
        await updateMisiSiswa(userId, tglHariIni, { jenis: "KONSUL", durasi: durasiMenit, jam: sekarang.getHours() });

        revalidatePath("/", "layout");
        return responseHelper.success(`Sesi Konsul Selesai! ✨ +${expDapat} EXP`);
      }
    }

    // --- LOGIKA MASUK (CHECK-IN) ---
    if (jenisQR === TIPE_SESI.KELAS) {
      const jadwal = await Jadwal.findById(jadwalIdDariQR).select("tanggal kelasTarget mapel jamMulai jamSelesai pengajarId").populate("pengajarId", "kodeCabang").lean();
      if (!jadwal) return responseHelper.error("⚠️ Sesi kelas tidak ditemukan.");
      if (jadwal.pengajarId?.kodeCabang && siswa.kodeCabang && jadwal.pengajarId.kodeCabang !== siswa.kodeCabang) {
        return responseHelper.error("⛔ Akses Ditolak! Ini QR jadwal dari cabang lain.");
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
        siswaId: userId,
        namaSiswa: siswa.nama,
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        jadwalId: jadwal._id,
        terlambatMenit: telat,
        status: STATUS_SESI.BERJALAN.id,
        waktuMulai: sekarang
      });

      if (sekarang.getHours() < 15) {
        await updateMisiSiswa(userId, tglHariIni, { jenis: "DATANG_AWAL" });
      }

      revalidatePath("/", "layout");
      return responseHelper.success(`Check-in Berhasil! ${telat > 0 ? '(Terlambat ' + telat + 'm)' : 'Tepat Waktu!'}`);
    }

    if (jenisQR === TIPE_SESI.KONSUL) {
      if (!mapelPilihan) return responseHelper.error("Pilih Mata Pelajaran konsul dahulu!");
      if (!pengajarPilihan || pengajarPilihan.trim() === "") return responseHelper.error("Pilih Pengajar Pendamping konsul dahulu!");

      let namaGuruPendamping = null;
      if (pengajarPilihan !== "MANDIRI") {
        const guru = await User.findById(pengajarPilihan).select("nama").lean();
        if (guru) namaGuruPendamping = guru.nama;
      }

      await StudySession.create({
        siswaId: userId,
        namaSiswa: siswa.nama,
        jenisSesi: TIPE_SESI.KONSUL,
        namaMapel: mapelPilihan.trim(),
        pengajarPendamping: pengajarPilihan === "MANDIRI" ? null : pengajarPilihan,
        namaPengajarPendamping: namaGuruPendamping,
        status: STATUS_SESI.BERJALAN.id,
        waktuMulai: sekarang
      });

      if (sekarang.getHours() < 15) {
        await updateMisiSiswa(userId, tglHariIni, { jenis: "DATANG_AWAL" });
      }

      revalidatePath("/", "layout");
      return responseHelper.success(`Sesi Konsul ${mapelPilihan} dimulai.`);
    }

  } catch (error) {
    console.error("[ERROR Scan QR Siswa]:", error);
    return responseHelper.error("Terjadi gangguan sistem absensi.");
  }
}

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

    let absenHariIni = await AbsensiPengajar.findOne({ pengajarId: userId, waktuMasuk: { $gte: awal, $lte: akhir } }).lean();

    if (absenHariIni) {
      if (absenHariIni.waktuKeluar) return responseHelper.success("✅ Anda sudah melakukan Clock-Out hari ini.");

      const payloadOut = { waktuKeluar: sekarang };
      if (lokasi) payloadOut.lokasiScanKeluar = lokasi;

      await AbsensiPengajar.updateOne({ _id: absenHariIni._id }, { $set: payloadOut });
      revalidatePath("/", "layout");
      revalidatePath(PERAN.PENGAJAR.home);
      return responseHelper.success("✅ Clock-Out Berhasil! Terima kasih.");

    } else {
      const guru = await User.findById(userId).select("nama").lean();

      const dataAbsenBaru = {
        pengajarId: userId,
        namaPengajar: guru ? guru.nama : "Staf",
        waktuMasuk: sekarang,
        status: "HADIR"
      };
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
// HELPER: UPDATE MISI SISWA (Sesuai dengan arsitektur MisiSiswa.js)
// ============================================================================
async function updateMisiSiswa(userId, tanggalSekarang, aksi) {
  let adaUpdate = 0;
  
  // Ambil dokumen misi harian siswa di koleksi MisiSiswa
  const dokumenMisi = await MisiSiswa.findOne({ siswaId: userId, tanggal: tanggalSekarang });
  if (!dokumenMisi || !dokumenMisi.daftarMisi) return 0;

  dokumenMisi.daftarMisi.forEach(misi => {
    if (misi.selesai) return;
    
    let tercapai = false;
    
    if (aksi.jenis === "HADIR_KELAS" && misi.kodeMisi === "HADIR_KELAS") { 
      misi.progress = 1; tercapai = true; 
    }
    else if (aksi.jenis === "KONSUL" && misi.kodeMisi.startsWith("KONSUL_")) {
      if (misi.kodeMisi === "KONSUL_30" && aksi.durasi >= 30) tercapai = true;
      if (misi.kodeMisi === "KONSUL_60" && aksi.durasi >= 60) tercapai = true;
      if (misi.kodeMisi === "KONSUL_MALAM" && aksi.jam >= 18) tercapai = true;
      if (tercapai) misi.progress = misi.target;
    } 
    else if (aksi.jenis === "DATANG_AWAL" && misi.kodeMisi === "DATANG_AWAL") { 
      misi.progress = 1; tercapai = true; 
    }
    
    if (tercapai) { 
      misi.selesai = true; 
      adaUpdate++; 
    }
  });

  if (adaUpdate > 0) {
    await dokumenMisi.save();
  }
  
  return adaUpdate;
}