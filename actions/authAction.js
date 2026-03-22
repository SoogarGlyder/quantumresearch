"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { 
  PERAN, 
  STATUS_USER, 
  KONFIGURASI_SISTEM, 
  PESAN_SISTEM 
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL SECURITY
// ============================================================================

async function pastikanAdmin() {
  const { userId, peran } = await authHelper.ambilSesi();
  return userId && peran === PERAN.ADMIN.id;
}

// ============================================================================
// 2. AUTHENTICATION ACTIONS
// ============================================================================

export async function prosesLogin(dataFormulir) {
  try {
    await connectToDatabase();

    const idInput = validationHelper.sanitize(
      dataFormulir.identifier || dataFormulir.username || dataFormulir.noHp || ""
    ).toLowerCase();
    
    const passwordInput = (dataFormulir.password || dataFormulir.kataSandi || dataFormulir.pass || "").toString().trim();

    if (!idInput || !passwordInput) {
      return responseHelper.error("ID dan Kata Sandi wajib diisi.");
    }

    const user = await User.findOne({
      $or: [{ username: idInput }, { nomorPeserta: idInput }, { noHp: idInput }]
    }).select("+password"); 

    if (!user) return responseHelper.error("Akun tidak ditemukan!");
    if (!user.password) return responseHelper.error("Data password di server kosong. Hubungi Admin.");
    
    if (user.status === STATUS_USER.NONAKTIF) {
      return responseHelper.error("Akun Anda telah dinonaktifkan. Silakan hubungi Admin.");
    }

    const passwordCocok = await authHelper.bandingkanPassword(passwordInput, user.password);
    
    console.log(`[AUTH] Login Attempt: ${idInput} | Success: ${passwordCocok}`);
    
    if (!passwordCocok) return responseHelper.error("Kata sandi salah!");

    await authHelper.setSesi(user);
    
    return responseHelper.success("Login Berhasil! Memuat portal...");
  } catch (error) {
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

export async function prosesTambahSiswa(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const username = validationHelper.sanitize(dataFormulir.username || dataFormulir.nomorPeserta).toLowerCase();
    const noHp = validationHelper.sanitize(dataFormulir.noHp || dataFormulir.whatsapp || "");

    // Menggunakan Password dari Konstanta
    let passPolos = (dataFormulir.password || dataFormulir.kataSandi || "").toString().trim();
    if (!passPolos) passPolos = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

    const cekDuplikat = await User.findOne({ $or: [{ username }, { nomorPeserta: dataFormulir.nomorPeserta }] });
    if (cekDuplikat) return responseHelper.error("Username atau Nomor Peserta sudah digunakan!");

    const passwordHashed = await authHelper.buatHash(passPolos);

    await User.create({
      ...dataFormulir,
      username,
      noHp,
      password: passwordHashed,
      peran: PERAN.SISWA.id,
      status: STATUS_USER.AKTIF
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`Siswa didaftarkan! Password: ${passPolos}`);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function prosesTambahPengajar(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const username = validationHelper.sanitize(dataFormulir.username).toLowerCase();
    const kodePengajar = validationHelper.sanitize(dataFormulir.kodePengajar).toUpperCase();
    const noHp = validationHelper.sanitize(dataFormulir.noHp || dataFormulir.whatsapp || "");

    let passPolos = (dataFormulir.password || dataFormulir.kataSandi || "").toString().trim();
    if (!passPolos) passPolos = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

    const passwordHashed = await authHelper.buatHash(passPolos);

    await User.deleteOne({ $or: [{ username }, { kodePengajar }] });

    await User.create({
      ...dataFormulir,
      username,
      kodePengajar,
      noHp,
      password: passwordHashed, 
      peran: PERAN.PENGAJAR.id,
      status: STATUS_USER.AKTIF
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`Pengajar aktif! Password login: ${passPolos}`);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function prosesBulkTambahSiswa(daftarSiswaRaw) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    
    const existing = await User.find({}, "username nomorPeserta").lean();
    const setU = new Set(existing.map(u => u.username));
    const setN = new Set(existing.map(u => u.nomorPeserta));

    const dataSiap = [];

    for (const s of daftarSiswaRaw) {
      const id = validationHelper.sanitize(s.nomorPeserta);
      const user = validationHelper.sanitize(s.username || id).toLowerCase();
      const noHp = validationHelper.sanitize(s.noHp || s.nomorHp || "");

      if (setU.has(user) || setN.has(id)) continue;

      let pRaw = (s.password || s.kataSandi || "").toString().trim();
      if (!pRaw) pRaw = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

      dataSiap.push({
        ...s,
        nomorPeserta: id,
        username: user,
        noHp: noHp,
        password: await authHelper.buatHash(pRaw),
        peran: PERAN.SISWA.id,
        status: STATUS_USER.AKTIF
      });
    }

    if (dataSiap.length > 0) await User.insertMany(dataSiap);
    
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`${dataSiap.length} Siswa berhasil di-upload.`);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}