"use server";

import connectDB from "../lib/db"; 
import Jadwal from "../models/Jadwal"; 
import Quiz from "../models/Quiz";
import mongoose from "mongoose";

// ============================================================================
// FUNGSI: MENGAMBIL DATA KUIS UNTUK SISWA (ANTI-CHEAT & OPTIMIZED)
// ============================================================================
export const getKuisSiswa = async (jadwalId) => {
  try {
    await connectDB();

    // 1. Ambil info dasar (Mapel & Kelas) dari tabel Jadwal
    const jadwalData = await Jadwal.findById(jadwalId).select('mapel kelasTarget').lean();

    // 2. CARI SOAL DI TABEL QUIZ
    // Buang kunciJawaban agar tidak bocor ke Inspect Element browser siswa
    const dataKuis = await Quiz.findOne({ jadwalId: jadwalId, isAktif: true })
      .select('-soal.kunciJawaban') 
      .lean();

    // Jika Kuis tidak ditemukan atau array soalnya kosong
    if (!dataKuis || !dataKuis.soal || dataKuis.soal.length === 0) {
      return { sukses: false, pesan: "Soal ujian belum tersedia." };
    }

    // 🚀 PERBAIKAN BUG: 
    // Jangan diacak! Index array harus sama persis antara frontend dan database 
    // agar kalkulasi auto-grading kumpulkanUjianSiswa tidak salah kunci.
    const soalUjian = dataKuis.soal;

    return { 
      sukses: true, 
      data: {
        mapel: jadwalData?.mapel || "Kuis CBT",
        kelas: jadwalData?.kelasTarget || "-",
        jumlahSoal: soalUjian.length,
        soal: soalUjian
      } 
    };

  } catch (error) {
    console.error("Error getKuisSiswa:", error);
    return { sukses: false, pesan: "Terjadi kesalahan server." };
  }
};

// ============================================================================
// FUNGSI: MENGIRIM JAWABAN SISWA DAN KALKULASI SKOR OTOMATIS
// ============================================================================
export const kumpulkanUjianSiswa = async ({ jadwalId, siswaId, nama, jawabanSiswa }) => {
  try {
    await connectDB();

    const dataKuis = await Quiz.findOne({ jadwalId: jadwalId });
    
    if (!dataKuis) return { sukses: false, pesan: "Data Kuis tidak ditemukan." };

    const sudahPernah = dataKuis.hasilPengerjaan.some(h => h.siswaId.toString() === siswaId.toString());
    if (sudahPernah) return { sukses: false, pesan: "Anda sudah mengerjakan kuis ini." };

    const soalAsli = dataKuis.soal;
    
    // 🚀 LOGIKA AUTO-GRADING NEO
    let expDidapat = 0;
    let totalExpMaksimal = 0;

    jawabanSiswa.forEach((jawaban, index) => {
      const soalDatabase = soalAsli[index];
      
      if (soalDatabase) {
        // Ambil bobot exp dari soal (Default 20 jika tidak diset pengajar)
        const bobotSoal = Number(soalDatabase.bobotExp) || 20;
        totalExpMaksimal += bobotSoal;

        // Cocokkan jawaban
        if (jawaban === soalDatabase.kunciJawaban) {
          expDidapat += bobotSoal;
        }
      }
    });

    // 🚀 SKOR AKHIR BERDASARKAN BOBOT (Bukan sekadar jumlah benar)
    // Supaya adil: Soal susah (EXP besar) bernilai lebih tinggi dari soal mudah
    const skorAkhir = totalExpMaksimal > 0 ? Math.round((expDidapat / totalExpMaksimal) * 100) : 0;

    dataKuis.hasilPengerjaan.push({
      siswaId: siswaId,
      nama: nama,
      skor: skorAkhir,
      jawabanSiswa: jawabanSiswa,
      dikumpulkanPada: new Date()
    });

    await dataKuis.save();

    // 🚀 CATATAN UNTUK ANDA:
    // Buka komen ini jika Anda punya skema Model Siswa untuk menyimpan EXP Permanen
    /*
    const Siswa = mongoose.model('Siswa');
    if (Siswa) {
      await Siswa.findByIdAndUpdate(siswaId, { $inc: { exp: expDidapat } });
    }
    */

    return { sukses: true, skor: skorAkhir, exp: expDidapat };

  } catch (error) {
    console.error("Error kumpulkanUjian:", error);
    return { sukses: false, pesan: "Terjadi kesalahan saat memproses nilai." };
  }
};

