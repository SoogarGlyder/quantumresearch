"use server";

import connectToDatabase from "../lib/db";
import LatihanSoal from "../models/LatihanSoal";
import User from "../models/User";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { PERAN, PESAN_SISTEM, CABANG_QUANTUM, PANGKAT_PENGAJAR } from "../utils/constants"; 
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

// ============================================================================
// 1. INTERNAL HELPERS (Mencegah DRY & Mengurai Nama Target)
// ============================================================================
async function translasiTargetKeNamaSiswa(dataLatihanMentah) {
  let listPencarianSiswa = [];
  
  dataLatihanMentah.forEach(item => {
    if (item.tipeTarget === "SISWA") {
      if (Array.isArray(item.target)) listPencarianSiswa.push(...item.target);
      else if (item.target) listPencarianSiswa.push(item.target);
    }
  });

  if (listPencarianSiswa.length === 0) return dataLatihanMentah;

  const orQuery = [
    { username: { $in: listPencarianSiswa } },
    { nomorPeserta: { $in: listPencarianSiswa } }
  ];

  const dataSiswa = await User.find({ peran: PERAN.SISWA.id, $or: orQuery }).select("username nomorPeserta nama").lean();
  
  const mapNamaSiswa = {};
  dataSiswa.forEach(s => {
    if (s.username) mapNamaSiswa[s.username] = s.nama;
    if (s.nomorPeserta) mapNamaSiswa[s.nomorPeserta] = s.nama;
  });

  return dataLatihanMentah.map(item => {
    if (item.tipeTarget === "SISWA") {
      const arrayTarget = Array.isArray(item.target) ? item.target : [item.target];
      item.target = arrayTarget.map(t => mapNamaSiswa[t] || t).join(", ");
    }
    return item;
  });
}

// ============================================================================
// 2. MAIN ACTIONS
// ============================================================================
export async function dapatkanLatihanSiswa(username, kelasSiswa, kodeCabangSiswa) {
  noStore(); 
  try {
    await connectToDatabase();
    
    // PERBAIKAN: Gunakan trimInput
    const unameAman = validationHelper.trimInput(username);
    const kelasAman = validationHelper.trimInput(kelasSiswa);
    const cabangAman = validationHelper.trimInput(kodeCabangSiswa);

    let queryLatihan = {
      isAktif: true,
      $or: [{ tipeTarget: "SISWA", target: unameAman }, { tipeTarget: "KELAS", target: kelasAman }]
    };

    if (cabangAman && cabangAman !== CABANG_QUANTUM.PUSAT.id) {
      const guruCabang = await User.find({ kodeCabang: cabangAman }).select("_id").lean();
      queryLatihan.pembuatId = { $in: guruCabang.map(g => String(g._id)) };
    }

    const latihan = await LatihanSoal.find(queryLatihan)
      .select("judul mapel tipeTarget target isAktif linkSoal url createdAt namaPembuat") 
      .sort({ createdAt: -1 })
      .lean();

    if (!latihan || latihan.length === 0) return [];

    const dataSiap = await translasiTargetKeNamaSiswa(latihan);
    return JSON.parse(JSON.stringify(dataSiap));
  } catch (error) {
    console.error("[ERROR dapatkanLatihanSiswa]:", error);
    return [];
  }
}

export async function ambilSemuaLatihanSoal() {
  noStore(); 
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    let query = {};
    const isStaffAkademik = sesi.peran === PERAN.PENGAJAR.id && sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK;
    const isAdmin = sesi.peran === PERAN.ADMIN.id;
    
    if ((isAdmin || isStaffAkademik) && sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const guruCabang = await User.find({ kodeCabang: sesi.kodeCabang }).select("_id").lean();
      query.pembuatId = { $in: guruCabang.map(g => String(g._id)) };
    } else if (sesi.peran === PERAN.PENGAJAR.id && !isStaffAkademik) {
      query.pembuatId = String(sesi.userId);
    }

    const data = await LatihanSoal.find(query).select("-__v").sort({ createdAt: -1 }).lean();
    const dataSiap = await translasiTargetKeNamaSiswa(data);
      
    return responseHelper.success("Data berhasil ditarik", JSON.parse(JSON.stringify(dataSiap)));
  } catch (error) {
    console.error("[ERROR ambilSemuaLatihanSoal]:", error); 
    return responseHelper.error("Gagal mengambil data soal.");
  }
}

export async function prosesSimpanLatihanSoal(idRaw, dataForm) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const namaKreator = sesi.peran === PERAN.ADMIN.id ? "Admin Quantum" : `Kak ${sesi.nama}`;
    const id = validationHelper.trimInput(idRaw);

    const payload = {
      judul: validationHelper.trimInput(dataForm.judul),
      url: validationHelper.trimInput(dataForm.url),
      tipeTarget: validationHelper.trimInput(dataForm.tipeTarget),
      target: validationHelper.trimInput(dataForm.target),
      pembuatId: String(sesi.userId), 
      namaPembuat: namaKreator
    };

    if (id) await LatihanSoal.updateOne({ _id: id }, { $set: payload });
    else await LatihanSoal.create(payload);

    revalidatePath(PERAN.ADMIN.home);
    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath("/"); 
    return responseHelper.success(id ? "Latihan diperbarui!" : "Latihan dikirim ke siswa!");
  } catch (error) {
    console.error("[ERROR prosesSimpanLatihanSoal]:", error);
    return responseHelper.error("Gagal menyimpan latihan.");
  }
}

export async function prosesHapusLatihanSoal(idRaw) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const id = validationHelper.trimInput(idRaw);
    await LatihanSoal.deleteOne({ _id: id });
    
    revalidatePath(PERAN.ADMIN.home);
    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath("/");
    
    return responseHelper.success("Latihan soal berhasil ditarik/dihapus!");
  } catch (error) {
    return responseHelper.error("Gagal menghapus.");
  }
}

export async function ambilDaftarSiswaDropdown() {
  noStore(); 
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    
    let querySiswa = { peran: PERAN.SISWA.id };
    if (sesi && sesi.kodeCabang && sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
       querySiswa.kodeCabang = sesi.kodeCabang;
    }

    const data = await User.find(querySiswa).select("nama username kelas").sort({ nama: 1 }).lean();
    return responseHelper.success("Data siswa ditarik", JSON.parse(JSON.stringify(data)));
  } catch (error) {
    return responseHelper.error("Gagal menarik daftar siswa.");
  }
}