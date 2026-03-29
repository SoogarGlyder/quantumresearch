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
  PESAN_SISTEM 
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. GEOFENCING LOGIC (Penentu Radius Lokasi)
// ============================================================================
function isLokasiValid(lokasi) {
  if (!lokasi?.lat || !lokasi?.lng) return false;

  const { LAT, LNG, RADIUS_METER } = PERIODE_BELAJAR.LOKASI_HQ;
  const R = 6371e3; // Radius bumi dalam meter
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
// 2. CORE SCAN LOGIC (SISWA)
// ============================================================================

export async function prosesHasilScan(teksQR, mapelPilihan, lokasi) {
  try {
    await connectToDatabase();
    
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const siswa = await User.findById(userId).lean();
    if (!siswa || siswa.status !== STATUS_USER.AKTIF) {
      return responseHelper.error("Akun dinonaktifkan atau tidak ditemukan.");
    }

    const sekarang = new Date();
    const tglHariIni = timeHelper.getTglJakarta(sekarang);

    let jenisQR = null;
    if (teksQR.startsWith(PREFIX_BARCODE.KELAS)) jenisQR = TIPE_SESI.KELAS;
    else if (teksQR === PREFIX_BARCODE.KONSUL) jenisQR = TIPE_SESI.KONSUL;

    if (!jenisQR) return responseHelper.error("⚠️ Barcode tidak valid atau tidak dikenali.");

    let sesiAktif = await StudySession.findOne({ 
      siswaId: userId, 
      status: STATUS_SESI.BERJALAN.id 
    });

    // Validasi Sesi Menggantung (Hari Sebelumnya)
    if (sesiAktif) {
      const tglSesiLama = timeHelper.getTglJakarta(sesiAktif.waktuMulai);
      if (tglSesiLama !== tglHariIni) {
        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sesiAktif.waktuMulai; 
        await sesiAktif.save();
        sesiAktif = null;
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
        const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tglHariIni }).lean();
        if (jadwal) {
          const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00+07:00`);
          if (sekarang > waktuSelesaiJadwal) {
            const hitungExtra = Math.floor((sekarang - waktuSelesaiJadwal) / 60000);
            menitExtra = Math.min(hitungExtra, KONFIGURASI_SISTEM.MAX_EXTRA_MENIT_KONSUL);
          }
        }

        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sekarang;
        sesiAktif.konsulExtraMenit = Math.max(0, menitExtra);
        await sesiAktif.save();

        revalidatePath("/", "layout"); 
        return responseHelper.success(`Check-out Berhasil! ${menitExtra > 0 ? '(+'+menitExtra+'m Konsul)' : ''}`);
      }

      if (sesiAktif.jenisSesi === TIPE_SESI.KONSUL) {
        const minKonsul = KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH;
        if (durasiMenit < minKonsul) {
          await StudySession.findByIdAndDelete(sesiAktif._id);
          revalidatePath("/", "layout");
          return responseHelper.success("Sesi Konsul dibatalkan (durasi kurang).");
        }
        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sekarang;
        await sesiAktif.save();
        
        revalidatePath("/", "layout");
        return responseHelper.success("Sesi Konsul Selesai!");
      }
    }

    // --- LOGIKA MASUK SISWA (Check-In) ---
    if (jenisQR === TIPE_SESI.KELAS) {
      const jadwalId = teksQR.replace(PREFIX_BARCODE.KELAS, "");
      if (!jadwalId || jadwalId.length !== 24) {
        return responseHelper.error("⚠️ Format barcode kelas tidak valid.");
      }

      const jadwal = await Jadwal.findById(jadwalId).lean();
      if (!jadwal) return responseHelper.error("⚠️ Sesi kelas tidak ditemukan.");
      if (jadwal.tanggal !== tglHariIni) return responseHelper.error("⚠️ Barcode kedaluwarsa.");
      if (jadwal.kelasTarget !== siswa.kelas) return responseHelper.error(`⚠️ Khusus kelas ${jadwal.kelasTarget}.`);

      const waktuMulaiJadwal = new Date(`${tglHariIni}T${jadwal.jamMulai}:00+07:00`);
      const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00+07:00`);

      const windowScan = KONFIGURASI_SISTEM.WINDOW_SCAN_MASUK_MENIT;
      const windowScanStart = new Date(waktuMulaiJadwal.getTime() - windowScan * 60000);
      
      if (sekarang < windowScanStart) return responseHelper.error(`Scan dibuka ${windowScan}m sebelum kelas.`);
      if (sekarang > waktuSelesaiJadwal) return responseHelper.error("Gagal! Sesi kelas sudah berakhir.");

      let telat = sekarang > waktuMulaiJadwal ? Math.floor((sekarang - waktuMulaiJadwal) / 60000) : 0;

      await StudySession.create({
        siswaId: userId,
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        terlambatMenit: telat,
        status: STATUS_SESI.BERJALAN.id,
        waktuMulai: sekarang
      });

      revalidatePath("/", "layout");
      return responseHelper.success(`Check-in Berhasil! ${telat > 0 ? '(Terlambat '+telat+'m)' : 'Tepat Waktu!'}`);
    }

    if (jenisQR === TIPE_SESI.KONSUL) {
      if (!mapelPilihan) return responseHelper.error("Pilih Mata Pelajaran konsul dahulu!");

      await StudySession.create({
        siswaId: userId,
        jenisSesi: TIPE_SESI.KONSUL,
        namaMapel: mapelPilihan.trim(),
        status: STATUS_SESI.BERJALAN.id,
        waktuMulai: sekarang
      });

      revalidatePath("/", "layout");
      return responseHelper.success(`Sesi Konsul ${mapelPilihan} dimulai.`);
    }

  } catch (error) {
    console.error("[ERROR Scan QR Siswa]:", error);
    return responseHelper.error("Terjadi gangguan sistem absensi.");
  }
}

