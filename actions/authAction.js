"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL SECURITY
// ============================================================================
async function pastikanAdmin() {
  const { userId, peran } = await authHelper.ambilSesi();
  return userId && peran === "admin";
}

// ============================================================================
// 2. AUTHENTICATION ACTIONS
// ============================================================================

/**
 * LOGIN: Mendukung Username, Nomor Peserta, atau No HP
 */
export async function prosesLogin(dataFormulir) {
  try {
    await connectToDatabase();

    const idInput = validationHelper.sanitize(dataFormulir.identifier || dataFormulir.username || dataFormulir.noHp).toLowerCase();
    
    // Deteksi password dari berbagai kemungkinan nama field di frontend
    const passwordInput = (dataFormulir.password || dataFormulir.kataSandi || dataFormulir.pass || "").toString().trim();

    if (!idInput || !passwordInput) {
      return responseHelper.error("ID dan Kata Sandi wajib diisi.");
    }

    // Ambil user beserta password (select: +password)
    const user = await User.findOne({
      $or: [{ username: idInput }, { nomorPeserta: idInput }, { noHp: idInput }]
    }).select("+password"); 

    if (!user) return responseHelper.error("Akun tidak ditemukan!");
    if (!user.password) return responseHelper.error("Data password di server kosong. Hubungi Admin.");
    if (user.status === "tidak aktif") return responseHelper.error("Akun dinonaktifkan.");

    // Verifikasi Password
    const passwordCocok = await authHelper.bandingkanPassword(passwordInput, user.password);
    
    // DIAGNOSTIK: Muncul di terminal server/Vercel
    console.log(`[LOGIN ATTEMPT] User: ${idInput} | Pass Input: ${passwordInput} | Match: ${passwordCocok}`);
    
    if (!passwordCocok) return responseHelper.error("Kata sandi salah!");

    // Set Sesi
    await authHelper.setSesi(user);
    return responseHelper.success("Login Berhasil! Memuat portal...");
  } catch (error) {
    console.error("[CRITICAL LOGIN ERROR]:", error.message);
    return responseHelper.error("Terjadi gangguan pada sistem login.");
  }
}

export async function prosesLogout() {
  await authHelper.hapusSesi();
  return responseHelper.success("Berhasil keluar.");
}

// ============================================================================
// 3. REGISTRATION ACTIONS (ADMIN ONLY)
// ============================================================================

/**
 * TAMBAH SISWA: Password = Input > No HP > 123456
 */
export async function prosesTambahSiswa(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const username = validationHelper.sanitize(dataFormulir.username || dataFormulir.nomorPeserta).toLowerCase();
    const noHp = validationHelper.sanitize(dataFormulir.noHp || dataFormulir.whatsapp);

    // Deteksi password dengan fallback ke No HP
    let passPolos = (dataFormulir.password || dataFormulir.kataSandi || "").toString().trim();
    if (!passPolos) passPolos = noHp || "123456";

    const cekDuplikat = await User.findOne({ $or: [{ username }, { nomorPeserta: dataFormulir.nomorPeserta }] });
    if (cekDuplikat) return responseHelper.error("ID atau Username sudah terdaftar!");

    const passwordHashed = await authHelper.buatHash(passPolos);

    await User.create({
      ...dataFormulir,
      username,
      noHp,
      password: passwordHashed,
      peran: "siswa",
      status: "aktif"
    });

    revalidatePath("/admin");
    return responseHelper.success(`Siswa berhasil dibuat dengan password: ${passPolos}`);
  } catch (error) {
    return responseHelper.error("Gagal simpan data siswa.");
  }
}

/**
 * TAMBAH PENGAJAR: Anti-Gagal (Detect No HP as Password)
 */
export async function prosesTambahPengajar(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const username = validationHelper.sanitize(dataFormulir.username).toLowerCase();
    const kodePengajar = validationHelper.sanitize(dataFormulir.kodePengajar).toUpperCase();
    
    // Deteksi No HP dari berbagai kemungkinan key frontend
    const noHp = validationHelper.sanitize(dataFormulir.noHp || dataFormulir.nomorHp || dataFormulir.whatsapp || "");

    // Deteksi Password: Cek field password, jika kosong ambil No HP
    let passPolos = (dataFormulir.password || dataFormulir.kataSandi || dataFormulir.pass || "").toString().trim();
    if (!passPolos) passPolos = noHp || "123456";

    // DIAGNOSTIK REGISTRASI
    console.log(`[REGIS GURU] Target: ${username} | Raw Pass: ${passPolos}`);

    const passwordHashed = await authHelper.buatHash(passPolos);

    // Hapus data lama agar bersih sebelum ditimpa
    await User.deleteOne({ $or: [{ username }, { kodePengajar }] });

    await User.create({
      ...dataFormulir,
      username,
      kodePengajar,
      noHp,
      password: passwordHashed, 
      peran: "pengajar",
      status: "aktif"
    });

    revalidatePath("/admin");
    return responseHelper.success(`Pengajar SIAP! Password login: ${passPolos}`);
  } catch (error) {
    console.error("[ADD_TEACHER_ERROR]:", error.message);
    return responseHelper.error("Gagal mendaftarkan pengajar.");
  }
}

/**
 * BULK UPLOAD: Automatisasi password per baris
 */
export async function prosesBulkTambahSiswa(daftarSiswaRaw) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");
    
    const existing = await User.find({}, "username nomorPeserta").lean();
    const setU = new Set(existing.map(u => u.username));
    const setN = new Set(existing.map(u => u.nomorPeserta));

    const dataSiap = [];

    for (const s of daftarSiswaRaw) {
      const id = validationHelper.sanitize(s.nomorPeserta);
      const user = validationHelper.sanitize(s.username || id).toLowerCase();
      const noHp = validationHelper.sanitize(s.noHp || s.nomorHp);

      if (setU.has(user) || setN.has(id)) continue;

      let pRaw = (s.password || s.kataSandi || "").toString().trim();
      if (!pRaw) pRaw = noHp || "123456";

      dataSiap.push({
        ...s,
        nomorPeserta: id,
        username: user,
        noHp: noHp,
        password: await authHelper.buatHash(pRaw),
        peran: "siswa",
        status: "aktif"
      });
    }

    if (dataSiap.length > 0) await User.insertMany(dataSiap);
    
    revalidatePath("/admin");
    return responseHelper.success(`Bulk Upload Berhasil (${dataSiap.length} siswa).`);
  } catch (error) {
    return responseHelper.error("Gagal upload massal.");
  }
}