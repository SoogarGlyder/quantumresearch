"use server";

import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";
import User from "../models/User";
import Jadwal from "../models/Jadwal";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL HELPERS (Security & Asset Validation)
// ============================================================================

// Helper untuk memvalidasi apakah link benar-benar dari Cloudinary (Poin 35)
function isLinkValidCloudinary(url) {
  if (!url || typeof url !== "string") return false;
  // Memastikan link mengandung domain cloudinary.com
  return url.includes("res.cloudinary.com");
}

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
      return { sukses: false, pesan: "Sesi berakhir. Silakan login kembali." };
    }

    // 2. Sanitasi & Normalisasi Data Teks
    const babClean = (dataJurnal.bab || "").trim();
    const subBabClean = (dataJurnal.subBab || "").trim();

    if (!babClean) return { sukses: false, pesan: "Materi (Bab) wajib diisi!" };

    // 3. OPTIMALISASI ASET (Poin 16, 33, 35)
    let arrayGaleri = [];
    
    // Normalisasi Galeri: Mengubah string/array menjadi array bersih & unik
    const rawGaleri = typeof dataJurnal.galeriPapan === "string" 
      ? dataJurnal.galeriPapan.split(",") 
      : Array.isArray(dataJurnal.galeriPapan) ? dataJurnal.galeriPapan : [];

    arrayGaleri = rawGaleri
      .map(link => (typeof link === "string" ? link.trim() : ""))
      .filter(link => link !== "" && isLinkValidCloudinary(link)); // Hanya simpan link Cloudinary yang valid
    
    // Hapus duplikat (Poin 33)
    arrayGaleri = [...new Set(arrayGaleri)];

    // Validasi Foto Bersama
    const fotoBersamaClean = isLinkValidCloudinary(dataJurnal.fotoBersama) 
      ? dataJurnal.fotoBersama 
      : "";

    // 4. Update dengan Filter Keamanan (Poin 29)
    const queryKeamanan = { 
      _id: idJadwal, 
      pengajar: pengajar.nama 
    };

    // Admin bypass keamanan pengajar
    if (pengajar.peran === "admin") delete queryKeamanan.pengajar;

    const hasilUpdate = await Jadwal.findOneAndUpdate(
      queryKeamanan,
      {
        $set: {
          bab: babClean,
          subBab: subBabClean,
          galeriPapan: arrayGaleri,
          fotoBersama: fotoBersamaClean,
          jurnalTerakhirUpdate: new Date() 
        }
      },
      { new: true }
    );

    if (!hasilUpdate) {
      return { sukses: false, pesan: "Jadwal tidak ditemukan atau Anda tidak berhak mengubahnya." };
    }

    // Revalidasi spesifik agar dashboard admin & guru sinkron
    revalidatePath("/"); 
    revalidatePath("/admin");

    return { sukses: true, pesan: "✅ Jurnal & Foto Berhasil Diamankan!" };

  } catch (error) {
    console.error("[ERROR simpanJurnalGuru]:", error.message);
    return { sukses: false, pesan: "Gangguan server: Gagal menyimpan data jurnal." };
  }
}