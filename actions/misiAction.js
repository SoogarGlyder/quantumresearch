"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import MisiSiswa from "../models/MisiSiswa"; // 🔥 Menggunakan Model Baru
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

    const hariIni = timeHelper.getTglJakarta(new Date());

    // 1. Cek apakah siswa sudah memiliki dokumen misi di tabel MisiSiswa hari ini
    let dokumenMisi = await MisiSiswa.findOne({ siswaId: userId, tanggal: hariIni }).lean();

    if (!dokumenMisi) {
      // 2. Jika belum ada, ambil kodeCabang dari user untuk Multi-Tenant
      const siswaData = await User.findById(userId).select("kodeCabang").lean();
      if (!siswaData) return responseHelper.error("Siswa tidak ditemukan.");

      // 3. Generate misi acak dari POOL
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

      // 4. Simpan ke koleksi MisiSiswa (Bukan ke User lagi!)
      dokumenMisi = await MisiSiswa.create({
        siswaId: userId,
        tanggal: hariIni,
        kodeCabang: siswaData.kodeCabang,
        daftarMisi: daftarMisiBaru
      });

      revalidatePath("/", "layout");
    }

    const daftarMisiBersih = dokumenMisi.daftarMisi.map(misi => ({
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

    // 🔥 Ganti sanitize -> trimInput
    const idMisiDalamArray = validationHelper.trimInput(idMisiRaw);
    const hariIni = timeHelper.getTglJakarta(new Date());

    // 1. Cari dokumen misi spesifik di hari ini
    const dokumenMisi = await MisiSiswa.findOne({ siswaId: userId, tanggal: hariIni });
    if (!dokumenMisi) return responseHelper.error("Misi hari ini tidak ditemukan.");

    const indexMisi = dokumenMisi.daftarMisi.findIndex(m => m._id?.toString() === idMisiDalamArray);
    if (indexMisi === -1) return responseHelper.error("Misi tidak ditemukan.");

    const misi = dokumenMisi.daftarMisi[indexMisi];

    if (!misi.selesai) return responseHelper.error("Selesaikan misi terlebih dahulu!");
    if (misi.diklaim) return responseHelper.error("Hadiah misi ini sudah diklaim.");

    // 2. Update status klaim di tabel MisiSiswa
    dokumenMisi.daftarMisi[indexMisi].diklaim = true;
    await dokumenMisi.save();

    // 3. Tambahkan EXP ke tabel User (menggunakan atomic $inc agar anti-crash)
    await User.updateOne(
      { _id: userId },
      { $inc: { totalExp: misi.expBonus } }
    );

    revalidatePath("/", "layout");
    return responseHelper.success(`🎉 Berhasil klaim +${misi.expBonus} EXP!`);
  } catch (error) {
    console.error("[KLAIM_ERROR]:", error);
    return responseHelper.error("Gagal klaim hadiah.");
  }
}