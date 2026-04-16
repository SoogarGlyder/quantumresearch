"use server";

import connectToDatabase from "../lib/db";
import LatihanSoal from "../models/LatihanSoal";
import User from "../models/User";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM, PERAN, PESAN_SISTEM } from "../utils/constants";
// 🚀 IMPORT ANTI-CACHE NEXT.JS
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

async function getIdentitasValid() {
  const cookieStore = await cookies();
  const karcis = cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  if (!karcis) return null;
  return await User.findById(karcis).select("peran nama _id").lean();
}

// ============================================================================
// 1. FUNGSI UNTUK CLIENT (HP SISWA)
// ============================================================================
export async function dapatkanLatihanSiswa(username, kelasSiswa) {
  noStore(); // 🚀 Matikan Cache
  try {
    await connectToDatabase();
    
    // 🚀 PERBAIKAN BUG: Ubah findOne menjadi find() agar mengambil SEMUA tugas
    const latihan = await LatihanSoal.find({
      isAktif: true,
      $or: [
        { tipeTarget: "SISWA", target: username },
        { tipeTarget: "KELAS", target: kelasSiswa }
      ]
    }).sort({ dibuatPada: -1 }).lean();

    // Jika tidak ada data, kembalikan array kosong []
    if (!latihan || latihan.length === 0) return [];
    
    // Mengembalikan array berisi seluruh daftar tugas
    return JSON.parse(JSON.stringify(latihan));
  } catch (error) {
    return [];
  }
}

// ============================================================================
// 2. FUNGSI UNTUK DASHBOARD ADMIN & PENGAJAR
// ============================================================================
export async function ambilSemuaLatihanSoal() {
  noStore(); // 🚀 MATIKAN CACHE! Agar Pengajar tidak dapat "fotokopi" data Admin
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    if (!userAsli) return { sukses: false, pesan: PESAN_SISTEM.AKSES_DITOLAK };

    let query = {};
    // 🚀 BUNGKUS DENGAN String() AGAR PASTI COCOK
    if (String(userAsli.peran) !== String(PERAN.ADMIN.id)) {
       query = { pembuatId: String(userAsli._id) };
    }

    const data = await LatihanSoal.find(query).sort({ dibuatPada: -1 }).lean();
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
      pembuatId: String(userAsli._id), // 🚀 Simpan murni sebagai Teks String
      namaPembuat: String(userAsli.peran) === String(PERAN.ADMIN.id) ? "Admin Quantum" : `Kak ${userAsli.nama}`
    };

    if (id) {
      await LatihanSoal.findByIdAndUpdate(id, payload);
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

    await LatihanSoal.findByIdAndDelete(id);
    revalidatePath(PERAN.ADMIN.home);
    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath("/");
    return { sukses: true, pesan: "Data dihapus!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menghapus." };
  }
}

// ============================================================================
// 3. FUNGSI UNTUK DROPDOWN SISWA DI HP PENGAJAR
// ============================================================================
export async function ambilDaftarSiswaDropdown() {
  noStore(); // 🚀 Matikan Cache
  try {
    await connectToDatabase();
    const data = await User.find({ peran: PERAN.SISWA.id })
      .select("nama username kelas")
      .sort({ nama: 1 })
      .lean();
    return { sukses: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    return { sukses: false, data: [] };
  }
}