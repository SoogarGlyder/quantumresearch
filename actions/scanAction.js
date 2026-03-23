"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
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

    if (!isLokasiValid(lokasi)) {
      return responseHelper.error("📍 Lokasi tidak valid! Anda berada di luar area Quantum.");
    }

    const sekarang = new Date();
    const tglHariIni = timeHelper.getTglJakarta(sekarang);

    let jenisQR = null;
    if (teksQR.startsWith(PREFIX_BARCODE.KELAS)) jenisQR = TIPE_SESI.KELAS;
    else if (teksQR === PREFIX_BARCODE.KONSUL) jenisQR = TIPE_SESI.KONSUL;

    if (!jenisQR) return responseHelper.error("⚠️ Barcode tidak valid.");

    let sesiAktif = await StudySession.findOne({ 
      siswaId: userId, 
      status: STATUS_SESI.BERJALAN.id 
    });

    if (sesiAktif) {
      const tglSesiLama = timeHelper.getTglJakarta(sesiAktif.waktuMulai);
      if (tglSesiLama !== tglHariIni) {
        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sesiAktif.waktuMulai; 
        await sesiAktif.save();
        sesiAktif = null;
      }
    }

    // --- LOGIKA PULANG (Check-Out) ---
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

        revalidatePath(PERAN.SISWA.home);
        return responseHelper.success(`Check-out Berhasil! ${menitExtra > 0 ? '(+'+menitExtra+'m Konsul)' : ''}`);
      }

      if (sesiAktif.jenisSesi === TIPE_SESI.KONSUL) {
        const minKonsul = KONFIGURASI_SISTEM.MIN_DURASI_KONSUL_SAH;
        if (durasiMenit < minKonsul) {
          await StudySession.findByIdAndDelete(sesiAktif._id);
          return responseHelper.success("Sesi Konsul dibatalkan (durasi kurang dari batas minimal).");
        }
        sesiAktif.status = STATUS_SESI.SELESAI.id;
        sesiAktif.waktuSelesai = sekarang;
        await sesiAktif.save();
        
        revalidatePath(PERAN.SISWA.home);
        return responseHelper.success("Sesi Konsul Selesai!");
      }
    }

    // --- LOGIKA MASUK (Check-In) ---
    if (jenisQR === TIPE_SESI.KELAS) {
      const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tglHariIni }).lean();
      if (!jadwal) return responseHelper.error("Tidak ada jadwal kelas untukmu hari ini.");

      const barcodeValid = `${PREFIX_BARCODE.KELAS}${jadwal.mapel.toUpperCase()}`;
      if (teksQR !== barcodeValid) return responseHelper.error(`⚠️ Salah Barcode! Gunakan barcode ${jadwal.mapel}.`);

      const waktuMulaiJadwal = new Date(`${tglHariIni}T${jadwal.jamMulai}:00+07:00`);
      const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00+07:00`);

      const windowScan = KONFIGURASI_SISTEM.WINDOW_SCAN_MASUK_MENIT;
      const windowScanStart = new Date(waktuMulaiJadwal.getTime() - windowScan * 60000);
      
      if (sekarang < windowScanStart) return responseHelper.error(`Scan baru dibuka ${windowScan} menit sebelum kelas.`);
      if (sekarang > waktuSelesaiJadwal) return responseHelper.error("Gagal! Sesi kelas ini sudah berakhir.");

      let telat = sekarang > waktuMulaiJadwal ? Math.floor((sekarang - waktuMulaiJadwal) / 60000) : 0;

      await StudySession.create({
        siswaId: userId,
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        terlambatMenit: telat,
        status: STATUS_SESI.BERJALAN.id,
        waktuMulai: sekarang
      });

      revalidatePath(PERAN.SISWA.home);
      return responseHelper.success(`Check-in Berhasil! ${telat > KONFIGURASI_SISTEM.BATAS_TERLAMBAT_MENIT ? '(Terlambat '+telat+'m)' : 'Tepat Waktu!'}`);
    }

    if (jenisQR === TIPE_SESI.KONSUL) {
      if (!mapelPilihan) return responseHelper.error("Pilih Mata Pelajaran konsul terlebih dahulu!");

      await StudySession.create({
        siswaId: userId,
        jenisSesi: TIPE_SESI.KONSUL,
        namaMapel: mapelPilihan.trim(),
        status: STATUS_SESI.BERJALAN.id,
        waktuMulai: sekarang
      });

      revalidatePath(PERAN.SISWA.home);
      return responseHelper.success(`Sesi Konsul ${mapelPilihan} dimulai.`);
    }

  } catch (error) {
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

    if (!isLokasiValid(lokasi)) return responseHelper.error("📍 Lokasi tidak valid.");
    if (teksQR !== PREFIX_BARCODE.ADMIN) return responseHelper.error("⚠️ Barcode Staf tidak valid.");

    await StudySession.create({
      siswaId: userId,
      jenisSesi: TIPE_SESI.KELAS,
      namaMapel: "Kehadiran Staf",
      status: STATUS_SESI.SELESAI.id,
      waktuMulai: new Date(),
      waktuSelesai: new Date()
    });

    return responseHelper.success("✅ Absen Berhasil! Selamat mengabdi.");
  } catch (error) {
    return responseHelper.error("Gagal memproses absen staf.");
  }
}