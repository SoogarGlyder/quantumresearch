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

    const idInputRaw = validationHelper.sanitize(
      dataFormulir.identifier || dataFormulir.username || dataFormulir.noHp || ""
    ).trim();
    
    const idInputLower = idInputRaw.toLowerCase();
    const idInputUpper = idInputRaw.toUpperCase(); 
    
    const passwordInput = (dataFormulir.password || dataFormulir.kataSandi || dataFormulir.pass || "").toString().trim();

    if (!idInputRaw || !passwordInput) {
      return responseHelper.error("ID dan Kata Sandi wajib diisi.");
    }

    // 🚀 OPTIMASI: Gunakan .lean() karena kita hanya butuh data mentah untuk validasi
    const user = await User.findOne({
      $or: [
        { peran: PERAN.ADMIN.id, username: idInputLower },
        { peran: PERAN.SISWA.id, 
          $or: [
            { username: idInputLower }, 
            { nomorPeserta: { $regex: new RegExp(`^${idInputRaw}$`, "i") } },
            { noHp: idInputRaw }
          ] 
        },
        { peran: PERAN.PENGAJAR.id, 
          $or: [
            { username: idInputLower }, 
            { nomorPeserta: { $regex: new RegExp(`^${idInputRaw}$`, "i") } }, 
            { noHp: idInputRaw },
            { kodePengajar: idInputUpper } 
          ] 
        }
      ]
    })
    .select("+password")
    .lean(); // 👈 Mematikan instansiasi objek Mongoose yang memakan RAM

    if (!user) return responseHelper.error("Akun tidak ditemukan atau ID tidak diizinkan untuk peran tersebut!");
    if (!user.password) return responseHelper.error("Data password di server kosong. Hubungi Admin.");
    if (user.status === STATUS_USER.NONAKTIF) return responseHelper.error("Akun Anda telah dinonaktifkan. Silakan hubungi Admin.");

    const passwordCocok = await authHelper.bandingkanPassword(passwordInput, user.password);
    
    console.log(`[AUTH] Login Attempt: ${idInputRaw} | Role: ${user.peran} | Success: ${passwordCocok}`);
    
    if (!passwordCocok) return responseHelper.error("Kata sandi salah!");

    await authHelper.setSesi(user);
    
    return responseHelper.success("Login Berhasil! Memuat portal...");
  } catch (error) {
    console.error("[CRITICAL ERROR Login]:", error);
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

    let passPolos = (dataFormulir.password || dataFormulir.kataSandi || "").toString().trim();
    if (!passPolos) passPolos = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

    // 🚀 OPTIMASI: exists() lebih cepat dan hemat memori dari findOne()
    const cekDuplikat = await User.exists({ $or: [{ username }, { nomorPeserta: dataFormulir.nomorPeserta }] });
    if (cekDuplikat) return responseHelper.error("Username atau Nomor Peserta sudah digunakan!");

    const passwordHashed = await authHelper.buatHash(passPolos);

    await User.create({
      ...dataFormulir, username, noHp, password: passwordHashed,
      peran: PERAN.SISWA.id, status: STATUS_USER.AKTIF
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

    // Atomic hapus data lama jika ada, lalu buat baru
    await User.deleteOne({ $or: [{ username }, { kodePengajar }] });

    await User.create({
      ...dataFormulir, username, kodePengajar, noHp, password: passwordHashed, 
      peran: PERAN.PENGAJAR.id, status: STATUS_USER.AKTIF
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
    
    // 🚀 BOM WAKTU DIJINAKKAN: Jangan tarik seluruh data User!
    // Ekstrak username & nomor dari file Excel, lalu cek yang cocok saja ke Database.
    const barisUsername = daftarSiswaRaw.map(s => validationHelper.sanitize(s.username || s.nomorPeserta).toLowerCase());
    const barisNomor = daftarSiswaRaw.map(s => validationHelper.sanitize(s.nomorPeserta));

    const existing = await User.find({
      $or: [
        { username: { $in: barisUsername } },
        { nomorPeserta: { $in: barisNomor } }
      ]
    }).select("username nomorPeserta").lean();

    const setU = new Set(existing.map(u => u.username));
    const setN = new Set(existing.map(u => u.nomorPeserta));

    const dataSiap = [];

    // Proses hashing berjalan sekuensial agar tidak memicu Vercel CPU Timeout saat mass-upload
    for (const s of daftarSiswaRaw) {
      const id = validationHelper.sanitize(s.nomorPeserta);
      const user = validationHelper.sanitize(s.username || id).toLowerCase();
      const noHp = validationHelper.sanitize(s.noHp || s.nomorHp || "");

      if (setU.has(user) || setN.has(id)) continue;

      let pRaw = (s.password || s.kataSandi || "").toString().trim();
      if (!pRaw) pRaw = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

      dataSiap.push({
        ...s, nomorPeserta: id, username: user, noHp: noHp,
        password: await authHelper.buatHash(pRaw),
        peran: PERAN.SISWA.id, status: STATUS_USER.AKTIF
      });
    }

    if (dataSiap.length > 0) await User.insertMany(dataSiap); // 🚀 Atomic Insert Bulk
    
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`${dataSiap.length} Siswa berhasil di-upload.`);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

// ============================================================================
// 4. SESSION EXTRACTOR (Untuk Client Component)
// ============================================================================
export async function dapatkanSesiAktif() {
  const sesi = await authHelper.ambilSesi();
  return sesi; 
}