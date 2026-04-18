"use server";

import connectToDatabase from "../lib/db"; 
import Quiz from "../models/Quiz";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

/**
 * FUNGSI: Simpan atau Edit Kuis (Upsert)
 */
// 🚀 PERBAIKAN: Menambahkan parameter "durasi" di urutan keempat
export async function simpanKuis(jadwalId, pembuatId, dataSoal, durasi) {
  await connectToDatabase();
  
  try {
    // 🚀 VALIDASI: Pastikan pembuatId adalah ObjectId yang valid
    // Jika formatnya salah, kita gunakan null atau handle agar tidak crash
    const pembuatIdValid = mongoose.Types.ObjectId.isValid(pembuatId) 
      ? pembuatId 
      : null;

    // 1. Cari apakah kuis untuk jadwal ini sudah pernah dibuat?
    const kuisLama = await Quiz.findOne({ jadwalId });

    if (kuisLama) {
      // 🚀 UPDATE: Masukkan soal, pembuat, dan durasi terbaru
      kuisLama.soal = dataSoal;
      kuisLama.pembuatId = pembuatIdValid; 
      kuisLama.durasi = durasi || 10; // 🚀 Update durasi ujian
      kuisLama.isAktif = true; // Pastikan kuis aktif saat diupdate
      
      await kuisLama.save();
    } else {
      // 🚀 CREATE: Buat baru dengan struktur lengkap beserta durasinya
      await Quiz.create({
        jadwalId,
        pembuatId: pembuatIdValid,
        soal: dataSoal,
        durasi: durasi || 10, // 🚀 Simpan durasi ujian
        isAktif: true
      });
    }

    // Refresh semua path yang berkepentingan
    revalidatePath("/admin"); 
    revalidatePath("/");
    
    return { sukses: true, pesan: "Kuis Pro Berhasil Dipublikasikan!" };
  } catch (error) {
    console.error("[QUIZ_SAVE_ERROR]:", error);
    return { sukses: false, pesan: "Gagal menyimpan kuis: " + error.message };
  }
}

/**
 * FUNGSI: Ambil data kuis
 */
export async function ambilKuisByJadwal(jadwalId) {
  if (!jadwalId) return null;
  
  await connectToDatabase();
  
  try {
    const kuis = await Quiz.findOne({ jadwalId }).lean();
    if (!kuis) return null;

    // Menghilangkan keanehan object Mongoose agar aman dikirim ke Client Component
    return JSON.parse(JSON.stringify(kuis));
  } catch (error) {
    console.error("[GET_QUIZ_ERROR]:", error);
    return null;
  }
}

export async function getRiwayatKuisPengajar(pembuatId) {
  try {
    await connectToDatabase();
    
    // Pastikan model Jadwal dimuat agar populate berfungsi
    const Jadwal = mongoose.models.Jadwal || mongoose.model("Jadwal");
    
    // Cari semua kuis yang dibuat guru ini, ambil detail jadwalnya
    const kuisPengajar = await Quiz.find({ pembuatId, isAktif: true })
      .populate('jadwalId', 'mapel kelasTarget tanggal')
      .sort({ updatedAt: -1 })
      .lean();

    const dataBersih = kuisPengajar
      .filter(k => k.jadwalId) // Pastikan jadwalnya belum dihapus
      .map(k => ({
        jadwalId: k.jadwalId._id.toString(),
        mapel: k.jadwalId.mapel,
        kelas: k.jadwalId.kelasTarget,
        tanggal: k.jadwalId.tanggal,
        jumlahSoal: k.soal?.length || 0,
        durasi: k.durasi || 10
      }));

    return { sukses: true, data: dataBersih };
  } catch (error) {
    console.error("Error getRiwayatKuisPengajar:", error);
    return { sukses: false, data: [] };
  }
}