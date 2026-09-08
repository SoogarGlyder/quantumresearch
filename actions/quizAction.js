"use server";

import connectToDatabase from "../lib/db"; 
import Quiz from "../models/Quiz";
import BankSoal from "../models/BankSoal";
import User from "../models/User"; 
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { authHelper } from "../utils/authHelper";
import { PERAN, CABANG_QUANTUM, PANGKAT_PENGAJAR } from "../utils/constants"; 

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// BAGIAN 1: MANAJEMEN BANK SOAL (MASTER TEMPLATE) - MULTI-TENANT FIX!
// ============================================================================

export async function ambilSemuaBankSoal(pembuatId) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return [];
    
    const userLogin = await User.findById(sesi.userId).select("kodeCabang peran pangkat").lean();
    if (!userLogin) return [];

    let query = {};
    
    // 1. SUPER ADMIN PUSAT (GOD MODE MUTLAK)
    if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang === CABANG_QUANTUM.PUSAT.id) {
      query = {}; 
    } 
    // 2. ADMIN CABANG / STAFF AKADEMIK / KAKAK ASUH
    else if (userLogin.peran === PERAN.ADMIN.id || (userLogin.peran === PERAN.PENGAJAR.id && (userLogin.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK || userLogin.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH))) {
      const guruCabang = await User.find({ kodeCabang: userLogin.kodeCabang }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => g._id);
      
      query = {
        $or: [
          { pembuatId: { $in: daftarIdGuru } }, 
          { isOfficial: true }                  
        ]
      };
    } 
    // 3. GURU BIASA
    else {
      query = {
        $or: [
          { pembuatId: userLogin._id },
          { isOfficial: true } 
        ]
      };
    }

    const data = await BankSoal.find(query)
      .select("judul durasi pembuatId isOfficial createdAt soal") 
      .populate("pembuatId", "nama kodeCabang") 
      .sort({ isOfficial: -1, createdAt: -1 }) 
      .lean(); 

    return serialize(data);
  } catch (error) {
    console.error("Error ambilSemuaBankSoal:", error);
    return [];
  }
}

export async function simpanBankSoal(idBankSoal, data) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    const userLogin = await User.findById(sesi.userId).select("kodeCabang peran").lean();
    
    if (data.pembuatId && mongoose.Types.ObjectId.isValid(data.pembuatId)) {
      data.pembuatId = new mongoose.Types.ObjectId(data.pembuatId);
    }

    if (idBankSoal) {
      if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
        const targetMaster = await BankSoal.findById(idBankSoal).populate("pembuatId", "kodeCabang").lean();
        if (targetMaster && targetMaster.pembuatId && targetMaster.pembuatId.kodeCabang !== userLogin.kodeCabang) {
           return { sukses: false, pesan: "Akses Ditolak: Anda tidak bisa mengedit Bank Soal milik cabang lain." };
        }
      }
      await BankSoal.updateOne({ _id: idBankSoal }, { $set: data });
    } else {
      await BankSoal.create(data);
    }

    revalidatePath("/admin");
    revalidatePath("/teacher/task"); 
    return { sukses: true, pesan: "Master Bank Soal berhasil disimpan!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal simpan master: " + error.message };
  }
}

export async function hapusBankSoal(idBankSoal) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    const userLogin = await User.findById(sesi.userId).select("kodeCabang peran").lean();

    if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetMaster = await BankSoal.findById(idBankSoal).populate("pembuatId", "kodeCabang").lean();
      if (targetMaster && targetMaster.pembuatId && targetMaster.pembuatId.kodeCabang !== userLogin.kodeCabang) {
         return { sukses: false, pesan: "Akses Ditolak: Anda tidak bisa menghapus Bank Soal milik cabang lain." };
      }
    }

    await BankSoal.deleteOne({ _id: idBankSoal });
    revalidatePath("/admin");
    revalidatePath("/teacher/task");
    return { sukses: true, pesan: "Master Bank Soal telah dihapus." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menghapus master." };
  }
}

// ============================================================================
// BAGIAN 2: PENERAPAN KE JADWAL (MENDUKUNG TRY OUT BUNDLE!)
// ============================================================================

