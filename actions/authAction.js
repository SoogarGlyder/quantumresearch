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
/**
 * Memvalidasi apakah user yang mengeksekusi aksi ini adalah Admin
 */
async function cekAdmin() {
  try {
    const cookieStore = await cookies();
    const karcis = cookieStore.get("karcis_quantum");
    
    if (!karcis || !karcis.value) return false;
    
    // Gunakan .select() agar query ke database sangat ringan
    const user = await User.findById(karcis.value).select("peran").lean();
    return user && user.peran === "admin";
  } catch (error) {
    console.error("[SECURITY cekAdmin]:", error.message);
    return false; // Fail-safe (Gagal Aman)
  }
}

// ============================================================================
// 3. AUTHENTICATION & REGISTRATION ACTIONS
// ============================================================================

export async function prosesTambahSiswa(dataFormulir) {
  try {
    await connectToDatabase();
    
    // 1. Otorisasi
    if (!(await cekAdmin())) {
      return { sukses: false, pesan: "Akses Ditolak! Hanya Admin yang dapat menambah akun." };
    }

    // 2. Sanitasi Input (Cegah Crash Jika Undefined)
    const formNomorPeserta = (dataFormulir.nomorPeserta || "").trim();
    const formNoHp = (dataFormulir.noHp || "").trim();
    
    // Jika username kosong dari form, gunakan nomor peserta sebagai default
    let rawUsername = dataFormulir.username;
    if (!rawUsername || rawUsername.trim() === "") {
      rawUsername = formNomorPeserta;
    }
    const formUsername = rawUsername.trim().toLowerCase();

    // 3. Filter Regex Username (Samakan dengan profilAction)
    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(formUsername)) {
      return { 
        sukses: false, 
        pesan: "Gagal: Username hanya boleh mengandung huruf, angka, titik, strip, atau underscore (Tanpa spasi/emoji)." 
      };
    }

    // 4. Cek Duplikasi Massal
    const akunLama = await User.findOne({ 
      $or: [
        { username: formUsername },
        { nomorPeserta: formNomorPeserta },
        { noHp: formNoHp }
      ]
    }).select("_id").lean();

    if (akunLama) {
      return { sukses: false, pesan: "Gagal: Username, Nomor Peserta, atau No WA ini sudah dipakai akun lain!" };
    }

    // 5. Enkripsi Password & Buat Akun
    const passwordAcak = await bcrypt.hash(dataFormulir.password, 10);

    await User.create({
      nama: (dataFormulir.nama || "").trim(),
      nomorPeserta: formNomorPeserta, 
      username: formUsername,         
      password: passwordAcak,
      noHp: formNoHp,
      peran: dataFormulir.peran || "siswa",
      kelas: dataFormulir.kelas,
      jadwalKelas: dataFormulir.jadwalKelas,
      jamKelas: dataFormulir.jamKelas,
      status: dataFormulir.status || "aktif",
    });

    return { sukses: true, pesan: "Berhasil! Akun baru telah ditambahkan." };

  } catch (error) {
    console.error("[ERROR prosesTambahSiswa]:", error.message);
    return { sukses: false, pesan: "Terjadi kesalahan pada sistem database saat menambah akun." };
  }
}


export async function prosesLogin(dataFormulir) {
  try {
    await connectToDatabase();

    // 1. Sanitasi Input Login
    const inputRaw = dataFormulir.identifier || dataFormulir.username;
    if (!inputRaw || !dataFormulir.password) {
      return { sukses: false, pesan: "Mohon isi ID Pengguna dan Kata Sandi." };
    }
    const inputSiswa = inputRaw.trim().toLowerCase(); 

    // 2. Pencarian Multi-Login (Username / No Peserta / WA)
    const user = await User.findOne({
      $or: [
        { username: inputSiswa },
        { nomorPeserta: inputSiswa },
        { noHp: inputSiswa }
      ]
    }).lean();

    if (!user) {
      return { sukses: false, pesan: "Akun tidak ditemukan! Cek kembali Username / No Peserta / WA." };
    }

    // 3. Validasi Status Aktif
    if (user.status === "tidak aktif") {
      return { sukses: false, pesan: "Akses Ditolak: Akun Anda sedang TIDAK AKTIF. Silakan hubungi Admin." };
    }

    // 4. Verifikasi Password (Bcrypt)
    const passwordCocok = await bcrypt.compare(dataFormulir.password, user.password);
    if (!passwordCocok) {
      return { sukses: false, pesan: "Kata sandi salah! Coba ingat-ingat lagi." };
    }

    // 5. Pembuatan Secure Cookies (Level Enterprise)
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true, // Cegah XSS
      secure: process.env.NODE_ENV === "production", // Wajib HTTPS saat rilis
      sameSite: "strict", // Cegah CSRF
      path: "/", // Berlaku di seluruh aplikasi
      maxAge: 604800 // Sesi berlaku 7 Hari (dalam detik) agar siswa tidak usah login tiap hari
    };

    cookieStore.set("karcis_quantum", user._id.toString(), cookieOptions);
    cookieStore.set("peran_quantum", user.peran, cookieOptions);

    return { sukses: true, pesan: "Verifikasi Berhasil! Membuka Gerbang..." };
    
  } catch (error) {
    console.error("[ERROR prosesLogin]:", error.message);
    return { sukses: false, pesan: "Terjadi gangguan sistem saat mencoba login. Coba sesaat lagi." };
  }
}


export async function prosesLogout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("karcis_quantum");
    cookieStore.delete("peran_quantum"); 
    return { sukses: true, pesan: "Berhasil keluar dari perangkat." };
  } catch (error) {
    console.error("[ERROR prosesLogout]:", error.message);
    return { sukses: false, pesan: "Sistem gagal memproses log keluar." };
  }
}