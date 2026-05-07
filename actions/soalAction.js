"use server";

import connectToDatabase from "../lib/db";
import LatihanSoal from "../models/LatihanSoal";
import User from "../models/User";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM, PERAN, PESAN_SISTEM, CABANG_QUANTUM } from "../utils/constants"; // FIX: Import CABANG_QUANTUM
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

async function getIdentitasValid() {
  const cookieStore = await cookies();
  const karcis = cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  if (!karcis) return null;
  // FIX: Tarik kodeCabang agar bisa digunakan untuk filter
  return await User.findById(karcis).select("peran nama _id kodeCabang").lean(); 
}

export async function dapatkanLatihanSiswa(username, kelasSiswa, kodeCabangSiswa) {
  noStore(); 
  try {
    await connectToDatabase();
    
    let queryLatihan = {
      isAktif: true,
      $or: [{ tipeTarget: "SISWA", target: username }, { tipeTarget: "KELAS", target: kelasSiswa }]
    };

    // FIX: Filter Bahan Ajar Lintas Cabang
    if (kodeCabangSiswa && kodeCabangSiswa !== CABANG_QUANTUM.PUSAT.id) {
      // Cari semua ID guru yang mengajar di cabang yang sama dengan murid
      const guruCabang = await User.find({ kodeCabang: kodeCabangSiswa }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => String(g._id)); // Ubah ke array string ID
      
      // Kunci pencarian tugas hanya pada tugas yang dibuat oleh guru-guru tersebut
      queryLatihan.pembuatId = { $in: daftarIdGuru };
    }

    const latihan = await LatihanSoal.find(queryLatihan)
      .select("judul mapel tipeTarget target isAktif linkSoal url dibuatPada namaPembuat") 
      .sort({ dibuatPada: -1 })
      .lean();

    if (!latihan || latihan.length === 0) return [];
    return JSON.parse(JSON.stringify(latihan));
  } catch (error) {
    return [];
  }
}

export async function ambilSemuaLatihanSoal() {
  noStore(); 
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    if (!userAsli) return { sukses: false, pesan: PESAN_SISTEM.AKSES_DITOLAK };

    let query = {};
    
    // FILTERISASI MULTI-TENANT (RBAC)
    if (String(userAsli.peran) === String(PERAN.PENGAJAR.id)) {
      // 1. Pengajar biasa: Hanya lihat tugasnya sendiri
      query.pembuatId = String(userAsli._id);
    } else if (String(userAsli.peran) === String(PERAN.ADMIN.id) && userAsli.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      // 2. Admin Cabang: Tarik tugas milik semua pengajar di cabangnya
      const guruCabang = await User.find({ kodeCabang: userAsli.kodeCabang }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => String(g._id));
      query.pembuatId = { $in: daftarIdGuru };
    }
    // 3. Jika Super Admin Pusat (000000), query kosong = Tarik Semua Data

    const data = await LatihanSoal.find(query)
      .select("-__v") 
      .sort({ dibuatPada: -1 }).lean();
      
    return { sukses: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    return { sukses: false, pesan: "Gagal mengambil data soal." };
  }
}

export async function prosesSimpanLatihanSoal(id, dataForm) {
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    if (!userAsli) return { sukses: false, pesan: PESAN_SISTEM.AKSES_DITOLAK };

    const payload = {
      ...dataForm,
      pembuatId: String(userAsli._id), 
      namaPembuat: String(userAsli.peran) === String(PERAN.ADMIN.id) ? "Admin Quantum" : `Kak ${userAsli.nama}`
    };

    if (id) {
      await LatihanSoal.updateOne({ _id: id }, { $set: payload });
    } else {
      await LatihanSoal.create(payload);
    }

    revalidatePath(PERAN.ADMIN.home);
    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath("/"); 
    return { sukses: true, pesan: id ? "Latihan diupdate!" : "Latihan dikirim!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menyimpan." };
  }
}

export async function prosesHapusLatihanSoal(id) {
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    if (!userAsli) return { sukses: false, pesan: PESAN_SISTEM.AKSES_DITOLAK };

    await LatihanSoal.deleteOne({ _id: id });
    
    revalidatePath(PERAN.ADMIN.home);
    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath("/");
    return { sukses: true, pesan: "Data dihapus!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menghapus." };
  }
}

export async function ambilDaftarSiswaDropdown() {
  noStore(); 
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    
    let querySiswa = { peran: PERAN.SISWA.id };
    
    // FILTERISASI: Dropdown nama siswa di form Tugas hanya menampilkan siswa secabang
    if (userAsli && userAsli.kodeCabang && userAsli.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
       querySiswa.kodeCabang = userAsli.kodeCabang;
    }

    const data = await User.find(querySiswa)
      .select("nama username kelas")
      .sort({ nama: 1 })
      .lean();
      
    return { sukses: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    return { sukses: false, data: [] };
  }
}