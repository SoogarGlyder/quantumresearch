"use server";

import connectToDatabase from "../lib/db";
import Quiz from "../models/Quiz";
import BankSoal from "../models/BankSoal";
import User from "../models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper"; // 🔥 Import Validation Helper
import { syncHelper } from "../utils/syncHelper"; // 🔥 Import Sync Helper
import { PERAN, CABANG_QUANTUM, PANGKAT_PENGAJAR } from "../utils/constants";

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 0. INTERNAL SECURITY & HELPERS
// ============================================================================
async function ambilDataAkses() {
  const sesi = await authHelper.ambilSesi();
  if (!sesi || !sesi.userId) return null;
  const userLogin = await User.findById(sesi.userId).select("kodeCabang peran pangkat nama").lean();
  return userLogin;
}

// ============================================================================
// BAGIAN 1: MANAJEMEN BANK SOAL (MASTER TEMPLATE)
// ============================================================================
export async function ambilSemuaBankSoal() {
  try {
    await connectToDatabase();
    const userLogin = await ambilDataAkses();
    if (!userLogin) return [];

    let query = {};
    if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang === CABANG_QUANTUM.PUSAT.id) {
      // Super Admin: Bisa lihat semua
      query = {};
    } else if (
      userLogin.peran === PERAN.ADMIN.id || 
      (userLogin.peran === PERAN.PENGAJAR.id && (userLogin.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK || userLogin.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH))
    ) {
      // Admin Cabang / Staff Akademik: Bisa lihat buatan pusat & buatan guru cabang tersebut
      const guruCabang = await User.find({ kodeCabang: userLogin.kodeCabang }).select("_id").lean();
      query = { $or: [{ pembuatId: { $in: guruCabang.map(g => g._id) } }, { isOfficial: true }] };
    } else {
      // Pengajar Biasa: Hanya lihat buatan sendiri & buatan pusat
      query = { $or: [{ pembuatId: userLogin._id }, { isOfficial: true }] };
    }

    const data = await BankSoal.find(query)
      .select("judul durasi pembuatId namaPembuat isOfficial createdAt soal")
      .populate("pembuatId", "nama kodeCabang")
      .sort({ isOfficial: -1, createdAt: -1 })
      .lean();

    return serialize(data);
  } catch (error) {
    console.error("[ERROR ambilSemuaBankSoal]:", error);
    return [];
  }
}

export async function simpanBankSoal(idBankSoalRaw, dataMentah) {
  try {
    await connectToDatabase();
    const userLogin = await ambilDataAkses();
    if (!userLogin) return responseHelper.error("Akses Ditolak: Sesi Habis.");

    // 🔥 Sanitasi dasar
    const idBankSoal = validationHelper.trimInput(idBankSoalRaw);
    const data = { ...dataMentah }; // Clone objek

    if (data.pembuatId && validationHelper.isValidObjectId(data.pembuatId)) {
      data.pembuatId = new mongoose.Types.ObjectId(data.pembuatId);
    }

    data.namaPembuat = userLogin ? userLogin.nama : "Admin Quantum";
    data.kodeCabang = userLogin.kodeCabang; // Pastikan tercatat di cabangnya

    if (idBankSoal) {
      if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
        const targetMaster = await BankSoal.findById(idBankSoal).populate("pembuatId", "kodeCabang").lean();
        if (targetMaster && targetMaster.pembuatId && targetMaster.pembuatId.kodeCabang !== userLogin.kodeCabang) {
          return responseHelper.error("Akses Ditolak: Anda tidak bisa mengedit Bank Soal milik cabang lain.");
        }
      }
      await BankSoal.updateOne({ _id: idBankSoal }, { $set: data });
    } else {
      await BankSoal.create(data);
    }

    revalidatePath("/admin");
    revalidatePath("/teacher/task");
    return responseHelper.success("Master Bank Soal berhasil disimpan!");
  } catch (error) {
    console.error("[ERROR simpanBankSoal]:", error);
    return responseHelper.error("Gagal simpan master bank soal.");
  }
}

export async function hapusBankSoal(idBankSoalRaw) {
  try {
    await connectToDatabase();
    const userLogin = await ambilDataAkses();
    if (!userLogin) return responseHelper.error("Akses Ditolak: Sesi Habis.");

    const idBankSoal = validationHelper.trimInput(idBankSoalRaw);

    if (userLogin.peran === PERAN.ADMIN.id && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetMaster = await BankSoal.findById(idBankSoal).populate("pembuatId", "kodeCabang").lean();
      if (targetMaster && targetMaster.pembuatId && targetMaster.pembuatId.kodeCabang !== userLogin.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Anda tidak bisa menghapus Bank Soal milik cabang lain.");
      }
    }

    await BankSoal.deleteOne({ _id: idBankSoal });
    
    revalidatePath("/admin");
    revalidatePath("/teacher/task");
    return responseHelper.success("Master Bank Soal telah dihapus.");
  } catch (error) {
    console.error("[ERROR hapusBankSoal]:", error);
    return responseHelper.error("Gagal menghapus master bank soal.");
  }
}

