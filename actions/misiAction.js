"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import { authHelper } from "../utils/authHelper";
import { timeHelper } from "../utils/timeHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { revalidatePath } from "next/cache";
import { GAMIFIKASI, PERAN, PESAN_SISTEM } from "../utils/constants";

export async function cekDanGenerateMisiHarian() {
  try {
    await connectToDatabase();
    const { userId, peran } = await authHelper.ambilSesi();

    if (!userId || peran !== PERAN.SISWA.id) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const siswa = await User.findById(userId).select("misiHarian").lean();
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    const hariIni = timeHelper.getTglJakarta(new Date());

    let daftarMisi = siswa.misiHarian?.daftar || [];

    if (siswa.misiHarian?.tanggal !== hariIni) {
      const misiAcak = [...GAMIFIKASI.POOL_MISI].sort(() => 0.5 - Math.random()).slice(0, 2);
      const daftarMisiBaru = misiAcak.map(m => ({
        kodeMisi: m.kodeMisi,
        judul: m.judul,
        target: m.target,
        progress: 0,
        selesai: false,
        diklaim: false,
        expBonus: m.expBonus
      }));

      await User.updateOne(
        { _id: userId },
        { $set: { "misiHarian.tanggal": hariIni, "misiHarian.daftar": daftarMisiBaru } }
      );

      revalidatePath("/", "layout");
      daftarMisi = daftarMisiBaru;
    }

    const daftarMisiBersih = daftarMisi.map(misi => ({
      _id: misi._id?.toString() || Math.random().toString(36),
      kodeMisi: misi.kodeMisi,
      judul: misi.judul,
      target: misi.target,
      progress: misi.progress,
      selesai: misi.selesai,
      diklaim: misi.diklaim,
      expBonus: misi.expBonus
    }));

    return responseHelper.success("Misi hari ini dimuat.", daftarMisiBersih);
  } catch (error) {
    console.error("[ERROR Misi Harian]:", error);
    return responseHelper.error("Gagal memuat misi harian.");
  }
}

export async function klaimHadiahMisi(idMisiRaw) {
  try {
    await connectToDatabase();
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const idMisiDalamArray = validationHelper.sanitize(idMisiRaw);

    const siswa = await User.findById(userId).select("misiHarian totalExp").lean();
    if (!siswa || !siswa.misiHarian || !siswa.misiHarian.daftar) {
      return responseHelper.error("Siswa/Misi tidak ditemukan.");
    }

    const indexMisi = siswa.misiHarian.daftar.findIndex(m => m._id?.toString() === idMisiDalamArray);
    if (indexMisi === -1) return responseHelper.error("Misi tidak ditemukan.");

    const misi = siswa.misiHarian.daftar[indexMisi];

    if (!misi.selesai) return responseHelper.error("Selesaikan misi terlebih dahulu!");
    if (misi.diklaim) return responseHelper.error("Hadiah misi ini sudah diklaim.");

    const expBaru = (siswa.totalExp || 0) + misi.expBonus;

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          [`misiHarian.daftar.${indexMisi}.diklaim`]: true,
          totalExp: expBaru
        }
      }
    );

    revalidatePath("/", "layout");
    return responseHelper.success(`🎉 Berhasil klaim +${misi.expBonus} EXP!`);
  } catch (error) {
    console.error("[KLAIM_ERROR]:", error);
    return responseHelper.error("Gagal klaim hadiah.");
  }
}