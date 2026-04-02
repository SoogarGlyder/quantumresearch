"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import { authHelper } from "../utils/authHelper";
import { timeHelper } from "../utils/timeHelper";
import { responseHelper } from "../utils/responseHelper";
import { revalidatePath } from "next/cache";

// 🚀 FIX: Import GAMIFIKASI dari constants
import { GAMIFIKASI } from "../utils/constants";

export async function cekDanGenerateMisiHarian() {
  try {
    await connectToDatabase();
    const { userId, peran } = await authHelper.ambilSesi();
    
    // Misi harian hanya untuk siswa
    if (!userId || peran !== "siswa") return responseHelper.error("Bukan siswa.");

    const siswa = await User.findById(userId);
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    const hariIni = timeHelper.getTglJakarta(new Date()); // Format: YYYY-MM-DD

    let daftarMisi = siswa.misiHarian?.daftar || [];

    // Jika misi yang ada di database BUKAN misi hari ini, kita RESET dan berikan misi baru
    if (siswa.misiHarian?.tanggal !== hariIni) {
      
      // 🚀 FIX: Mengambil misi acak dari Constants
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

      siswa.misiHarian = {
        tanggal: hariIni,
        daftar: daftarMisiBaru
      };

      await siswa.save();
      revalidatePath("/", "layout");
      
      // Update variabel referensi ke data yang baru disimpan
      daftarMisi = siswa.misiHarian.daftar; 
    }

    // ✅ FIX ERROR CALL STACK:
    // Kita tidak boleh mengembalikan dokumen MongoDB mentah ke React.
    // Kita harus mapping ulang agar _id menjadi String biasa.
    const daftarMisiBersih = daftarMisi.map(misi => ({
      _id: misi._id.toString(), // 👈 Ini penyelamatnya!
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

// Fungsi tambahan untuk siswa menekan tombol "Klaim EXP" saat misi selesai
export async function klaimHadiahMisi(idMisiDalamArray) {
  try {
    await connectToDatabase();
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error("Sesi habis.");

    const siswa = await User.findById(userId);
    const misi = siswa.misiHarian.daftar.id(idMisiDalamArray);

    if (!misi) return responseHelper.error("Misi tidak ditemukan.");
    if (!misi.selesai) return responseHelper.error("Selesaikan misi terlebih dahulu!");
    if (misi.diklaim) return responseHelper.error("Hadiah misi ini sudah diklaim.");

    // Berikan EXP dan tandai sudah diklaim
    misi.diklaim = true;
    siswa.totalExp = (siswa.totalExp || 0) + misi.expBonus; // 👈 Fallback jika totalExp belum ada
    
    await siswa.save();
    revalidatePath("/", "layout");

    return responseHelper.success(`🎉 Berhasil klaim +${misi.expBonus} EXP!`);
  } catch (error) {
    console.error("[KLAIM_ERROR]:", error);
    return responseHelper.error("Gagal klaim hadiah.");
  }
}