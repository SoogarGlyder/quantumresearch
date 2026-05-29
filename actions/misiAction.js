"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import MisiSiswa from "../models/MisiSiswa";
import { authHelper } from "../utils/authHelper";
import { timeHelper } from "../utils/timeHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { revalidatePath } from "next/cache";
import { GAMIFIKASI, PERAN, PESAN_SISTEM, PERIODE_BELAJAR } from "../utils/constants";

// ============================================================================
// INTERNAL HELPER — SHUFFLE
// ============================================================================
/**
 * @template T
 * @param {T[]} array - Array yang akan diacak. Input tidak dimutasi.
 * @returns {T[]} Array baru dengan urutan acak.
 */
function shuffleArray(array) {
  const arr = [...array]; // Tidak mutasi input
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {string} tglStr
 * @returns {Date}
 */
function tglStrKeDate(tglStr) {
  return new Date(`${tglStr}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
}

// ============================================================================
// ACTIONS
// ============================================================================
export async function cekDanGenerateMisiHarian() {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    const { userId, peran } = sesi;

    if (!userId || peran !== PERAN.SISWA.id) {
      return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    }

    const hariIni    = timeHelper.getTglJakarta(new Date());
    const hariIniDate = tglStrKeDate(hariIni);

    let dokumenMisi = await MisiSiswa.findOne({
      siswaId: userId,
      tanggal: hariIniDate,
    }).lean();

    if (!dokumenMisi) {
      const siswaData = await User.findById(userId).select("kodeCabang").lean();
      if (!siswaData) return responseHelper.error("Siswa tidak ditemukan.");

      const misiAcak       = shuffleArray(GAMIFIKASI.POOL_MISI).slice(0, 2);
      const daftarMisiBaru = misiAcak.map((m) => ({
        kodeMisi: m.kodeMisi,
        judul:    m.judul,
        target:   m.target,
        progress: 0,
        selesai:  false,
        diklaim:  false,
        expBonus: m.expBonus,
      }));

      dokumenMisi = await MisiSiswa.create({
        siswaId:    userId,
        tanggal:    hariIniDate,
        kodeCabang: siswaData.kodeCabang,
        daftarMisi: daftarMisiBaru,
      });

      revalidatePath("/", "layout");
    }

    const daftarMisiBersih = dokumenMisi.daftarMisi.map((misi) => ({
      _id:      misi._id?.toString() || Math.random().toString(36),
      kodeMisi: misi.kodeMisi,
      judul:    misi.judul,
      target:   misi.target,
      progress: misi.progress,
      selesai:  misi.selesai,
      diklaim:  misi.diklaim,
      expBonus: misi.expBonus,
    }));

    return responseHelper.success("Misi hari ini dimuat.", daftarMisiBersih);
  } catch (error) {
    console.error("[ERROR cekDanGenerateMisiHarian]:", error);
    return responseHelper.error("Gagal memuat misi harian.");
  }
}

export async function klaimHadiahMisi(idMisiRaw) {
  try {
    await connectToDatabase();
    const sesi = await authHelper.ambilSesi();
    if (!sesi?.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const idMisi     = validationHelper.trimInput(idMisiRaw);
    const hariIni    = timeHelper.getTglJakarta(new Date());
    const hariIniDate = tglStrKeDate(hariIni);

    const dokumenMisi = await MisiSiswa.findOne({
      siswaId: sesi.userId,
      tanggal: hariIniDate,
    });
    if (!dokumenMisi) return responseHelper.error("Misi hari ini tidak ditemukan.");

    const indexMisi = dokumenMisi.daftarMisi.findIndex(
      (m) => m._id?.toString() === idMisi
    );
    if (indexMisi === -1) return responseHelper.error("Misi tidak ditemukan.");

    const misi = dokumenMisi.daftarMisi[indexMisi];
    if (!misi.selesai) return responseHelper.error("Selesaikan misi terlebih dahulu!");
    if (misi.diklaim)  return responseHelper.error("Hadiah misi ini sudah diklaim.");

    dokumenMisi.daftarMisi[indexMisi].diklaim = true;
    await dokumenMisi.save();

    await User.updateOne(
      { _id: sesi.userId },
      { $inc: { totalExp: misi.expBonus } }
    );

    revalidatePath("/", "layout");
    return responseHelper.success(`Berhasil klaim +${misi.expBonus} EXP!`);
  } catch (error) {
    console.error("[ERROR klaimHadiahMisi]:", error);
    return responseHelper.error("Gagal klaim hadiah.");
  }
}