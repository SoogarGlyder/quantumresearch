"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import { authHelper } from "../utils/authHelper";
import { timeHelper } from "../utils/timeHelper";
import { responseHelper } from "../utils/responseHelper";
import { revalidatePath } from "next/cache";

// 🎯 DAFTAR POOL MISI HARIAN
// Sistem akan mengacak 2 misi dari daftar ini setiap harinya
const POOL_MISI = [
  { kodeMisi: "HADIR_KELAS", judul: "Hadir kelas hari ini", target: 1, expBonus: 50 },
  { kodeMisi: "KONSUL_30", judul: "Konsul minimal 30 menit", target: 30, expBonus: 40 },
  { kodeMisi: "KONSUL_60", judul: "Konsul minimal 1 Jam", target: 60, expBonus: 100 },
  { kodeMisi: "DATANG_AWAL", judul: "Absen sebelum jam 15:00", target: 1, expBonus: 60 },
  { kodeMisi: "KONSUL_MALAM", judul: "Selesai konsul di atas jam 18:00", target: 1, expBonus: 75 }
];

export async function cekDanGenerateMisiHarian() {
  try {
    await connectToDatabase();
    const { userId, peran } = await authHelper.ambilSesi();
    
    // Misi harian hanya untuk siswa
    if (!userId || peran !== "siswa") return responseHelper.error("Bukan siswa.");

    const siswa = await User.findById(userId);
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    const hariIni = timeHelper.getTglJakarta(new Date()); // Format: YYYY-MM-DD

    // Jika misi yang ada di database BUKAN misi hari ini, kita RESET dan berikan misi baru
    if (siswa.misiHarian?.tanggal !== hariIni) {
      
      // Pilih 2 misi acak dari POOL_MISI
      const misiAcak = [...POOL_MISI].sort(() => 0.5 - Math.random()).slice(0, 2);
      
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
      return responseHelper.success("Misi harian baru telah di-generate!", siswa.misiHarian.daftar);
    }

    // Jika sudah punya misi hari ini, kembalikan saja misinya
    return responseHelper.success("Misi hari ini dimuat.", siswa.misiHarian.daftar);

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
    siswa.totalExp += misi.expBonus;
    
    await siswa.save();
    revalidatePath("/", "layout");

    return responseHelper.success(`🎉 Berhasil klaim +${misi.expBonus} EXP!`);
  } catch (error) {
    return responseHelper.error("Gagal klaim hadiah.");
  }
}