// ============================================================================
// BAGIAN 2: PENERAPAN KE JADWAL (QUIZ AKTIF)
// ============================================================================
export async function terapkanBankSoalKeJadwal(idBankSoalRaw, idJadwalRaw, idPengajarRaw) {
  try {
    await connectToDatabase();
    
    const idBankSoal = validationHelper.trimInput(idBankSoalRaw);
    const idJadwal = validationHelper.trimInput(idJadwalRaw);
    const idPengajar = validationHelper.trimInput(idPengajarRaw);

    const master = await BankSoal.findById(idBankSoal).select("soal durasi").lean();
    if (!master) return responseHelper.error("Master soal tidak ditemukan.");

    const guru = await User.findById(idPengajar).select("nama kodeCabang").lean();

    const dataCopy = {
      jadwalId: idJadwal,
      sumberBankSoalId: idBankSoal,
      pembuatId: idPengajar,
      namaPembuat: guru ? guru.nama : "Pengajar",
      kodeCabang: guru ? guru.kodeCabang : CABANG_QUANTUM.PUSAT.id,
      durasiMenit: master.durasi || 10,
      soal: master.soal,
      isAktif: true
    };

    await Quiz.findOneAndUpdate(
      { jadwalId: idJadwal },
      { $set: dataCopy },
      { upsert: true }
    ).lean();

    revalidatePath("/");
    return responseHelper.success("Soal berhasil diterapkan ke Jadwal!");
  } catch (error) {
    console.error("[ERROR terapkanBankSoalKeJadwal]:", error);
    return responseHelper.error("Gagal menerapkan soal ke jadwal.");
  }
}

export async function hapusQuizDariJadwal(idJadwalRaw) {
  try {
    await connectToDatabase();
    const idJadwal = validationHelper.trimInput(idJadwalRaw);

    // Dynamic import to avoid circular dependency loop if HasilKuis is called elsewhere
    const ModelHasilKuis = mongoose.models.HasilKuis || mongoose.model("HasilKuis");
    const adaHasil = await ModelHasilKuis.exists({ jadwalId: idJadwal });

    if (adaHasil) return responseHelper.error("DITOLAK: Sudah ada siswa yang mulai mengerjakan!");

    await Quiz.deleteOne({ jadwalId: idJadwal });
    revalidatePath("/");
    return responseHelper.success("Kuis berhasil dilepas dari Jadwal.");
  } catch (error) {
    console.error("[ERROR hapusQuizDariJadwal]:", error);
    return responseHelper.error("Gagal melepas kuis.");
  }
}

export async function simpanKuis(jadwalIdRaw, pembuatIdRaw, dataSoal, durasi) {
  try {
    await connectToDatabase();
    const jadwalId = validationHelper.trimInput(jadwalIdRaw);
    const pembuatId = validationHelper.trimInput(pembuatIdRaw);

    const pId = validationHelper.isValidObjectId(pembuatId) ? new mongoose.Types.ObjectId(pembuatId) : null;
    const kreator = pId ? await User.findById(pId).select("nama kodeCabang").lean() : null;

    await Quiz.findOneAndUpdate(
      { jadwalId },
      {
        $set: {
          soal: dataSoal,
          pembuatId: pId,
          namaPembuat: kreator ? kreator.nama : "Pengajar",
          kodeCabang: kreator ? kreator.kodeCabang : CABANG_QUANTUM.PUSAT.id,
          durasiMenit: durasi || 10,
          isAktif: true
        }
      },
      { upsert: true }
    );

    revalidatePath("/admin");
    revalidatePath("/");
    return responseHelper.success("Kuis Berhasil Dipublikasikan ke Siswa!");
  } catch (error) {
    console.error("[ERROR simpanKuis]:", error);
    return responseHelper.error("Gagal mempublikasikan kuis.");
  }
}

export async function ambilKuisByJadwal(jadwalIdRaw) {
  if (!jadwalIdRaw) return null;
  try {
    await connectToDatabase();
    const jadwalId = validationHelper.trimInput(jadwalIdRaw);
    const kuis = await Quiz.findOne({ jadwalId }).lean();
    return kuis ? serialize(kuis) : null;
  } catch (error) {
    console.error("[ERROR ambilKuisByJadwal]:", error);
    return null;
  }
}

export async function getRiwayatKuisPengajar(pembuatIdRaw) {
  try {
    await connectToDatabase();
    const pembuatId = validationHelper.trimInput(pembuatIdRaw);

    const kuisPengajar = await Quiz.find({ pembuatId, isAktif: true })
      .populate('jadwalId', 'mapel kelasTarget tanggal')
      .select('jadwalId soal durasiMenit updatedAt')
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
        durasi: k.durasiMenit || 10
      }));

    return responseHelper.success("Riwayat CBT berhasil dimuat.", dataBersih);
  } catch (error) {
    console.error("[ERROR getRiwayatKuisPengajar]:", error);
    return responseHelper.error("Gagal memuat riwayat kuis pengajar.");
  }
}