// 🚀 FUNGSI BARU (DITINGKATKAN): Kini bisa membungkus beberapa bank soal sekaligus!
export async function terapkanBankSoalKeJadwal(idBankSoalUtama, idJadwal, idPengajar, jenisUjian = "KUIS", daftarSubtesId = []) {
  try {
    await connectToDatabase();

    let dataCopy = {
      jadwalId: idJadwal,
      pembuatId: idPengajar,
      isAktif: true,
      jenisUjian // "KUIS" atau "TRYOUT"
    };

    if (jenisUjian === "TRYOUT") {
      // MODE: TRY OUT (Bundel Estafet)
      if (!daftarSubtesId || daftarSubtesId.length === 0) {
        throw new Error("Try Out butuh setidaknya 1 subtes dari Bank Soal.");
      }

      const hasilRakitSubtes = [];
      
      // Ambil seluruh master bank soal yang di-request secara parallel untuk ngebut!
      const promises = daftarSubtesId.map(id => BankSoal.findById(id).select("judul durasi soal").lean());
      const daftarMaster = await Promise.all(promises);

      for (let i = 0; i < daftarMaster.length; i++) {
        const master = daftarMaster[i];
        if (!master) throw new Error(`Master soal subtes ke-${i+1} tidak ditemukan atau telah dihapus.`);
        
        hasilRakitSubtes.push({
          judulSubtes: master.judul,
          durasi: master.durasi || 10,
          soal: master.soal
        });
      }

      dataCopy.daftarSubtes = hasilRakitSubtes;
      // Opsional: Boleh mengosongkan atau memakai ID subtes pertama sebagai sumber perwakilan
      dataCopy.sumberBankSoalId = daftarSubtesId[0]; 

    } else {
      // MODE: KUIS HARIAN LAMA (Tetap Utuh!)
      if (!idBankSoalUtama) throw new Error("ID Bank Soal Utama wajib ada untuk mode KUIS.");
      
      const master = await BankSoal.findById(idBankSoalUtama).select("soal durasi").lean();
      if (!master) throw new Error("Master soal tidak ditemukan.");

      dataCopy.sumberBankSoalId = idBankSoalUtama;
      dataCopy.durasi = master.durasi;
      dataCopy.soal = master.soal;
    }

    // Replace jika sudah ada jadwal yang sama, atau buat baru (Upsert)
    await Quiz.findOneAndUpdate(
      { jadwalId: idJadwal },
      { $set: dataCopy },
      { upsert: true } 
    ).lean();

    revalidatePath("/");
    return { sukses: true, pesan: jenisUjian === "TRYOUT" ? "Bundel Try Out berhasil diterapkan!" : "Soal berhasil diterapkan!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menerapkan: " + error.message };
  }
}

export async function hapusQuizDariJadwal(idJadwal) {
  try {
    await connectToDatabase();
    
    const ModelHasilKuis = mongoose.models.HasilKuis || mongoose.model("HasilKuis");
    const adaHasil = await ModelHasilKuis.exists({ jadwalId: idJadwal });
    
    if (adaHasil) {
      return { sukses: false, pesan: "DITOLAK: Sudah ada siswa yang mengerjakan!" };
    }

    await Quiz.deleteOne({ jadwalId: idJadwal });
    revalidatePath("/");
    return { sukses: true, pesan: "Kuis / Try Out berhasil dilepas." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal melepas ujian." };
  }
}

export async function simpanKuis(jadwalId, pembuatId, dataSoal, durasi) {
  try {
    await connectToDatabase();
    const pId = mongoose.Types.ObjectId.isValid(pembuatId) ? new mongoose.Types.ObjectId(pembuatId) : null;

    // Catatan: Ini adalah simpan Kuis manual yang lama (tanpa lewat Bank Soal)
    // Tetap dipertahankan agar tidak ada tombol/fitur lawas yang crash
    await Quiz.findOneAndUpdate(
      { jadwalId },
      { 
        $set: {
          soal: dataSoal,
          pembuatId: pId,
          durasi: durasi || 10,
          isAktif: true,
          jenisUjian: "KUIS"
        }
      },
      { upsert: true }
    );

    revalidatePath("/admin"); 
    revalidatePath("/");
    return { sukses: true, pesan: "Kuis Berhasil Dipublikasikan!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal: " + error.message };
  }
}

export async function ambilKuisByJadwal(jadwalId) {
  if (!jadwalId) return null;
  try {
    await connectToDatabase();
    const kuis = await Quiz.findOne({ jadwalId }).lean();
    return kuis ? serialize(kuis) : null;
  } catch (error) {
    return null;
  }
}

export async function getRiwayatKuisPengajar(pembuatId) {
  try {
    await connectToDatabase();
    
    // 🚀 PERBAIKAN: Hitung jumlah soal juga dari daftarSubtes jika jenisnya TRYOUT
    const kuisPengajar = await Quiz.find({ pembuatId, isAktif: true })
      .populate('jadwalId', 'mapel kelasTarget tanggal')
      .select('jadwalId soal durasi daftarSubtes jenisUjian updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const dataBersih = kuisPengajar
      .filter(k => k.jadwalId) 
      .map(k => {
        let jmlSoal = 0;
        let waktu = 0;

        if (k.jenisUjian === "TRYOUT" && k.daftarSubtes) {
          jmlSoal = k.daftarSubtes.reduce((acc, sub) => acc + (sub.soal?.length || 0), 0);
          waktu = k.daftarSubtes.reduce((acc, sub) => acc + (sub.durasi || 0), 0);
        } else {
          jmlSoal = k.soal?.length || 0;
          waktu = k.durasi || 10;
        }

        return {
          jadwalId: k.jadwalId._id.toString(),
          mapel: k.jenisUjian === "TRYOUT" ? "Try Out UTBK" : k.jadwalId.mapel,
          kelas: k.jadwalId.kelasTarget,
          tanggal: k.jadwalId.tanggal,
          jumlahSoal: jmlSoal,
          durasi: waktu
        };
      });

    return { sukses: true, data: dataBersih };
  } catch (error) {
    return { sukses: false, data: [] };
  }
}
