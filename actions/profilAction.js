"use server";

import connectToDatabase from "../lib/db";
import mongoose from "mongoose";
import User from "../models/User";
import StudySession from "../models/StudySession";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { validationHelper } from "../utils/validationHelper";
import { STATUS_SESI } from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL SECURITY
// ============================================================================
async function pastikanPunyaAkses(idTarget) {
  const { userId, peran } = await authHelper.ambilSesi();
  if (!userId) return false;
  // Akses diizinkan jika pemilik akun atau Admin
  return String(userId) === String(idTarget) || peran === "admin";
}

// ============================================================================
// 2. STATISTIK & GAMIFIKASI (STREAK LOGIC)
// ============================================================================
export async function getStatistikSiswa(idSiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanPunyaAkses(idSiswa))) return responseHelper.error("Akses Ditolak!");

    const oid = new mongoose.Types.ObjectId(idSiswa);

    // --- AGGREGATION: Total Jam Belajar per Kategori ---
    const statsKategori = await StudySession.aggregate([
      { $match: { siswaId: oid, status: STATUS_SESI.SELESAI } },
      {
        $group: {
          _id: "$jenisSesi",
          totalMenit: {
            $sum: {
              $add: [
                { $divide: [{ $subtract: ["$waktuSelesai", "$waktuMulai"] }, 60000] },
                { $ifNull: ["$konsulExtraMenit", 0] }
              ]
            }
          },
          jumlahSesi: { $sum: 1 }
        }
      }
    ]);

    // --- LOGIC: Streak Kehadiran (WIB Safe via timeHelper) ---
    const riwayatTanggal = await StudySession.aggregate([
      { $match: { siswaId: oid } },
      { 
        $project: { 
          tgl: { $dateToString: { format: "%Y-%m-%d", date: "$waktuMulai", timezone: "Asia/Jakarta" } } 
        } 
      },
      { $group: { _id: "$tgl" } },
      { $sort: { _id: -1 } }
    ]);

    let currentStreak = 0;
    if (riwayatTanggal.length > 0) {
      const tglUnik = riwayatTanggal.map(d => d._id); // List tanggal YYYY-MM-DD
      const hariIni = timeHelper.getTglJakarta();
      
      const dCek = new Date();
      let tglCekStr = timeHelper.getTglJakarta(dCek);
      
      // Jika absen terakhir bukan hari ini dan bukan kemarin, streak putus (reset 0)
      dCek.setDate(dCek.getDate() - 1);
      const tglKemarinStr = timeHelper.getTglJakarta(dCek);

      if (tglUnik[0] !== hariIni && tglUnik[0] !== tglKemarinStr) {
        currentStreak = 0;
      } else {
        // Mulai hitung mundur
        let pointer = 0;
        let dHitung = new Date();
        
        // Jika hari ini belum scan, mulai pengecekan dari kemarin
        if (tglUnik[0] !== hariIni) {
          dHitung.setDate(dHitung.getDate() - 1);
        }

        while (pointer < tglUnik.length) {
          const target = timeHelper.getTglJakarta(dHitung);
          if (tglUnik.includes(target)) {
            currentStreak++;
            dHitung.setDate(dHitung.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    return responseHelper.success("Statistik berhasil dimuat.", {
      stats: statsKategori,
      streak: currentStreak
    });
  } catch (error) {
    return responseHelper.error("Gagal memuat profil statistik.", error);
  }
}

// ============================================================================
// 3. PROFILE UPDATES
// ============================================================================
export async function updateProfilSiswa(idSiswa, dataUpdate) {
  try {
    await connectToDatabase();
    if (!(await pastikanPunyaAkses(idSiswa))) return responseHelper.error("Akses Ditolak!");

    const payload = {};

    // 1. Sanitasi & Validasi Username
    if (dataUpdate.username) {
      const cleanUser = validationHelper.sanitize(dataUpdate.username).toLowerCase();
      if (!validationHelper.isValidUsername(cleanUser)) {
        return responseHelper.error("Format username tidak valid.");
      }
      
      const ada = await User.findOne({ username: cleanUser, _id: { $ne: idSiswa } }).select("_id");
      if (ada) return responseHelper.error("Username sudah dipakai siswa lain.");
      payload.username = cleanUser;
    }

    // 2. Validasi & Hashing Password
    if (dataUpdate.password) {
      if (!validationHelper.isValidPassword(dataUpdate.password)) {
        return responseHelper.error("Password minimal 6 karakter.");
      }
      payload.password = await authHelper.buatHash(dataUpdate.password);
    }

    if (Object.keys(payload).length === 0) {
      return responseHelper.success("Tidak ada data yang diubah.");
    }

    await User.findByIdAndUpdate(idSiswa, payload);
    revalidatePath("/profile");
    
    return responseHelper.success("Profil berhasil diperbarui!");
  } catch (error) {
    return responseHelper.error("Kesalahan server saat memperbarui profil.", error);
  }
}