"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { STATUS_SESI, TIPE_SESI, PREFIX_BARCODE } from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. GEOFENCING CONFIG (Wajib di Arjawinangun)
// ============================================================================
const HQ_LAT = -6.1672807190869445;
const HQ_LNG = 106.87065857296675;
const RADIUS_TOLERANSI_METER = 100;

function isLokasiValid(lokasi) {
  if (!lokasi?.lat || !lokasi?.lng) return false;

  const R = 6371e3; // Jari-jari bumi dalam meter
  const φ1 = (lokasi.lat * Math.PI) / 180;
  const φ2 = (HQ_LAT * Math.PI) / 180;
  const Δφ = ((HQ_LAT - lokasi.lat) * Math.PI) / 180;
  const Δλ = ((HQ_LNG - lokasi.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const jarak = R * c;
  return jarak <= RADIUS_TOLERANSI_METER;
}

// ============================================================================
// 2. CORE SCAN LOGIC (SISWA)
// ============================================================================

export async function prosesHasilScan(teksQR, mapelPilihan, lokasi) {
  try {
    await connectToDatabase();
    
    // 1. Validasi Identitas & Lokasi
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error("Sesi habis, silakan login ulang.");

    const siswa = await User.findById(userId).lean();
    if (!siswa || siswa.status !== "aktif") return responseHelper.error("Akun dinonaktifkan.");

    if (!isLokasiValid(lokasi)) {
      return responseHelper.error("📍 Gagal! Anda berada di luar jangkauan Quantum.");
    }

    const sekarang = new Date();
    const tglHariIni = timeHelper.getTglJakarta(sekarang);

    // 2. Identifikasi QR
    let jenisQR = null;
    if (teksQR.startsWith(PREFIX_BARCODE.KELAS)) jenisQR = TIPE_SESI.KELAS;
    else if (teksQR === PREFIX_BARCODE.KONSUL) jenisQR = TIPE_SESI.KONSUL;

    if (!jenisQR) return responseHelper.error("⚠️ Barcode tidak valid.");

    // 3. Cek Sesi Berjalan (Status lowercase 'berjalan' dari constants)
    let sesiAktif = await StudySession.findOne({ 
      siswaId: userId, 
      status: STATUS_SESI.BERJALAN 
    });

    // Handle Sesi Lupa Scan Out hari sebelumnya
    if (sesiAktif) {
      const tglSesiLama = timeHelper.getTglJakarta(sesiAktif.waktuMulai);
      if (tglSesiLama !== tglHariIni) {
        sesiAktif.status = STATUS_SESI.SELESAI;
        sesiAktif.waktuSelesai = sesiAktif.waktuMulai; 
        await sesiAktif.save();
        sesiAktif = null;
      }
    }

    // --- LOGIKA PULANG (Check-Out) ---
    if (sesiAktif) {
      const durasiMenit = Math.floor((sekarang - sesiAktif.waktuMulai) / 60000);

      if (sesiAktif.jenisSesi === TIPE_SESI.KELAS) {
        if (durasiMenit < 15) return responseHelper.error(`Belum 15 menit. Tunggu ${15 - durasiMenit}m lagi.`);

        // Hitung Bonus Konsul (Overtime setelah jadwal berakhir)
        let menitExtra = 0;
        const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tglHariIni }).lean();
        if (jadwal) {
          const waktuSelesaiJadwal = new Date(`${tglHariIni}T${jadwal.jamSelesai}:00+07:00`);
          if (sekarang > waktuSelesaiJadwal) {
            menitExtra = Math.floor((sekarang - waktuSelesaiJadwal) / 60000);
          }
        }

        sesiAktif.status = STATUS_SESI.SELESAI;
        sesiAktif.waktuSelesai = sekarang;
        sesiAktif.konsulExtraMenit = Math.max(0, menitExtra);
        await sesiAktif.save();

        revalidatePath("/dashboard");
        return responseHelper.success(`Berhasil Pulang! ${menitExtra > 0 ? '(+'+menitExtra+'m Konsul)' : ''}`);
      }

      if (sesiAktif.jenisSesi === TIPE_SESI.KONSUL) {
        if (durasiMenit < 5) {
          await StudySession.findByIdAndDelete(sesiAktif._id);
          return responseHelper.success("Sesi Konsul dibatalkan (kurang dari 5 menit).");
        }
        sesiAktif.status = STATUS_SESI.SELESAI;
        sesiAktif.waktuSelesai = sekarang;
        await sesiAktif.save();
        
        revalidatePath("/dashboard");
        return responseHelper.success("Sesi Konsul Selesai. Selamat istirahat!");
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

      if (sekarang < new Date(waktuMulaiJadwal.getTime() - 30 * 60000)) return responseHelper.error("Scan dibuka 30m sebelum kelas.");
      if (sekarang > waktuSelesaiJadwal) return responseHelper.error("Gagal! Kelas sudah berakhir.");

      const telat = sekarang > waktuMulaiJadwal ? Math.floor((sekarang - waktuMulaiJadwal) / 60000) : 0;

      await StudySession.create({
        siswaId: userId,
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        terlambatMenit: telat,
        status: STATUS_SESI.BERJALAN,
        waktuMulai: sekarang
      });

      revalidatePath("/dashboard");
      return responseHelper.success(`Selamat Belajar! ${telat > 0 ? '(Telat '+telat+'m)' : 'Tepat Waktu!'}`);
    }

    if (jenisQR === TIPE_SESI.KONSUL) {
      if (!mapelPilihan) return responseHelper.error("Pilih Mata Pelajaran konsul dulu!");

      await StudySession.create({
        siswaId: userId,
        jenisSesi: TIPE_SESI.KONSUL,
        namaMapel: mapelPilihan.trim(),
        status: STATUS_SESI.BERJALAN,
        waktuMulai: sekarang
      });

      revalidatePath("/dashboard");
      return responseHelper.success(`Sesi Konsul ${mapelPilihan} Dimulai!`);
    }

  } catch (error) {
    return responseHelper.error("Terjadi gangguan sistem absensi.", error);
  }
}

// ============================================================================
// 3. CORE SCAN LOGIC (STAFF/GURU)
// ============================================================================

export async function absenGuruAction(teksQR, lokasi) {
  try {
    await connectToDatabase();
    
    const { userId, peran } = await authHelper.ambilSesi();
    if (!userId || (peran !== "pengajar" && peran !== "admin")) {
      return responseHelper.error("Akses ditolak! Khusus Staff.");
    }

    if (!isLokasiValid(lokasi)) return responseHelper.error("📍 Di luar jangkauan Quantum.");
    if (teksQR !== PREFIX_BARCODE.ADMIN) return responseHelper.error("⚠️ Barcode Staf Tidak Valid.");

    await StudySession.create({
      siswaId: userId,
      jenisSesi: TIPE_SESI.KELAS,
      namaMapel: "Kehadiran Pengajar",
      status: STATUS_SESI.SELESAI,
      waktuMulai: new Date(),
      waktuSelesai: new Date()
    });

    return responseHelper.success("✅ Absen Berhasil! Semangat mengajar!");
  } catch (error) {
    return responseHelper.error("Gagal memproses absen staf.", error);
  }
}