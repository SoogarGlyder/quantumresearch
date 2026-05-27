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
  PESAN_SISTEM,
  PANGKAT_PENGAJAR,
  CABANG_QUANTUM
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL SECURITY & HELPERS
// ============================================================================
function ekstrakKodeCabang(nomorPeserta) {
  if (!nomorPeserta || nomorPeserta.length < 6) return CABANG_QUANTUM.PUSAT.id;
  const potongan = nomorPeserta.substring(0, 6);
  const cabangValid = Object.values(CABANG_QUANTUM).find(c => c.id === potongan);
  return cabangValid ? cabangValid.id : CABANG_QUANTUM.PUSAT.id;
}

async function pastikanAdmin() {
  const sesi = await authHelper.ambilSesi();
  if (!sesi || !sesi.userId) return false;
  if (sesi.peran === PERAN.ADMIN.id) return true;
  if (sesi.peran === PERAN.PENGAJAR.id && sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK) return true;
  return false;
}

// ============================================================================
// 2. AUTHENTICATION ACTIONS
// ============================================================================
export async function prosesLogin(dataFormulir) {
  try {
    await connectToDatabase();

    const idInputRaw = validationHelper.trimInput(dataFormulir.identifier || dataFormulir.username || dataFormulir.noHp || "");
    const idInputLower = idInputRaw.toLowerCase();
    const idInputUpper = idInputRaw.toUpperCase();

    const passwordInput = (dataFormulir.password || dataFormulir.kataSandi || dataFormulir.pass || "").toString().trim();

    if (!idInputRaw || !passwordInput) {
      return responseHelper.error("ID dan Kata Sandi wajib diisi.");
    }

    const user = await User.findOne({
      $or: [
        { peran: PERAN.ADMIN.id, username: idInputLower },
        {
          peran: PERAN.SISWA.id,
          $or: [
            { username: idInputLower },
            { nomorPeserta: idInputUpper },
            { noHp: idInputRaw }
          ]
        },
        {
          peran: PERAN.PENGAJAR.id,
          $or: [
            { username: idInputLower },
            { nomorPeserta: idInputUpper },
            { noHp: idInputRaw },
            { kodePengajar: idInputUpper }
          ]
        }
      ]
    }).select("+password").lean();

    if (!user) return responseHelper.error("Akun tidak ditemukan atau ID tidak diizinkan untuk peran tersebut!");
    if (!user.password) return responseHelper.error("Data password di server kosong. Hubungi Admin.");
    if (user.status === STATUS_USER.NONAKTIF) return responseHelper.error("Akun Anda telah dinonaktifkan. Silakan hubungi Admin.");

    const passwordCocok = await authHelper.bandingkanPassword(passwordInput, user.password);
    if (!passwordCocok) return responseHelper.error("Kata sandi salah!");

    const sesiBerhasil = await authHelper.setSesi(user);
    if (!sesiBerhasil) {
      return responseHelper.error("Terjadi gangguan server saat membuat Token Sesi.");
    }

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
// 3. REGISTRATION ACTIONS (ADMIN & STAFF AKADEMIK ONLY)
// ============================================================================
export async function prosesTambahSiswa(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak: Khusus Admin & Staff Akademik.");

    const sesi = await authHelper.ambilSesi();

    const username = validationHelper.trimInput(dataFormulir.username || dataFormulir.nomorPeserta).toLowerCase();
    const noHp = validationHelper.trimInput(dataFormulir.noHp || dataFormulir.whatsapp || "");
    const namaSiswa = validationHelper.trimInput(dataFormulir.nama);

    let passPolos = (dataFormulir.password || dataFormulir.kataSandi || "").toString().trim();
    if (!passPolos) passPolos = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

    const cekDuplikat = await User.exists({ $or: [{ username }, { nomorPeserta: dataFormulir.nomorPeserta }] });
    if (cekDuplikat) return responseHelper.error("Username atau Nomor Peserta sudah digunakan!");

    const passwordHashed = await authHelper.buatHash(passPolos);
    let kodeCabangSiswa = sesi.kodeCabang === CABANG_QUANTUM.PUSAT.id ? ekstrakKodeCabang(dataFormulir.nomorPeserta) : sesi.kodeCabang;

    await User.create({
      ...dataFormulir,
      nama: namaSiswa,
      username,
      noHp,
      password: passwordHashed,
      peran: PERAN.SISWA.id,
      status: STATUS_USER.AKTIF,
      kodeCabang: kodeCabangSiswa
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`Siswa didaftarkan! Password: ${passPolos}`);
  } catch (error) {
    console.error("[ERROR prosesTambahSiswa]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function prosesTambahPengajar(dataFormulir) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak: Khusus Admin & Staff Akademik.");

    const sesi = await authHelper.ambilSesi();

    const username = validationHelper.trimInput(dataFormulir.username).toLowerCase();
    const kodePengajar = validationHelper.trimInput(dataFormulir.kodePengajar).toUpperCase();
    const noHp = validationHelper.trimInput(dataFormulir.noHp || dataFormulir.whatsapp || "");
    const namaPengajar = validationHelper.trimInput(dataFormulir.nama);

    let passPolos = (dataFormulir.password || dataFormulir.kataSandi || "").toString().trim();
    if (!passPolos) passPolos = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

    await User.deleteOne({ $or: [{ username }, { kodePengajar }] });

    let kodeCabangPengajar = sesi.kodeCabang === CABANG_QUANTUM.PUSAT.id ? ekstrakKodeCabang(dataFormulir.nomorPeserta) : sesi.kodeCabang;

    await User.create({
      ...dataFormulir,
      nama: namaPengajar,
      username,
      kodePengajar,
      noHp,
      password: await authHelper.buatHash(passPolos),
      peran: PERAN.PENGAJAR.id,
      status: STATUS_USER.AKTIF,
      kodeCabang: kodeCabangPengajar
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`Pengajar aktif! Password login: ${passPolos}`);
  } catch (error) {
    console.error("[ERROR prosesTambahPengajar]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function prosesBulkTambahSiswa(daftarSiswaRaw) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak: Khusus Admin & Staff Akademik.");

    const sesi = await authHelper.ambilSesi();
    const barisUsername = daftarSiswaRaw.map(s => validationHelper.trimInput(s.username || s.nomorPeserta).toLowerCase());
    const barisNomor = daftarSiswaRaw.map(s => validationHelper.trimInput(s.nomorPeserta));

    const existing = await User.find({
      $or: [{ username: { $in: barisUsername } }, { nomorPeserta: { $in: barisNomor } }]
    }).select("username nomorPeserta").lean();

    const setU = new Set(existing.map(u => u.username));
    const setN = new Set(existing.map(u => u.nomorPeserta));
    const dataSiap = [];

    for (const s of daftarSiswaRaw) {
      const id = validationHelper.trimInput(s.nomorPeserta);
      const user = validationHelper.trimInput(s.username || id).toLowerCase();
      const noHp = validationHelper.trimInput(s.noHp || s.nomorHp || "");
      const nama = validationHelper.trimInput(s.nama);

      if (setU.has(user) || setN.has(id)) continue;

      let pRaw = (s.password || s.kataSandi || "").toString().trim();
      if (!pRaw) pRaw = noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

      let kodeCabangSiswa = sesi.kodeCabang === CABANG_QUANTUM.PUSAT.id ? ekstrakKodeCabang(id) : sesi.kodeCabang;

      dataSiap.push({
        ...s,
        nama,
        nomorPeserta: id,
        username: user,
        noHp: noHp,
        password: await authHelper.buatHash(pRaw),
        peran: PERAN.SISWA.id,
        status: STATUS_USER.AKTIF,
        kodeCabang: kodeCabangSiswa
      });
    }

    if (dataSiap.length > 0) await User.insertMany(dataSiap);

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`${dataSiap.length} Siswa berhasil di-upload.`);
  } catch (error) {
    console.error("[ERROR prosesBulkTambahSiswa]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function dapatkanSesiAktif() {
  return await authHelper.ambilSesi();
}