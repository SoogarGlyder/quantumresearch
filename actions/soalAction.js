"use server";

import connectToDatabase from "../lib/db";
import LatihanSoal from "../models/LatihanSoal";
import User from "../models/User";
import { cookies } from "next/headers";
//FIX: Tambahkan import PANGKAT_PENGAJAR
import { KONFIGURASI_SISTEM, PERAN, PESAN_SISTEM, CABANG_QUANTUM, PANGKAT_PENGAJAR } from "../utils/constants"; 
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

async function getIdentitasValid() {
  const cookieStore = await cookies();
  const karcis = cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  if (!karcis) return null;
  //FIX: Tambahkan penarikan "pangkat" agar mata Sharingan Staff Akademik aktif
  return await User.findById(karcis).select("peran nama _id kodeCabang pangkat").lean(); 
}

export async function dapatkanLatihanSiswa(username, kelasSiswa, kodeCabangSiswa) {
  noStore(); 
  try {
    await connectToDatabase();
    
    let queryLatihan = {
      isAktif: true,
      $or: [{ tipeTarget: "SISWA", target: username }, { tipeTarget: "KELAS", target: kelasSiswa }]
    };

    if (kodeCabangSiswa && kodeCabangSiswa !== CABANG_QUANTUM.PUSAT.id) {
      const guruCabang = await User.find({ kodeCabang: kodeCabangSiswa }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => String(g._id)); 
      
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
    
    //FIX: Deteksi Otoritas Tingkat Tinggi
    const isStaffAkademik = String(userAsli.peran) === String(PERAN.PENGAJAR.id) && userAsli.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK;
    const isAdmin = String(userAsli.peran) === String(PERAN.ADMIN.id);
    
    // FILTERISASI MULTI-TENANT (RBAC)
    if ((isAdmin || isStaffAkademik) && userAsli.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      // 1. Admin Cabang & Staff Akademik: Tarik tugas milik SEMUA pengajar di cabangnya
      const guruCabang = await User.find({ kodeCabang: userAsli.kodeCabang }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => String(g._id));
      query.pembuatId = { $in: daftarIdGuru };
    } else if (String(userAsli.peran) === String(PERAN.PENGAJAR.id) && !isStaffAkademik) {
      // 2. Pengajar Biasa / Freelance / Kakak Asuh: Hanya lihat tugasnya sendiri
      query.pembuatId = String(userAsli._id);
    }
    // 3. Jika Super Admin Pusat (000000), query kosong = Tarik Semua Data se-Indonesia

    const data = await LatihanSoal.find(query)
      .select("-__v") 
      .sort({ dibuatPada: -1 }).lean();
      
    return { sukses: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    console.error("[ERROR ambilSemuaLatihanSoal]:", error); // Amankan layar pengguna dari error database
    return { sukses: false, pesan: "Gagal mengambil data soal." };
  }
}

export async function prosesSimpanLatihanSoal(id, dataForm) {
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    if (!userAsli) return { sukses: false, pesan: PESAN_SISTEM.AKSES_DITOLAK };

    //FIX: Penamaan Pembuat yang Dinamis & Rapi
    let namaKreator = `Kak ${userAsli.nama}`;
    if (String(userAsli.peran) === String(PERAN.ADMIN.id)) {
      namaKreator = "Admin Quantum";
    } else if (userAsli.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK) {
      namaKreator = `Staff Akademik (${userAsli.nama})`;
    }

    const payload = {
      ...dataForm,
      pembuatId: String(userAsli._id), 
      namaPembuat: namaKreator
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
    console.error("[ERROR prosesSimpanLatihanSoal]:", error);
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
    console.error("[ERROR prosesHapusLatihanSoal]:", error);
    return { sukses: false, pesan: "Gagal menghapus." };
  }
}

export async function ambilDaftarSiswaDropdown() {
  noStore(); 
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    
    let querySiswa = { peran: PERAN.SISWA.id };
    
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