// ============================================================================
// 3. CORE SCAN LOGIC (STAFF/PENGAJAR)
// ============================================================================

export async function absenPengajarAction(teksQR, lokasi) {
  try {
    await connectToDatabase();
    const { userId, peran } = await authHelper.ambilSesi();
    
    if (!userId || (peran !== PERAN.PENGAJAR.id && peran !== PERAN.ADMIN.id)) {
      return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    }

    // Validasi Barcode Identitas Staf
    if (teksQR !== PREFIX_BARCODE.ADMIN) {
      return responseHelper.error("⚠️ Barcode Staf tidak valid.");
    }

    const sekarang = new Date();
    const { awal, akhir } = timeHelper.getRentangHari(sekarang);

    let absenHariIni = await AbsensiPengajar.findOne({
      pengajarId: userId,
      waktuMasuk: { $gte: awal, $lte: akhir }
    });

    if (absenHariIni) {
      // --- LOGIKA PULANG (Clock-Out) ---
      if (absenHariIni.waktuKeluar) {
         return responseHelper.success("✅ Anda sudah melakukan Clock-Out untuk hari ini.");
      }

      absenHariIni.waktuKeluar = sekarang;
      if (lokasi) { absenHariIni.lokasiScanKeluar = lokasi; }
      
      await absenHariIni.save();

      // 🔥 REVALIDATE: Reset cache agar TeacherApp & Navigasi tahu status sudah berubah
      revalidatePath("/", "layout");
      revalidatePath(PERAN.PENGAJAR.home);

      return responseHelper.success("✅ Clock-Out Berhasil! Terima kasih.");
      
    } else {
      // --- LOGIKA MASUK (Clock-In) ---
      const dataAbsenBaru = {
        pengajarId: userId,
        waktuMasuk: sekarang
      };

      if (lokasi) { dataAbsenBaru.lokasiScanMasuk = lokasi; }

      await AbsensiPengajar.create(dataAbsenBaru);

      // 🔥 REVALIDATE: Reset cache agar TeacherApp & Navigasi tahu status sudah berubah
      revalidatePath("/", "layout");
      revalidatePath(PERAN.PENGAJAR.home);

      return responseHelper.success("✅ Clock-In Berhasil!");
    }

  } catch (error) {
    console.error("[ERROR Absen Pengajar]:", error);
    return responseHelper.error("Gagal memproses absen.");
  }
}