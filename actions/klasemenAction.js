"use server";

import connectToDatabase from "../lib/db";
import StudySession from "../models/StudySession";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { 
  STATUS_SESI, 
  TIPE_SESI, 
  PERIODE_BELAJAR,
  PESAN_SISTEM 
} from "../utils/constants";

// ============================================================================
// 1. INTERNAL HELPERS (Gamification)
// ============================================================================

/**
 * Memberikan gelar berdasarkan total jam belajar yang dikumpulkan
 */
function tentukanGelar(jamTotal) {
  if (jamTotal >= 30) return "👑 Yang Punya Quantum";
  if (jamTotal >= 20) return "🔥 Sepuh Quantum";
  if (jamTotal >= 10) return "⚔️ Pejuang Ambis";
  if (jamTotal >= 5)  return "🚀 Mulai Panas";
  return "🐢 Masih Pemanasan";
}

// ============================================================================
// 2. MAIN ACTION (HIGH PERFORMANCE AGGREGATION)
// ============================================================================

export async function dapatkanKlasemenBulanIni() {
  try {
    await connectToDatabase();

    // 1. Proteksi Sesi
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    // 2. Definisi Rentang Waktu (Bulan Berjalan)
    const awalBulan = timeHelper.getAwalBulan();
    const kini = new Date();
    const awalBulanDepan = new Date(Date.UTC(kini.getFullYear(), kini.getMonth() + 1, 1, -7, 0, 0, 0));

    // 3. MONGODB AGGREGATION PIPELINE
    const klasemenMentah = await StudySession.aggregate([
      // TAHAP A: Filter sesi bulan ini yang statusnya sudah 'selesai'
      {
        $match: {
          waktuMulai: { $gte: awalBulan, $lt: awalBulanDepan },
          status: STATUS_SESI.SELESAI.id 
        }
      },
      // TAHAP B: Proyeksi durasi menit
      {
        $project: {
          siswaId: 1,
          menitMurni: {
            $cond: [
              { $eq: ["$jenisSesi", TIPE_SESI.KONSUL] },
              { $divide: [{ $subtract: ["$waktuSelesai", "$waktuMulai"] }, 60000] },
              0
            ]
          },
          menitBonus: { $ifNull: ["$konsulExtraMenit", 0] }
        }
      },
      // TAHAP C: Akumulasi total per dokumen
      {
        $project: {
          siswaId: 1,
          totalSesi: { $add: ["$menitMurni", "$menitBonus"] }
        }
      },
      // TAHAP D: Grouping berdasarkan Siswa
      {
        $group: {
          _id: "$siswaId",
          akumulasiMenit: { $sum: "$totalSesi" }
        }
      },
      // TAHAP E: Filter record positif
      { $match: { akumulasiMenit: { $gt: 0 } } },
      // TAHAP F: Sorting Top Ranking
      { $sort: { akumulasiMenit: -1 } },
      // TAHAP G: Ambil Top 10
      { $limit: 10 },
      // TAHAP H: Join ke Collection User
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "siswa"
        }
      },
      { $unwind: "$siswa" },
      // TAHAP I: Bersihkan data akhir (MENAMBAHKAN KELAS DI SINI 🚀)
      {
        $project: {
          nama: "$siswa.nama",
          kelas: "$siswa.kelas", // 👈 Sekarang kelas ikut dikirim ke frontend
          akumulasiMenit: 1
        }
      }
    ]);

    // 4. Final Mapping untuk UI
    const dataFinal = klasemenMentah.map((item, index) => {
      const total = Math.floor(item.akumulasiMenit);
      const jam = Math.floor(total / 60);
      const menit = total % 60;

      return {
        peringkat: index + 1,
        idSiswa: item._id,
        nama: item.nama || "Siswa Quantum", // 👈 Nama lengkap tanpa sensor
        kelas: item.kelas || "N/A",        // 👈 Kelas asli muncul
        jam,
        menit,
        totalMenit: total,
        gelar: tentukanGelar(jam)
      };
    });

    return responseHelper.success("Klasemen bulan ini dimuat.", dataFinal);

  } catch (error) {
    console.error("[KLASEMEN_ERROR]:", error.message);
    return responseHelper.error("Gagal memproses data klasemen.");
  }
}