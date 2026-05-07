"use server";

import connectToDatabase from "../lib/db"; 
import Quiz from "../models/Quiz";
import BankSoal from "../models/BankSoal";
import User from "../models/User"; // DITAMBAHKAN: Untuk mengecek data cabang user
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { authHelper } from "../utils/authHelper";
import { PERAN, CABANG_QUANTUM, PANGKAT_PENGAJAR } from "../utils/constants"; // DITAMBAHKAN: Konstanta Cabang & Pangkat

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// BAGIAN 1: MANAJEMEN BANK SOAL (MASTER TEMPLATE)
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
      // THE ULTIMATE FIX: Kita abaikan pembuatId dari Frontend.
      // Super Admin dipaksa menarik seluruh data tanpa filter apapun.
      query = {}; 
    } 
    // 2. ADMIN CABANG / STAFF AKADEMIK / KAKAK ASUH
    else if (userLogin.peran === PERAN.ADMIN.id || (userLogin.peran === PERAN.PENGAJAR.id && (userLogin.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK || userLogin.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH))) {
      const guruCabang = await User.find({ kodeCabang: userLogin.kodeCabang }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => g._id);
      
      if (pembuatId && mongoose.Types.ObjectId.isValid(pembuatId)) {
        const isGuruCabangIni = daftarIdGuru.some(id => id.toString() === pembuatId.toString());
        query.pembuatId = isGuruCabangIni ? pembuatId : { $in: daftarIdGuru }; 
      } else {
        query.pembuatId = { $in: daftarIdGuru };
      }
    } 
    // 3. GURU BIASA
    else {
      query.pembuatId = userLogin._id;
    }

    const data = await BankSoal.find(query)
      .select("judul durasi pembuatId createdAt soal") 
      .populate("pembuatId", "nama kodeCabang") 
      .sort({ createdAt: -1 })
      .lean(); 
      
    // // 📡 RADAR DEBUGGING (Cek di Terminal VSCode!)
    // console.log("=== DEBUG BANK SOAL ===");
    // console.log(`Peran User: ${userLogin.peran} | Cabang: ${userLogin.kodeCabang}`);
    // console.log(`Query MongoDB:`, query);
    // console.log(`Jumlah Soal Dikirim ke UI Frontend: ${data.length} buah`);
    // console.log("=======================");

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
      // IDOR PROTECTION: Mencegah Admin Cabang mengedit soal milik Cabang Lain
      if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
        const targetMaster = await BankSoal.findById(idBankSoal).populate("pembuatId", "kodeCabang").lean();
        if (targetMaster && targetMaster.pembuatId && targetMaster.pembuatId.kodeCabang !== userLogin.kodeCabang) {
           return { sukses: false, pesan: "Akses Ditolak: Anda tidak bisa mengedit Bank Soal milik cabang lain." };
        }
      }

      // OPTIMASI: updateOne (Tanpa load data ke RAM)
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

    // IDOR PROTECTION: Mencegah Admin Cabang menghapus soal milik Cabang Lain
    if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetMaster = await BankSoal.findById(idBankSoal).populate("pembuatId", "kodeCabang").lean();
      if (targetMaster && targetMaster.pembuatId && targetMaster.pembuatId.kodeCabang !== userLogin.kodeCabang) {
         return { sukses: false, pesan: "Akses Ditolak: Anda tidak bisa menghapus Bank Soal milik cabang lain." };
      }
    }

    // OPTIMASI: deleteOne
    await BankSoal.deleteOne({ _id: idBankSoal });
    revalidatePath("/admin");
    revalidatePath("/teacher/task");
    return { sukses: true, pesan: "Master Bank Soal telah dihapus." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menghapus master." };
  }
}

// ============================================================================
// BAGIAN 2: PENERAPAN KE JADWAL
// ============================================================================

export async function terapkanBankSoalKeJadwal(idBankSoal, idJadwal, idPengajar) {
  try {
    await connectToDatabase();

    // OPTIMASI: Select soal dan durasi saja
    const master = await BankSoal.findById(idBankSoal).select("soal durasi").lean();
    if (!master) throw new Error("Master soal tidak ditemukan.");

    const dataCopy = {
      jadwalId: idJadwal,
      sumberBankSoalId: idBankSoal,
      pembuatId: idPengajar,
      durasi: master.durasi,
      soal: master.soal, 
      isAktif: true
    };

    // OPTIMASI: findOneAndUpdate dengan upsert (Atomic)
    await Quiz.findOneAndUpdate(
      { jadwalId: idJadwal },
      { $set: dataCopy },
      { upsert: true } 
    ).lean();

    revalidatePath("/");
    return { sukses: true, pesan: "Soal berhasil diterapkan!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menerapkan soal: " + error.message };
  }
}

export async function hapusQuizDariJadwal(idJadwal) {
  try {
    await connectToDatabase();
    
    // Cek keberadaan hasil pengerjaan (Hanya field ini saja)
    const kuis = await Quiz.findOne({ jadwalId: idJadwal }).select("hasilPengerjaan").lean();
    if (kuis?.hasilPengerjaan?.length > 0) {
      return { sukses: false, pesan: "DITOLAK: Sudah ada siswa yang mengerjakan!" };
    }

    await Quiz.deleteOne({ jadwalId: idJadwal });
    revalidatePath("/");
    return { sukses: true, pesan: "Kuis berhasil dilepas." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal melepas kuis." };
  }
}

// ============================================================================
// BAGIAN 3: FUNGSI EKSISTING
// ============================================================================

export async function simpanKuis(jadwalId, pembuatId, dataSoal, durasi) {
  try {
    await connectToDatabase();
    const pId = mongoose.Types.ObjectId.isValid(pembuatId) ? new mongoose.Types.ObjectId(pembuatId) : null;

    // OPTIMASI: findOneAndUpdate (Satu kali tembak ke DB)
    await Quiz.findOneAndUpdate(
      { jadwalId },
      { 
        $set: {
          soal: dataSoal,
          pembuatId: pId,
          durasi: durasi || 10,
          isAktif: true
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
    
    const kuisPengajar = await Quiz.find({ pembuatId, isAktif: true })
      .populate('jadwalId', 'mapel kelasTarget tanggal')
      .select('jadwalId soal durasi updatedAt')
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