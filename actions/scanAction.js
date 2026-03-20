"use server";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";

import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import User from "../models/User";

import { PREFIX_BARCODE } from "../utils/constants";

// ============================================================================
// 2. INTERNAL HELPERS (Keamanan & GPS Geofencing)
// ============================================================================
const HQ_LAT = -6.1672807190869445;
const HQ_LNG = 106.87065857296675;
const RADIUS_TOLERANSI_METER = 100;

function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function cekLokasiSah(lat, lng) {
  if (!lat || !lng) return false;
  const jarak = hitungJarak(lat, lng, HQ_LAT, HQ_LNG);
  return jarak <= RADIUS_TOLERANSI_METER;
}

async function dapatkanUserLogin() {
  const cookieStore = await cookies();
  const idUser = cookieStore.get("karcis_quantum")?.value;
  if (!idUser) return null;
  return await User.findById(idUser).select("_id nama kelas peran status").lean();
}

function dapatkanTanggalJakarta(tanggalObj) {
  return tanggalObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

function buatWaktuWIB(tanggalStr, jamStr) {
  return new Date(`${tanggalStr}T${jamStr}:00+07:00`);
}

// ============================================================================
// 3. FUNGSI SCAN SISWA (KELAS & KONSUL)
// ============================================================================
export async function prosesHasilScan(teksQR, mapelPilihan, lokasi) {
  try {
    await connectToDatabase();
    
    const siswa = await dapatkanUserLogin();
    if (!siswa) return { sukses: false, pesan: "Sesi habis, silakan login ulang." };
    if (siswa.status === "tidak aktif") return { sukses: false, pesan: "Akun nonaktif!" };

    if (!cekLokasiSah(lokasi?.lat, lokasi?.lng)) {
      return { sukses: false, pesan: "📍 Gagal! Anda berada di luar jangkauan Quantum." };
    }

    const sekarang = new Date();
    const tanggalHariIni = dapatkanTanggalJakarta(sekarang);

    let jenisQR = "Tidak Valid";
    if (teksQR.startsWith(PREFIX_BARCODE.KELAS)) jenisQR = "Kelas";
    else if (teksQR === PREFIX_BARCODE.KONSUL) jenisQR = "Konsul";

    if (jenisQR === "Tidak Valid") {
      return { sukses: false, pesan: "⚠️ Barcode tidak valid." };
    }

    let sesiAktif = await StudySession.findOne({ siswaId: siswa._id, status: "Berjalan" });
    let pesanTambahan = ""; 

    if (sesiAktif) {
      const tglSesiLama = dapatkanTanggalJakarta(sesiAktif.waktuMulai);
      if (tglSesiLama !== tanggalHariIni) {
        sesiAktif.status = "Selesai (Lupa Scan Out)";
        sesiAktif.waktuSelesai = sesiAktif.waktuMulai;
        await sesiAktif.save();
        sesiAktif = null; 
      }
    }

    if (sesiAktif) {
      const selisihMenit = Math.floor((sekarang - sesiAktif.waktuMulai) / 60000);
      if (sesiAktif.jenisSesi === "Kelas") {
        if (selisihMenit < 15) return { sukses: false, pesan: `Tunggu ${15 - selisihMenit}m lagi untuk pulang.` };
        
        let menitExtra = 0;
        const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tanggalHariIni }).lean();
        if (jadwal) {
          const waktuSelesaiJadwal = buatWaktuWIB(tanggalHariIni, jadwal.jamSelesai);
          if (sekarang > waktuSelesaiJadwal) menitExtra = Math.floor((sekarang - waktuSelesaiJadwal) / 60000);
        }

        sesiAktif.status = "Selesai";
        sesiAktif.waktuSelesai = sekarang;
        sesiAktif.konsulExtraMenit = Math.max(0, menitExtra);
        await sesiAktif.save();

        if (jenisQR === "Kelas" || (jenisQR === "Konsul" && !mapelPilihan)) {
          return { sukses: true, pesan: `Berhasil Pulang! ${menitExtra > 0 ? '(+'+menitExtra+'m)' : ''}`.trim() };
        }
        pesanTambahan = `Pulang Kelas. `;
      } 
      else if (sesiAktif.jenisSesi === "Konsul") {
        if (selisihMenit < 5) await StudySession.findByIdAndDelete(sesiAktif._id);
        else { sesiAktif.status = "Selesai"; sesiAktif.waktuSelesai = sekarang; await sesiAktif.save(); }
        if (jenisQR === "Konsul" && !mapelPilihan) return { sukses: true, pesan: "Sesi Konsul Selesai!" };
        pesanTambahan = "Sesi lama ditutup. ";
      }
    }

    if (jenisQR === "Kelas") {
      const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tanggalHariIni }).lean();
      if (!jadwal) return { sukses: false, pesan: "Tidak ada jadwal kelas untukmu hari ini." };

      const barcodeHarusnya = `${PREFIX_BARCODE.KELAS}${jadwal.mapel.toUpperCase()}`;
      if (teksQR !== barcodeHarusnya) return { sukses: false, pesan: `⚠️ Salah Barcode! Gunakan barcode ${jadwal.mapel}.` };

      const waktuMulaiJadwal = buatWaktuWIB(tanggalHariIni, jadwal.jamMulai);
      const waktuSelesaiJadwal = buatWaktuWIB(tanggalHariIni, jadwal.jamSelesai);
      if (sekarang < new Date(waktuMulaiJadwal.getTime() - 30 * 60000)) return { sukses: false, pesan: "Scan dibuka 30m sebelum kelas." };
      if (sekarang > waktuSelesaiJadwal) return { sukses: false, pesan: "Gagal! Kelas sudah berakhir." };

      let telat = sekarang > waktuMulaiJadwal ? Math.floor((sekarang - waktuMulaiJadwal) / 60000) : 0;
      await StudySession.create({ siswaId: siswa._id, jenisSesi: "Kelas", namaMapel: jadwal.mapel, terlambatMenit: telat, status: "Berjalan" });
      return { sukses: true, pesan: `${pesanTambahan}Selamat Belajar! ${telat > 0 ? '(Telat '+telat+'m)' : ''}`.trim() };
    }

    if (jenisQR === "Konsul") {
      if (!mapelPilihan) return { sukses: false, pesan: "Pilih Mapel dulu!" };
      await StudySession.create({ siswaId: siswa._id, jenisSesi: "Konsul", namaMapel: mapelPilihan.trim(), status: "Berjalan" });
      return { sukses: true, pesan: `${pesanTambahan}Mulai Konsul ${mapelPilihan.trim()}!`.trim() };
    }
  } catch (error) {
    return { sukses: false, pesan: "Error sistem." };
  }
}

// ============================================================================
// 4. FUNGSI SCAN GURU / STAFF
// ============================================================================
export async function absenGuruAction(teksQR, lokasi) {
  try {
    await connectToDatabase();
    
    const guru = await dapatkanUserLogin();
    if (!guru || (guru.peran !== "pengajar" && guru.peran !== "admin")) {
      return { sukses: false, pesan: "Akses ditolak! Hanya staf yang bisa absen di sini." };
    }

    if (!cekLokasiSah(lokasi?.lat, lokasi?.lng)) {
      return { sukses: false, pesan: "📍 Anda berada di luar area kantor Quantum." };
    }

    if (teksQR !== PREFIX_BARCODE.ADMIN) {
      return { sukses: false, pesan: "⚠️ Barcode staf tidak valid." };
    }

    await StudySession.create({
      siswaId: guru._id,
      jenisSesi: "Kelas",
      namaMapel: "Kehadiran Pengajar",
      status: "Selesai",
      waktuMulai: new Date(),
      waktuSelesai: new Date()
    });

    return { sukses: true, pesan: `✅ Absen Berhasil! Semangat mengajar, ${guru.nama}!` };

  } catch (error) {
    return { sukses: false, pesan: "Gagal memproses absen staf." };
  }
}