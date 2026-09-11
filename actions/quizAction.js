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

export async function ambilSemuaBankSoal(pembuatId) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return [];
    
    const userLogin = await User.findById(sesi.userId).select("kodeCabang peran pangkat").lean();
    if (!userLogin) return [];

    let query = {};
    if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang === CABANG_QUANTUM.PUSAT.id) {
      query = {}; 
    } else if (userLogin.peran === PERAN.ADMIN.id || (userLogin.peran === PERAN.PENGAJAR.id && (userLogin.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK || userLogin.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH))) {
      const guruCabang = await User.find({ kodeCabang: userLogin.kodeCabang }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => g._id);
      query = {
        $or: [
          { pembuatId: { $in: daftarIdGuru } }, 
          { isOfficial: true }                  
        ]
      };
    } else {
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
// PENERAPAN KE JADWAL (ROBUST TRY OUT BUNDLE + LIMITASI KUOTA & JEDA DINAMIS)
// ============================================================================
export async function terapkanBankSoalKeJadwal(
  idBankSoalUtama, 
  idJadwal, 
  idPengajar, 
  jenisUjian = "KUIS", 
  daftarSubtesId = [], 
  jumlahSubtesDikerjakan = 5,
  batasSubtesWajib = 3,
  durasiBreakMenit = 60
) {
  try {
    await connectToDatabase();

    let dataCopy = {
      jadwalId: idJadwal,
      pembuatId: idPengajar ? new mongoose.Types.ObjectId(idPengajar) : undefined,
      isAktif: true,
      jenisUjian: jenisUjian || "KUIS",
      jumlahSubtesDikerjakan: Number(jumlahSubtesDikerjakan) || 0,
      batasSubtesWajib: Number(batasSubtesWajib) || 3,
      durasiBreakMenit: Number(durasiBreakMenit) || 60
    };

    if (jenisUjian === "TRYOUT") {
      if (!daftarSubtesId || daftarSubtesId.length === 0) {
        return { sukses: false, pesan: "Try Out butuh setidaknya 1 subtes dari Bank Soal." };
      }

      const hasilRakitSubtes = [];
      
      for (let i = 0; i < daftarSubtesId.length; i++) {
        const id = daftarSubtesId[i];
        const master = await BankSoal.findById(id).lean();
        if (!master) {
          return { sukses: false, pesan: `Master soal subtes ke-${i+1} tidak ditemukan.` };
        }
        
        hasilRakitSubtes.push({
          judulSubtes: master.judul || `Subtes ${i+1}`,
          durasi: Number(master.durasi) || 10,
          soal: master.soal || []
        });
      }

      dataCopy.daftarSubtes = hasilRakitSubtes;
      dataCopy.soal = [];
      dataCopy.durasi = 0;
      dataCopy.sumberBankSoalId = new mongoose.Types.ObjectId(daftarSubtesId[0]); 

    } else {
      if (!idBankSoalUtama) return { sukses: false, pesan: "ID Bank Soal Utama wajib ada untuk mode KUIS." };
      
      const master = await BankSoal.findById(idBankSoalUtama).lean();
      if (!master) return { sukses: false, pesan: "Master soal tidak ditemukan." };

      dataCopy.sumberBankSoalId = new mongoose.Types.ObjectId(idBankSoalUtama);
      dataCopy.durasi = Number(master.durasi) || 10;
      dataCopy.soal = master.soal || [];
      dataCopy.daftarSubtes = [];
    }

    await Quiz.findOneAndUpdate(
      { jadwalId: idJadwal },
      { $set: dataCopy },
      { upsert: true, new: true, strict: false }
    ).lean();

    revalidatePath("/");
    return { sukses: true, pesan: jenisUjian === "TRYOUT" ? "Bundel Try Out berhasil diterapkan!" : "Soal berhasil diterapkan!" };
  } catch (error) {
    console.error("Error terapkanBankSoalKeJadwal:", error);
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
    return { sukses: true, pesan: "Ujian berhasil dilepas." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal melepas ujian." };
  }
}

export async function simpanKuis(jadwalId, pembuatId, dataSoal, durasi) {
  try {
    await connectToDatabase();
    const pId = mongoose.Types.ObjectId.isValid(pembuatId) ? new mongoose.Types.ObjectId(pembuatId) : null;

    await Quiz.findOneAndUpdate(
      { jadwalId },
      { 
        $set: {
          soal: dataSoal,
          pembuatId: pId,
          durasi: durasi || 10,
          isAktif: true,
          jenisUjian: "KUIS",
          daftarSubtes: []
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