// ============================================================================
// FUNGSI: CEK KETERSEDIAAN KUIS UNTUK KARTU BERANDA SISWA
// ============================================================================
export const cekKetersediaanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    const kuis = await Quiz.findOne({ jadwalId: jadwalId, isAktif: true }).lean();
    
    if (!kuis || !kuis.soal) return { ada: false };

    const riwayatPengerjaan = kuis.hasilPengerjaan?.find(
      (hasil) => hasil.siswaId.toString() === siswaId.toString()
    );

    return {
      ada: true,
      data: {
        _id: kuis._id.toString(),
        jumlahSoal: kuis.soal.length,
        durasi: kuis.durasi || 10,
        isSudahDikerjakan: !!riwayatPengerjaan, 
        skor: riwayatPengerjaan ? riwayatPengerjaan.skor : null,
      }
    };
  } catch (error) {
    console.error("Error cek kuis:", error);
    return { ada: false };
  }
};

// ============================================================================
// FUNGSI: MENGAMBIL DATA PEMBAHASAN KUIS (HANYA UNTUK YANG SUDAH SELESAI)
// ============================================================================
export const getPembahasanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    
    const dataKuis = await Quiz.findOne({ jadwalId: jadwalId }).lean();
    if (!dataKuis) return { sukses: false, pesan: "Data Kuis tidak ditemukan." };

    const riwayatPengerjaan = dataKuis.hasilPengerjaan?.find(
      (hasil) => hasil.siswaId.toString() === siswaId.toString()
    );

    if (!riwayatPengerjaan) {
      return { sukses: false, pesan: "Akses ditolak. Anda belum menyelesaikan ujian ini." };
    }

    return {
      sukses: true,
      data: {
        soal: dataKuis.soal, 
        jawabanSiswa: riwayatPengerjaan.jawabanSiswa 
      }
    };
  } catch (error) {
    console.error("Error getPembahasan:", error);
    return { sukses: false, pesan: "Terjadi kesalahan server saat memuat pembahasan." };
  }
};

// ============================================================================
// FUNGSI: MENGAMBIL RIWAYAT CBT YANG SUDAH SELESAI (UNTUK TAB JURNAL/KELAS)
// ============================================================================
export const getRiwayatKuisSiswa = async (siswaId) => {
  try {
    await connectDB();
    
    const Quiz = require("../models/Quiz").default || require("../models/Quiz");
    const Jadwal = require("../models/Jadwal").default || require("../models/Jadwal");

    const kuisSelesai = await Quiz.find({ "hasilPengerjaan.siswaId": siswaId }).lean();
    
    if (!kuisSelesai || kuisSelesai.length === 0) return { sukses: true, data: [] };

    const dataRiwayat = await Promise.all(kuisSelesai.map(async (k) => {
      const jadwal = await Jadwal.findById(k.jadwalId).select('mapel bab tanggal').lean();
      const hasil = k.hasilPengerjaan.find(h => h.siswaId.toString() === siswaId.toString());
      
      return {
        _id: k._id.toString(),
        jadwalId: k.jadwalId.toString(),
        mapel: jadwal?.mapel || "Kuis CBT",
        bab: jadwal?.bab || "Ujian",
        tanggal: jadwal?.tanggal || new Date(),
        skor: hasil ? hasil.skor : 0,
        jumlahSoal: k.soal.length
      };
    }));

    dataRiwayat.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    return { sukses: true, data: dataRiwayat };
  } catch (error) {
    console.error("Error getRiwayatKuisSiswa:", error);
    return { sukses: false, data: [] };
  }
};