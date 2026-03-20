"use server";

import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";
import User from "../models/User";
import Jadwal from "../models/Jadwal";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL HELPERS (Security Optimized - FASE 7)
// ============================================================================
async function dapatkanIdentitasPengajar() {
  try {
    const cookieStore = await cookies();
    const idUser = cookieStore.get("karcis_quantum")?.value;
    const peranCookie = cookieStore.get("peran_quantum")?.value;
    
    if (!idUser) return null;

    const roleSah = ["pengajar", "admin"];
    if (peranCookie && roleSah.includes(peranCookie)) {
      const user = await User.findById(idUser).select("peran nama").lean();
      return user;
    }
    
    return null;
  } catch (error) {
    console.error("[SECURITY dapatkanIdentitasPengajar]:", error.message);
    return null;
  }
}

// ============================================================================
// 2. TEACHER ACTIONS
// ============================================================================
export async function simpanJurnalGuru(idJadwal, dataJurnal) {
  try {
    await connectToDatabase();
    
    // 1. Validasi Identitas & Otoritas
    const pengajar = await dapatkanIdentitasPengajar();
    if (!pengajar) {
      return { sukses: false, pesan: "Sesi berakhir atau Anda tidak memiliki akses pengajar." };
    }

    // 2. Sanitasi & Normalisasi Data
    const babClean = (dataJurnal.bab || "").trim();
    const subBabClean = (dataJurnal.subBab || "").trim();

    if (!babClean) return { sukses: false, pesan: "Bab materi wajib diisi!" };

    // Poin 33: Normalisasi link galeri (String ke Array yang bersih)
    let arrayGaleri = [];
    if (typeof dataJurnal.galeriPapan === "string") {
      arrayGaleri = dataJurnal.galeriPapan
        .split(",")
        .map(link => link.trim())
        .filter(link => link !== ""); // Hapus string kosong
    } else if (Array.isArray(dataJurnal.galeriPapan)) {
      arrayGaleri = dataJurnal.galeriPapan.filter(link => link && link.trim() !== "");
    }

    // 3. Update dengan Filter Keamanan (Poin 29: Null-safe)
    const queryKeamanan = { 
      _id: idJadwal, 
      pengajar: pengajar.nama // Memastikan guru hanya mengisi jurnalnya sendiri
    };

    // Bypass jika admin yang mengisi
    if (pengajar.peran === "admin") delete queryKeamanan.pengajar;

    const hasilUpdate = await Jadwal.findOneAndUpdate(
      queryKeamanan,
      {
        $set: {
          bab: babClean,
          subBab: subBabClean,
          galeriPapan: arrayGaleri,
          fotoBersama: dataJurnal.fotoBersama || "",
          jurnalTerakhirUpdate: new Date() 
        }
      },
      { new: true }
    );

    if (!hasilUpdate) {
      return { sukses: false, pesan: "Gagal: Jadwal tidak ditemukan atau Anda tidak berhak mengisi jadwal ini." };
    }

    // Refresh cache agar data terbaru langsung muncul di dashboard guru
    revalidatePath("/"); 

    return { sukses: true, pesan: "Jurnal & Foto berhasil diamankan ke server!" };

  } catch (error) {
    console.error("[ERROR simpanJurnalGuru]:", error.message);
    return { sukses: false, pesan: "Terjadi gangguan sistem saat menyimpan jurnal." };
  }
}