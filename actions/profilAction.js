"use server";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// Models
import User from "../models/User";

// ============================================================================
// 2. INTERNAL HELPERS (Middleware Auth & Security)
// ============================================================================
async function validasiAkses(idTarget) {
  try {
    const cookieStore = await cookies();
    const karcis = cookieStore.get("karcis_quantum");
    
    if (!karcis || !karcis.value) return false;

    if (String(karcis.value) === String(idTarget)) return true;

    const userLokal = await User.findById(karcis.value).select("peran").lean();
    return userLokal && userLokal.peran === "admin";
  } catch (error) {
    console.error("[SECURITY validasiAkses]:", error.message);
    return false;
  }
}

// ============================================================================
// 3. PROFILE ACTIONS
// ============================================================================
export async function updateProfilSiswa(idSiswa, usernameBaru, passwordBaru) {
  try {
    await connectToDatabase();

    // 1. Validasi Hak Akses
    const punyaAkses = await validasiAkses(idSiswa);
    if (!punyaAkses) {
      return { sukses: false, pesan: "Akses Ditolak! Anda tidak berhak mengubah profil akun ini." };
    }

    let updateData = {};

    // 2. Validasi & Sanitasi Username Baru
    if (usernameBaru && usernameBaru.trim() !== "") {
      const cleanUsername = usernameBaru.trim().toLowerCase();

      const usernameRegex = /^[a-z0-9_.-]+$/;
      if (!usernameRegex.test(cleanUsername)) {
        return { 
          sukses: false, 
          pesan: "Username hanya boleh huruf, angka, titik (.), strip (-), atau underscore (_) tanpa spasi." 
        };
      }

      const cekUsername = await User.findOne({ 
        username: cleanUsername, 
        _id: { $ne: idSiswa } 
      }).select("_id").lean();

      if (cekUsername) {
        return { sukses: false, pesan: "Username sudah dipakai, silakan cari kombinasi yang lain." };
      }
      
      updateData.username = cleanUsername;
    }

    // 3. Validasi & Enkripsi Password Baru
    if (passwordBaru && passwordBaru.trim() !== "") {
      const cleanPassword = passwordBaru.trim();
      
      if (cleanPassword.length < 6) {
         return { sukses: false, pesan: "Kata sandi baru minimal harus 6 karakter agar aman!" };
      }
      
      updateData.password = await bcrypt.hash(cleanPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
       return { sukses: true, pesan: "Tidak ada data profil yang diubah." };
    }

    await User.findByIdAndUpdate(idSiswa, updateData);

    return { sukses: true, pesan: "Profil berhasil diperbarui!" };
    
  } catch (error) {
    console.error("[ERROR updateProfilSiswa]:", error.message);
    return { sukses: false, pesan: "Terjadi kesalahan sistem server saat memperbarui profil." };
  }
}