"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar";
import MisiSiswa from "../models/MisiSiswa";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import {
  STATUS_SESI, TIPE_SESI, PREFIX_BARCODE, PERAN,
  KONFIGURASI_SISTEM, STATUS_USER, PERIODE_BELAJAR,
  PESAN_SISTEM, GAMIFIKASI,
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

/**
 * Memeriksa apakah koordinat GPS pengguna berada di dalam radius markas (HQ).
 * @param {{ lat: number, lng: number }|null} lokasi
 * @returns {boolean}
 */
function isLokasiValid(lokasi) {
  if (!lokasi?.lat || !lokasi?.lng) return false;

  const { LAT, LNG, RADIUS_METER } = PERIODE_BELAJAR.LOKASI_HQ;
  const R  = 6_371_000; // Radius bumi dalam meter
  const φ1 = (lokasi.lat * Math.PI) / 180;
  const φ2 = (LAT        * Math.PI) / 180;
  const Δφ = ((LAT       - lokasi.lat) * Math.PI) / 180;
  const Δλ = ((LNG       - lokasi.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c <= RADIUS_METER;
}

/**
 * Memperbarui progres misi harian siswa berdasarkan aktivitas absensi.
 * @param {string} userId
 * @param {string} tanggalStr
 * @param {{ jenis: string, durasi?: number, jam?: number }} aksi
 * @returns {Promise<number>}
 */
async function updateMisiSiswa(userId, tanggalStr, aksi) {
  const tanggalDate = new Date(
    `${tanggalStr}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`
  );

  const dokumenMisi = await MisiSiswa.findOne({
    siswaId: userId,
    tanggal: tanggalDate,
  });
  if (!dokumenMisi?.daftarMisi) return 0;

  let adaUpdate = 0;

  dokumenMisi.daftarMisi.forEach((misi) => {
    if (misi.selesai) return;

    let tercapai = false;

    if (aksi.jenis === "HADIR_KELAS" && misi.kodeMisi === "HADIR_KELAS") {
      misi.progress = 1;
      tercapai      = true;
    } else if (aksi.jenis === "KONSUL" && misi.kodeMisi.startsWith("KONSUL_")) {
      if (misi.kodeMisi === "KONSUL_30"    && aksi.durasi >= 30)  tercapai = true;
      if (misi.kodeMisi === "KONSUL_60"    && aksi.durasi >= 60)  tercapai = true;
      if (misi.kodeMisi === "KONSUL_MALAM" && aksi.jam    >= 18)   tercapai = true;
      if (tercapai) misi.progress = misi.target;
    } else if (aksi.jenis === "DATANG_AWAL" && misi.kodeMisi === "DATANG_AWAL") {
      misi.progress = 1;
      tercapai      = true;
    }

    if (tercapai) { misi.selesai = true; adaUpdate++; }
  });

  if (adaUpdate > 0) await dokumenMisi.save();
  return adaUpdate;
}

// ============================================================================
// 2. ACTIONS: DAFTAR GURU PENDAMPING
// ============================================================================
export async function ambilDaftarGuruDropdown() {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi?.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const siswa = await User.findById(sesi.userId).select("kodeCabang").lean();
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    let queryPengajar = { peran: PERAN.PENGAJAR.id, status: STATUS_USER.AKTIF };
    if (siswa.kodeCabang) queryPengajar.kodeCabang = siswa.kodeCabang;

    const daftarGuru = await User.find(queryPengajar)
      .select("_id nama")
      .sort({ nama: 1 })
      .lean();

    return responseHelper.success(
      "Daftar guru berhasil dimuat.",
      daftarGuru.map((guru) => ({ _id: guru._id.toString(), nama: guru.nama }))
    );
  } catch (error) {
    console.error("[ERROR ambilDaftarGuruDropdown]:", error);
    return responseHelper.error("Gagal memuat daftar guru pendamping.");
  }
}

// ============================================================================
// 3. CORE SCAN LOGIC (SISWA) - DIPERBAIKI TOTAL
// ============================================================================
export async function prosesHasilScan(teksQR, mapelPilihan, pengajarPilihan, lokasi) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi?.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const siswa = await User.findById(sesi.userId)
      .select("nama kelas status kodeCabang totalExp koleksiLencana");
    if (!siswa || siswa.status !== STATUS_USER.AKTIF) {
      return responseHelper.error("Akun dinonaktifkan atau tidak ditemukan.");
    }

    const sekarang   = new Date();
    const tglHariIni = timeHelper.getTglJakarta(sekarang);
    const { awal, akhir } = timeHelper.getRentangHari(sekarang); // Rentang 00:00 - 23:59 hari ini

    let jenisQR        = null;
    let jadwalIdDariQR = null;

    if (teksQR.startsWith(PREFIX_BARCODE.KELAS)) {
      jenisQR        = TIPE_SESI.KELAS;
      jadwalIdDariQR = teksQR.replace(PREFIX_BARCODE.KELAS, "");
    } else if (teksQR === PREFIX_BARCODE.KONSUL) {
      jenisQR = TIPE_SESI.KONSUL;
    }

    if (!jenisQR) return responseHelper.error("⚠️ Barcode tidak valid atau tidak dikenali.");

    // 🚀 PERBAIKAN 1: Isolasi Pencarian Sesi Aktif Khusus Hari Ini & Sesuai Tipe QR
    let sesiAktif = null;
    if (jenisQR === TIPE_SESI.KELAS) {
      if (!jadwalIdDariQR || jadwalIdDariQR.length !== 24) {
        return responseHelper.error("⚠️ Format barcode kelas tidak valid.");
      }
      // Hanya cari sesi KELAS untuk jadwal ini pada hari ini, ambil yang paling baru
      sesiAktif = await StudySession.findOne({
        siswaId:  sesi.userId,
        jadwalId: jadwalIdDariQR,
        jenisSesi: TIPE_SESI.KELAS,
        waktuMulai: { $gte: awal, $lte: akhir }
      }).sort({ waktuMulai: -1 });
    } else {
      // Hanya cari sesi KONSUL yang masih BERJALAN pada hari ini
      sesiAktif = await StudySession.findOne({
        siswaId:   sesi.userId,
        jenisSesi: TIPE_SESI.KONSUL,
        status:    STATUS_SESI.BERJALAN.id,
        waktuMulai: { $gte: awal, $lte: akhir }
      }).sort({ waktuMulai: -1 });
    }

    // Pembersihan sesi gantung lintas hari (Sabuk Pengaman Tambahan)
    if (sesiAktif) {
      const tglSesiLama = timeHelper.getTglJakarta(sesiAktif.waktuMulai);
      if (tglSesiLama !== tglHariIni) {
        if (!sesiAktif.waktuSelesai) {
          sesiAktif.status       = STATUS_SESI.SELESAI.id;
          sesiAktif.waktuSelesai = sesiAktif.waktuMulai;
          await sesiAktif.save();
        }
        sesiAktif = null;
      } else if (sesiAktif.waktuSelesai) {
        return responseHelper.success(`✅ Anda sudah melakukan Check-out untuk sesi ${jenisQR.toLowerCase()} ini.`);
      }
    }

    // ============================================================
    // LOGIKA CHECK-OUT (PULANG / SELESAI SESI)
    // ============================================================
    if (sesiAktif) {
      const durasiMenit = Math.floor((sekarang - sesiAktif.waktuMulai) / 60_000);

      // A. Check-Out Kelas Reguler (Dengan Bonus Menit Konsul)
      if (sesiAktif.jenisSesi === TIPE_SESI.KELAS) {
        if (durasiMenit < KONFIGURASI_SISTEM.MIN_DURASI_BELAJAR_SAH) {
          return responseHelper.error(
            `Belum ${KONFIGURASI_SISTEM.MIN_DURASI_BELAJAR_SAH} menit. Mohon tunggu sebelum check-out.`
          );
        }

        let menitExtra = 0;
        const jadwal   = await Jadwal.findOne({
          kelasTarget: siswa.kelas,
          tanggal: {
            $gte: new Date(`${tglHariIni}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`),
            $lte: new Date(`${tglHariIni}T23:59:59${PERIODE_BELAJAR.ISO_OFFSET}`),
          },
        })
          .select("jamSelesai pengajarId _id")
          .lean();

        if (jadwal?.jamSelesai) {
          const waktuSelesaiJadwal = new Date(
            `${tglHariIni}T${jadwal.jamSelesai}:00${PERIODE_BELAJAR.ISO_OFFSET}`
          );
          // Menghitung bonus konsul ekstra jika scan out melebihi jam selesai kelas
          if (!isNaN(waktuSelesaiJadwal.getTime()) && sekarang > waktuSelesaiJadwal) {
            const hitungExtra = Math.floor((sekarang - waktuSelesaiJadwal) / 60_000);
            if (hitungExtra > 15) menitExtra = hitungExtra;
          }
        }

        sesiAktif.status           = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai     = sekarang;
        sesiAktif.konsulExtraMenit = menitExtra;
        await sesiAktif.save();

        // Pencatatan Ekstra Menit untuk Guru Pengajar
        if (menitExtra > 0 && jadwal?.pengajarId) {
          const updateRecord = await AbsensiPengajar.updateOne(
            {
              pengajarId: jadwal.pengajarId,
              waktuMasuk: { $gte: awal, $lte: akhir },
              "riwayatEkstraKelas.jadwalId": jadwal._id,
            },
            { $max: { "riwayatEkstraKelas.$.menitEkstra": menitExtra } }
          );

          if (updateRecord.matchedCount === 0) {
            await AbsensiPengajar.updateOne(
              { pengajarId: jadwal.pengajarId, waktuMasuk: { $gte: awal, $lte: akhir } },
              { $push: { riwayatEkstraKelas: { jadwalId: jadwal._id, menitEkstra: menitExtra } } }
            );
          }

          const absenGuru = await AbsensiPengajar.findOne({
            pengajarId: jadwal.pengajarId,
            waktuMasuk: { $gte: awal, $lte: akhir },
          })
            .select("riwayatEkstraKelas")
            .lean();

          if (absenGuru && absenGuru.riwayatEkstraKelas) {
            const totalHarian = absenGuru.riwayatEkstraKelas.reduce(
              (sum, item) => sum + item.menitEkstra,
              0
            );
            await AbsensiPengajar.updateOne(
              { _id: absenGuru._id },
              { $set: { totalMenitEkstraHarian: totalHarian } }
            );
          }
        }

        // Kalkulasi EXP & Lencana
        let expDapat = GAMIFIKASI.EXP.HADIR_KELAS;
        if (menitExtra >= 30) {
          expDapat += Math.floor(menitExtra / 30) * GAMIFIKASI.EXP.KONSUL_PER_30_MENIT;
        } else if (menitExtra >= KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH) {
          expDapat += GAMIFIKASI.EXP.KONSUL_DASAR;
        }

        const lencanaDimiliki = siswa.koleksiLencana?.map((l) => l.idLencana) || [];
        const lencanaBaru     = [];
        const jamSelesai      = sekarang.getHours();

        if (!lencanaDimiliki.includes(GAMIFIKASI.LENCANA.FIRST_BLOOD)) {
          lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.FIRST_BLOOD, tanggalDidapat: sekarang });
        }
        if (jamSelesai >= 18 && !lencanaDimiliki.includes(GAMIFIKASI.LENCANA.BURUNG_HANTU)) {
          lencanaBaru.push({ idLencana: GAMIFIKASI.LENCANA.BURUNG_HANTU, tanggalDidapat: sekarang });
        }

        siswa.totalExp += expDapat;
        if (lencanaBaru.length > 0) siswa.koleksiLencana.push(...lencanaBaru);
        await siswa.save();

        await updateMisiSiswa(sesi.userId, tglHariIni, { jenis: "HADIR_KELAS" });

        revalidatePath("/", "layout");
        return responseHelper.success(
          `Check-out Kelas Berhasil! ✨ +${expDapat} EXP${menitExtra > 0 ? ` (Ekstra Konsul ${menitExtra}m)` : ""}`
        );
      }

      // B. Check-Out Sesi Konsul
      if (sesiAktif.jenisSesi === TIPE_SESI.KONSUL) {
        if (durasiMenit < KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH) {
          await StudySession.deleteOne({ _id: sesiAktif._id });
          revalidatePath("/", "layout");
          return responseHelper.success("Sesi Konsul dibatalkan (durasi < 5 menit).");
        }

        sesiAktif.status       = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sekarang;
        await sesiAktif.save();

        let expDapat = GAMIFIKASI.EXP.KONSUL_DASAR;
        if (durasiMenit >= 30) {
          expDapat += Math.floor(durasiMenit / 30) * GAMIFIKASI.EXP.KONSUL_PER_30_MENIT;
        }

        siswa.totalExp += expDapat;
        await siswa.save();

        await updateMisiSiswa(sesi.userId, tglHariIni, {
          jenis:  "KONSUL",
          durasi: durasiMenit,
          jam:    sekarang.getHours(),
        });

        revalidatePath("/", "layout");
        return responseHelper.success(`Sesi Konsul Selesai! ✨ +${expDapat} EXP`);
      }
    }

    // ============================================================
    // LOGIKA CHECK-IN (MASUK SESI BARU)
    // ============================================================
    if (jenisQR === TIPE_SESI.KELAS) {
      const jadwal = await Jadwal.findById(jadwalIdDariQR)
        .select("tanggal kelasTarget mapel jamMulai jamSelesai pengajarId")
        .populate("pengajarId", "kodeCabang")
        .lean();

      if (!jadwal) return responseHelper.error("⚠️ Sesi kelas tidak ditemukan.");

      if (
        jadwal.pengajarId?.kodeCabang &&
        siswa.kodeCabang &&
        jadwal.pengajarId.kodeCabang !== siswa.kodeCabang
      ) {
        return responseHelper.error("⛔ Akses Ditolak! Ini QR jadwal dari cabang lain.");
      }

      const tglJadwal = timeHelper.getTglJakarta(jadwal.tanggal);
      if (tglJadwal !== tglHariIni) {
        return responseHelper.error("⚠️ Barcode kedaluwarsa.");
      }

      if (jadwal.kelasTarget !== siswa.kelas) {
        return responseHelper.error(`⚠️ QR ini khusus kelas ${jadwal.kelasTarget}.`);
      }

      const waktuMulaiJadwal   = new Date(`${tglHariIni}T${jadwal.jamMulai}:00${PERIODE_BELAJAR.ISO_OFFSET}`);
      const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00${PERIODE_BELAJAR.ISO_OFFSET}`);
      const windowScanStart    = new Date(
        waktuMulaiJadwal.getTime() - KONFIGURASI_SISTEM.WINDOW_SCAN_MASUK_MENIT * 60_000
      );

      if (sekarang < windowScanStart) {
        return responseHelper.error(
          `Scan dibuka ${KONFIGURASI_SISTEM.WINDOW_SCAN_MASUK_MENIT} menit sebelum kelas dimulai.`
        );
      }

      // 🚀 PERBAIKAN 2: Edukasi jelas bila scan masuk setelah kelas bubar
      if (sekarang > waktuSelesaiJadwal) {
        return responseHelper.error(
          "⛔ Gagal Check-Out! Sistem tidak menemukan data Check-In Anda sebelumnya di kelas ini. Apakah Anda lupa scan barcode saat kelas dimulai tadi?"
        );
      }

      const telat = sekarang > waktuMulaiJadwal
        ? Math.floor((sekarang - waktuMulaiJadwal) / 60_000)
        : 0;

      await StudySession.create({
        siswaId:        sesi.userId,
        namaSiswa:      siswa.nama,
        jenisSesi:      TIPE_SESI.KELAS,
        namaMapel:      jadwal.mapel,
        jadwalId:       jadwal._id,
        terlambatMenit: telat,
        status:         STATUS_SESI.BERJALAN.id,
        waktuMulai:     sekarang,
      });

      if (sekarang.getHours() < 15) {
        await updateMisiSiswa(sesi.userId, tglHariIni, { jenis: "DATANG_AWAL" });
      }

      revalidatePath("/", "layout");
      return responseHelper.success(
        `Check-in Berhasil! ${telat > 0 ? `(Terlambat ${telat}m)` : "Tepat Waktu!"}`
      );
    }

    if (jenisQR === TIPE_SESI.KONSUL) {
      if (!mapelPilihan) return responseHelper.error("Pilih Mata Pelajaran konsul dahulu!");
      if (!pengajarPilihan?.trim()) return responseHelper.error("Pilih Pengajar Pendamping konsul dahulu!");

      let namaGuruPendamping = null;
      if (pengajarPilihan !== "MANDIRI") {
        const guru = await User.findById(pengajarPilihan).select("nama").lean();
        if (guru) namaGuruPendamping = guru.nama;
      }

      await StudySession.create({
        siswaId:                sesi.userId,
        namaSiswa:              siswa.nama,
        jenisSesi:              TIPE_SESI.KONSUL,
        namaMapel:              mapelPilihan.trim(),
        pengajarPendamping:     pengajarPilihan === "MANDIRI" ? null : pengajarPilihan,
        namaPengajarPendamping: namaGuruPendamping,
        status:                 STATUS_SESI.BERJALAN.id,
        waktuMulai:             sekarang,
      });

      if (sekarang.getHours() < 15) {
        await updateMisiSiswa(sesi.userId, tglHariIni, { jenis: "DATANG_AWAL" });
      }

      revalidatePath("/", "layout");
      return responseHelper.success(`Sesi Konsul ${mapelPilihan} dimulai.`);
    }

    return responseHelper.error("⚠️ Tindakan tidak dikenali.");
  } catch (error) {
    console.error("[ERROR prosesHasilScan]:", error);
    return responseHelper.error("Terjadi gangguan sistem absensi.");
  }
}

// ============================================================================
// 4. ACTIONS: ABSENSI PENGAJAR / STAF
// ============================================================================
export async function absenPengajarAction(teksQR, lokasi) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();

    if (!sesi?.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);
    if (sesi.peran !== PERAN.PENGAJAR.id && sesi.peran !== PERAN.ADMIN.id) {
      return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    }
    if (teksQR !== PREFIX_BARCODE.ADMIN) {
      return responseHelper.error("⚠️ Barcode Staf tidak valid.");
    }

    const sekarang        = new Date();
    const { awal, akhir } = timeHelper.getRentangHari(sekarang);

    const absenHariIni = await AbsensiPengajar.findOne({
      pengajarId: sesi.userId,
      waktuMasuk: { $gte: awal, $lte: akhir },
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
    }

    const guru = await User.findById(sesi.userId).select("nama").lean();
    const dataAbsenBaru = {
      pengajarId:   sesi.userId,
      namaPengajar: guru?.nama ?? "Staf",
      waktuMasuk:   sekarang,
    };
    if (lokasi) dataAbsenBaru.lokasiScanMasuk = lokasi;

    await AbsensiPengajar.create(dataAbsenBaru);
    revalidatePath("/", "layout");
    revalidatePath(PERAN.PENGAJAR.home);
    return responseHelper.success("✅ Clock-In Berhasil!");
  } catch (error) {
    console.error("[ERROR absenPengajarAction]:", error);
    return responseHelper.error("Gagal memproses absen.");
  }
}
