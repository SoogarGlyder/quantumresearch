"use server";

import connectToDatabase from "../lib/db"; 
import Quiz from "../models/Quiz";
import BankSoal from "../models/BankSoal"; // 🚀 TAMBAHAN: Import Model Baru
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ============================================================================
// BAGIAN 1: MANAJEMEN BANK SOAL (MASTER TEMPLATE) - Di Tab Task
// ============================================================================

export async function ambilSemuaBankSoal(pembuatId) {
  try {
    await connectToDatabase();
    
    // 🚀 LOGIKA DEWA: Jika Admin, ambil semua (query kosong). Jika guru, ambil miliknya saja.
    let query = {};
    if (pembuatId && pembuatId !== "admin-sistem") {
      query.pembuatId = pembuatId;
    }

    // 🚀 POPULATE: Ambil nama pembuat agar Admin tahu ini soal buatan siapa
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
    
    if (idBankSoal) {
      await BankSoal.findByIdAndUpdate(idBankSoal, data);
    } else {
      await BankSoal.create(data);
    }

    revalidatePath("/teacher/task"); 
    return { sukses: true, pesan: "Master Bank Soal berhasil disimpan!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal simpan master: " + error.message };
  }
}

export async function hapusBankSoal(idBankSoal) {
  try {
    await connectToDatabase();
    await BankSoal.findByIdAndDelete(idBankSoal);
    revalidatePath("/teacher/task");
    return { sukses: true, pesan: "Master Bank Soal telah dihapus." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menghapus master." };
  }
}

// ============================================================================
// BAGIAN 2: PENERAPAN KE JADWAL (SNAPSHOT / COPY) - Di Modal Jurnal
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
      soal: master.soal, // Copy array soal murni
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
    
    // 🚀 PROTEKSI: Cek apakah sudah ada siswa yang mengerjakan?
    const kuis = await Quiz.findOne({ jadwalId: idJadwal }).lean();
    if (kuis?.hasilPengerjaan?.length > 0) {
      return { sukses: false, pesan: "DITOLAK: Sudah ada siswa yang mengerjakan, nilai bisa hilang!" };
    }

    await Quiz.findOneAndDelete({ jadwalId: idJadwal });
    revalidatePath("/");
    return { sukses: true, pesan: "Kuis berhasil dilepas dari jadwal ini." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal melepas kuis." };
  }
}


// ============================================================================
// BAGIAN 3: FUNGSI LAMA (EKSISTING) - TETAP UTUH 100%
// ============================================================================

/**
 * FUNGSI: Simpan atau Edit Kuis (Upsert) Secara Langsung
 */
export async function simpanKuis(jadwalId, pembuatId, dataSoal, durasi) {
  await connectToDatabase();
  
  try {
    const pembuatIdValid = mongoose.Types.ObjectId.isValid(pembuatId) 
      ? pembuatId 
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
    console.error("[QUIZ_SAVE_ERROR]:", error);
    return { sukses: false, pesan: "Gagal menyimpan kuis: " + error.message };
  }
}

/**
 * FUNGSI: Ambil data kuis (Digunakan di UI Siswa & Radar Guru)
 */
export async function ambilKuisByJadwal(jadwalId) {
  if (!jadwalId) return null;
  
  await connectToDatabase();
  
  try {
    const kuis = await Quiz.findOne({ jadwalId }).lean();
    if (!kuis) return null;

    return JSON.parse(JSON.stringify(kuis));
  } catch (error) {
    console.error("[GET_QUIZ_ERROR]:", error);
    return null;
  }
}

/**
 * FUNGSI: Mengambil riwayat kuis lama berdasarkan jadwal 
 */
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
    console.error("Error getRiwayatKuisPengajar:", error);
    return { sukses: false, data: [] };
  }
}