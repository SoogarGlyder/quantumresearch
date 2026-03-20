"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. SECURITY MIDDLEWARE (Internal)
// ============================================================================
async function pastikanAdmin() {
  const { userId, peran } = await authHelper.ambilSesi();
  return userId && peran === "admin";
}

// ============================================================================
// 2. AUTHENTICATION ACTIONS
// ============================================================================

/**
 * LOGIN: Multi-Identifier (Username / ID / WA)
 */
export async function prosesLogin(dataFormulir) {
  try {
    await connectToDatabase();

    const idInput = validationHelper.sanitize(dataFormulir.identifier || dataFormulir.username).toLowerCase();
    const passwordInput = dataFormulir.password;

    if (!idInput || !passwordInput) {
      return responseHelper.error("ID dan Kata Sandi wajib diisi.");
    }

    // 🕵️ Tirai password dibuka khusus untuk login (+password)
    // Tanpa .lean() agar kita bisa melakukan pengecekan internal Mongoose jika perlu
    const user = await User.findOne({
      $or: [{ username: idInput }, { nomorPeserta: idInput }, { noHp: idInput }]
    }).select("+password"); 

    if (!user) return responseHelper.error("Akun tidak ditemukan!");
    
    // 🛡️ PAGAR 1: Deteksi "Data Hantu" (User ada tapi password kosong di DB)
    if (!user.password) {
      console.error(`[AUTH DIAGNOSTIC]: User '${idInput}' (Role: ${user.peran}) ditemukan, tapi field 'password' KOSONG.`);
      return responseHelper.error("Akun ini belum memiliki password yang valid. Silakan hubungi Admin untuk Reset Password.");
    }

    if (user.status === "tidak aktif") {
      return responseHelper.error("Akun dinonaktifkan. Hubungi Admin.");
    }

    // 🛡️ PAGAR 2: Verifikasi via Helper (Anti-crash bcrypt)
    const passwordCocok = await authHelper.bandingkanPassword(passwordInput, user.password);
    
    if (!passwordCocok) return responseHelper.error("Kata sandi salah!");

    // Buat Sesi Cookie
    await authHelper.setSesi(user);

    return responseHelper.success("Login Berhasil! Memuat portal...");
  } catch (error) {
    console.error("[CRITICAL LOGIN ERROR]:", error.message);
    return responseHelper.error("Terjadi gangguan pada sistem login.");
  }
}

/**
 * LOGOUT: Menghapus Sesi
 */
export async function prosesLogout() {
  try {
    await authHelper.hapusSesi();
    return responseHelper.success("Berhasil keluar dari sistem.");
  } catch (error) {
    return responseHelper.error("Gagal membersihkan sesi logout.");
  }
}

// ============================================================================
// 3. REGISTRATION ACTIONS (ADMIN ONLY)
// ============================================================================

/**
 * TAMBAH SISWA: Registrasi manual satu per satu
 */
export async function prosesTambahSiswa(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak! Khusus Admin.");

    const username = validationHelper.sanitize(dataFormulir.username || dataFormulir.nomorPeserta).toLowerCase();
    
    if (!validationHelper.isValidUsername(username)) {
      return responseHelper.error("Format username tidak valid (gunakan huruf, angka, . - _)");
    }
    if (!validationHelper.isValidPassword(dataFormulir.password)) {
      return responseHelper.error("Password minimal 6 karakter.");
    }

    const cekDuplikat = await User.findOne({ 
      $or: [{ username }, { nomorPeserta: dataFormulir.nomorPeserta }] 
    }).select("_id").lean();
    
    if (cekDuplikat) return responseHelper.error("ID atau Username sudah terdaftar!");

    const passwordHashed = await authHelper.buatHash(dataFormulir.password || "123456");

    await User.create({
      ...dataFormulir,
      username,
      password: passwordHashed,
      peran: "siswa",
      status: "aktif"
    });

    revalidatePath("/admin");
    return responseHelper.success("Akun siswa berhasil dibuat!");
  } catch (error) {
    console.error("[ADD_STUDENT_ERROR]:", error.message);
    return responseHelper.error("Gagal menyimpan data siswa.");
  }
}

/**
 * TAMBAH PENGAJAR: Registrasi manual pengajar
 */
export async function prosesTambahPengajar(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const username = validationHelper.sanitize(dataFormulir.username).toLowerCase();
    const kodePengajar = validationHelper.sanitize(dataFormulir.kodePengajar).toUpperCase();
    
    // 🛡️ Menangani dua kemungkinan nama field password dari form UI
    const passwordRaw = dataFormulir.password || dataFormulir.kataSandi || "123456";

    if (!username || !kodePengajar) return responseHelper.error("Username & Kode Pengajar wajib diisi.");

    const cekDuplikat = await User.findOne({ 
      $or: [{ username }, { kodePengajar }] 
    }).select("_id").lean();
    
    if (cekDuplikat) return responseHelper.error("Username atau Kode Pengajar sudah ada!");

    const passwordHashed = await authHelper.buatHash(passwordRaw);

    await User.create({
      ...dataFormulir,
      username,
      kodePengajar,
      password: passwordHashed, // 👈 Dipastikan masuk ke field 'password' di DB
      peran: "pengajar",
      status: "aktif"
    });

    revalidatePath("/admin");
    return responseHelper.success(`Pengajar ${dataFormulir.nama} berhasil didaftarkan!`);
  } catch (error) {
    console.error("[ADD_TEACHER_ERROR]:", error.message);
    return responseHelper.error("Gagal menyimpan data pengajar.");
  }
}

/**
 * BULK UPLOAD: Pendaftaran massal (Siswa)
 */
export async function prosesBulkTambahSiswa(daftarSiswaRaw) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");
    
    const existing = await User.find({}, "username nomorPeserta").lean();
    const setU = new Set(existing.map(u => u.username));
    const setN = new Set(existing.map(u => u.nomorPeserta));

    const dataSiap = [];
    const laporanGagal = [];

    for (const s of daftarSiswaRaw) {
      const id = validationHelper.sanitize(s.nomorPeserta);
      const user = validationHelper.sanitize(s.username || id).toLowerCase();

      if (setU.has(user) || setN.has(id)) {
        laporanGagal.push(`${s.nama || id}: Duplikat.`);
        continue;
      }

      dataSiap.push({
        ...s,
        nomorPeserta: id,
        username: user,
        password: await authHelper.buatHash(s.password || "123456"),
        peran: "siswa",
        status: "aktif"
      });

      setU.add(user); setN.add(id);
    }

    if (dataSiap.length > 0) await User.insertMany(dataSiap);
    
    revalidatePath("/admin");
    return responseHelper.success(`Bulk Upload Selesai!`, {
      berhasil: dataSiap.length,
      gagal: laporanGagal.length
    });
  } catch (error) {
    console.error("[BULK_UPLOAD_ERROR]:", error.message);
    return responseHelper.error("Gangguan Server saat upload massal.");
  }
}