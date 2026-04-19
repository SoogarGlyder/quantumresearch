"use server";

import connectToDatabase from "../lib/db"; 
import Quiz from "../models/Quiz";
import BankSoal from "../models/BankSoal";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// 🚀 IMPORT UNTUK PENGECEKAN SESI & ROLE
import { authHelper } from "../utils/authHelper";
import { PERAN } from "../utils/constants";

// ============================================================================
// BAGIAN 1: MANAJEMEN BANK SOAL (MASTER TEMPLATE) - Di Tab Task
// ============================================================================

export async function ambilSemuaBankSoal(pembuatId) {
  try {
    await connectToDatabase();
    
    // 🛡️ AMBIL SESI DARI SERVER (Keamanan Berlapis)
    const { peran } = await authHelper.ambilSesi();
    
    let query = {};

    /**
     * 🚀 LOGIKA "GOD MODE":
     * 1. Jika PERAN adalah ADMIN, biarkan query tetap KOSONG {}. 
     * Artinya Admin bisa melihat SEMUA soal dari SEMUA pengajar.
     * 2. Jika bukan Admin (PENGAJAR), maka paksa filter berdasarkan pembuatId.
     */
    if (peran !== PERAN.ADMIN.id) {
      // Pastikan pembuatId valid sebagai ObjectId jika bukan admin-sistem
      if (pembuatId && mongoose.Types.ObjectId.isValid(pembuatId)) {
        query.pembuatId = pembuatId;
      }
    }

    // POPULATE: Mengambil nama pembuat agar Admin tahu ini karya siapa
    const data = await BankSoal.find(query)
      .populate("pembuatId", "nama") 
      .sort({ createdAt: -1 })
      .lean();
      
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error ambilSemuaBankSoal:", error);
    return [];
  }
}

export async function simpanBankSoal(idBankSoal, data) {
  try {
    await connectToDatabase();
    
    // Pastikan pembuatId murni ObjectId sebelum masuk ke Mongo
    if (data.pembuatId && mongoose.Types.ObjectId.isValid(data.pembuatId)) {
      data.pembuatId = new mongoose.Types.ObjectId(data.pembuatId);
    }

    if (idBankSoal) {
      await BankSoal.findByIdAndUpdate(idBankSoal, data);
    } else {
      await BankSoal.create(data);
    }

    revalidatePath("/admin");
    revalidatePath("/teacher/task"); 
    return { sukses: true, pesan: "Master Bank Soal berhasil disimpan!" };
  } catch (error) {
    console.error("Gagal simpanBankSoal:", error);
    return { sukses: false, pesan: "Gagal simpan master: " + error.message };
  }
}

export async function hapusBankSoal(idBankSoal) {
  try {
    await connectToDatabase();
    await BankSoal.findByIdAndDelete(idBankSoal);
    revalidatePath("/admin");
    revalidatePath("/teacher/task");
    return { sukses: true, pesan: "Master Bank Soal telah dihapus." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menghapus master." };
  }
}

// ============================================================================
// BAGIAN 2: PENERAPAN KE JADWAL (SNAPSHOT / COPY)
// ============================================================================

export async function terapkanBankSoalKeJadwal(idBankSoal, idJadwal, idPengajar) {
  try {
    await connectToDatabase();

    const master = await BankSoal.findById(idBankSoal).lean();
    if (!master) throw new Error("Master soal tidak ditemukan.");

    const dataCopy = {
      jadwalId: idJadwal,
      sumberBankSoalId: idBankSoal,
      pembuatId: idPengajar,
      durasi: master.durasi,
      soal: master.soal, 
      isAktif: true
    };

    await Quiz.findOneAndUpdate(
      { jadwalId: idJadwal },
      { $set: dataCopy },
      { upsert: true, new: true }
    );

    revalidatePath("/");
    return { sukses: true, pesan: "Soal berhasil diterapkan ke kelas ini!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menerapkan soal: " + error.message };
  }
}

export async function hapusQuizDariJadwal(idJadwal) {
  try {
    await connectToDatabase();
    
    const kuis = await Quiz.findOne({ jadwalId: idJadwal }).lean();
    if (kuis?.hasilPengerjaan?.length > 0) {
      return { sukses: false, pesan: "DITOLAK: Sudah ada siswa yang mengerjakan!" };
    }

    await Quiz.findOneAndDelete({ jadwalId: idJadwal });
    revalidatePath("/");
    return { sukses: true, pesan: "Kuis berhasil dilepas dari jadwal ini." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal melepas kuis." };
  }
}

// ============================================================================
// BAGIAN 3: FUNGSI EKSISTING (TETAP UTUH)
// ============================================================================

export async function simpanKuis(jadwalId, pembuatId, dataSoal, durasi) {
  await connectToDatabase();
  try {
    const pembuatIdValid = mongoose.Types.ObjectId.isValid(pembuatId) 
      ? new mongoose.Types.ObjectId(pembuatId) 
      : null;

    const kuisLama = await Quiz.findOne({ jadwalId });

    if (kuisLama) {
      kuisLama.soal = dataSoal;
      kuisLama.pembuatId = pembuatIdValid; 
      kuisLama.durasi = durasi || 10; 
      kuisLama.isAktif = true; 
      await kuisLama.save();
    } else {
      await Quiz.create({
        jadwalId,
        pembuatId: pembuatIdValid,
        soal: dataSoal,
        durasi: durasi || 10, 
        isAktif: true
      });
    }

    revalidatePath("/admin"); 
    revalidatePath("/");
    return { sukses: true, pesan: "Kuis Pro Berhasil Dipublikasikan!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menyimpan kuis: " + error.message };
  }
}

export async function ambilKuisByJadwal(jadwalId) {
  if (!jadwalId) return null;
  await connectToDatabase();
  try {
    const kuis = await Quiz.findOne({ jadwalId }).lean();
    if (!kuis) return null;
    return JSON.parse(JSON.stringify(kuis));
  } catch (error) {
    return null;
  }
}

export async function getRiwayatKuisPengajar(pembuatId) {
  try {
    await connectToDatabase();
    const Jadwal = mongoose.models.Jadwal || mongoose.model("Jadwal");
    const kuisPengajar = await Quiz.find({ pembuatId, isAktif: true })
      .populate('jadwalId', 'mapel kelasTarget tanggal')
      .sort({ updatedAt: -1 })
      .lean();

    const dataBersih = kuisPengajar
      .filter(k => k.jadwalId) 
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
    return { sukses: false, data: [] };
  }
}