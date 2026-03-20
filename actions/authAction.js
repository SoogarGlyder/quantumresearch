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
// 2. INTERNAL HELPERS (Security Optimized - FASE 7)
// ============================================================================
async function cekAdmin() {
  try {
    const cookieStore = await cookies();
    const karcis = cookieStore.get("karcis_quantum")?.value;
    const peran = cookieStore.get("peran_quantum")?.value;
    
    if (!karcis) return false;

    if (peran === "admin") return true;
    
    const user = await User.findById(karcis).select("peran").lean();
    return user && user.peran === "admin";
  } catch (error) {
    console.error("[SECURITY cekAdmin]:", error.message);
    return false; 
  }
}

// ============================================================================
// 3. AUTHENTICATION & REGISTRATION ACTIONS
// ============================================================================

export async function prosesTambahSiswa(dataFormulir) {
  try {
    await connectToDatabase();
    
    if (!(await cekAdmin())) {
      return { sukses: false, pesan: "Akses Ditolak! Hanya Admin yang dapat menambah akun." };
    }

    const formNomorPeserta = (dataFormulir.nomorPeserta || "").trim();
    const formNoHp = (dataFormulir.noHp || "").trim();
    
    let rawUsername = dataFormulir.username;
    if (!rawUsername || rawUsername.trim() === "") {
      rawUsername = formNomorPeserta;
    }
    const formUsername = rawUsername.trim().toLowerCase();

    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(formUsername)) {
      return { 
        sukses: false, 
        pesan: "Gagal: Username hanya boleh mengandung huruf, angka, titik, strip, atau underscore." 
      };
    }

    const akunLama = await User.findOne({ 
      $or: [
        { username: formUsername },
        { nomorPeserta: formNomorPeserta },
        { noHp: formNoHp }
      ]
    }).select("_id").lean();

    if (akunLama) {
      return { sukses: false, pesan: "Gagal: Data (Username/No Peserta/WA) sudah dipakai akun lain!" };
    }

    const passwordHashed = await bcrypt.hash(dataFormulir.password, 10);

    await User.create({
      nama: (dataFormulir.nama || "").trim(),
      nomorPeserta: formNomorPeserta, 
      username: formUsername,         
      password: passwordHashed,
      noHp: formNoHp,
      peran: dataFormulir.peran || "siswa",
      kelas: dataFormulir.kelas,
      jadwalKelas: dataFormulir.jadwalKelas,
      jamKelas: dataFormulir.jamKelas,
      status: dataFormulir.status || "aktif",
    });

    return { sukses: true, pesan: "Berhasil! Akun baru telah ditambahkan ke sistem." };

  } catch (error) {
    console.error("[ERROR prosesTambahSiswa]:", error.message);
    return { sukses: false, pesan: "Gangguan sistem database saat menambah akun." };
  }
}


export async function prosesLogin(dataFormulir) {
  try {
    await connectToDatabase();

    const inputRaw = dataFormulir.identifier || dataFormulir.username;
    if (!inputRaw || !dataFormulir.password) {
      return { sukses: false, pesan: "Mohon isi ID Pengguna dan Kata Sandi." };
    }
    const inputKey = inputRaw.trim().toLowerCase(); 

    const user = await User.findOne({
      $or: [
        { username: inputKey },
        { nomorPeserta: inputKey },
        { noHp: inputKey }
      ]
    }).lean();

    if (!user) {
      return { sukses: false, pesan: "Akun tidak ditemukan! Periksa kembali ID Anda." };
    }

    if (user.status === "tidak aktif") {
      return { sukses: false, pesan: "Akun Anda dinonaktifkan. Silakan hubungi Admin." };
    }

    const passwordCocok = await bcrypt.compare(dataFormulir.password, user.password);
    if (!passwordCocok) {
      return { sukses: false, pesan: "Kata sandi salah!" };
    }

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 604800 // 7 Hari
    };

    cookieStore.set("karcis_quantum", user._id.toString(), cookieOptions);
    cookieStore.set("peran_quantum", user.peran, cookieOptions);

    return { sukses: true, pesan: "Login Berhasil! Memasuki Sistem..." };
    
  } catch (error) {
    console.error("[ERROR prosesLogin]:", error.message);
    return { sukses: false, pesan: "Terjadi gangguan sistem saat login." };
  }
}


export async function prosesLogout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("karcis_quantum");
    cookieStore.delete("peran_quantum"); 
    return { sukses: true, pesan: "Sesi telah berakhir. Berhasil keluar." };
  } catch (error) {
    console.error("[ERROR prosesLogout]:", error.message);
    return { sukses: false, pesan: "Gagal memproses log keluar." };
  }
}