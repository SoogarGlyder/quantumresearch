"use server";

import connectToDatabase from "../lib/db";
import StudySession from "../models/StudySession";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { 
  STATUS_SESI, 
  TIPE_SESI, 
  PESAN_SISTEM,
  GAMIFIKASI 
} from "../utils/constants";

// ============================================================================
// 1. INTERNAL HELPERS (Gamification)
// ============================================================================

/**
 * Memberikan gelar berdasarkan total jam belajar yang dikumpulkan
 * 🚀 SEKARANG MEMBACA OTOMATIS DARI CONSTANTS
 */
function tentukanGelar(jamTotal) {
  const gelarMatch = GAMIFIKASI.GELAR_KLASEMEN.find(g => jamTotal >= g.minJam);
  return gelarMatch ? gelarMatch.gelar : "🐢 Masih Pemanasan";
}

// ============================================================================
// 2. MAIN ACTION (HIGH PERFORMANCE AGGREGATION)
// ============================================================================

export async function dapatkanKlasemenBulanIni(filterKelas = "Semua Kelas") {
  try {
    await connectToDatabase();

    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const awalBulan = timeHelper.getAwalBulan();
    const kini = new Date();
    const awalBulanDepan = new Date(Date.UTC(kini.getFullYear(), kini.getMonth() + 1, 1, -7, 0, 0, 0));

    const pipeline = [
      {
        $match: {
          waktuMulai: { $gte: awalBulan, $lt: awalBulanDepan },
          status: STATUS_SESI.SELESAI.id 
        }
      },
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
      {
        $project: {
          siswaId: 1,
          totalSesi: { $add: ["$menitMurni", "$menitBonus"] }
        }
      },
      {
        $group: {
          _id: "$siswaId",
          akumulasiMenit: { $sum: "$totalSesi" }
        }
      },
      { $match: { akumulasiMenit: { $gt: 0 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "siswa"
        }
      },
      { $unwind: "$siswa" }
    ];

    if (filterKelas && filterKelas !== "Semua Kelas") {
      pipeline.push({
        $match: { "siswa.kelas": filterKelas }
      });
    }

    pipeline.push(
      { $sort: { akumulasiMenit: -1 } },
      { $limit: 10 },
      {
        $project: {
          nama: "$siswa.nama",
          kelas: "$siswa.kelas", 
          akumulasiMenit: 1
        }
      }
    );

    const klasemenMentah = await StudySession.aggregate(pipeline);

    const dataFinal = klasemenMentah.map((item, index) => {
      const total = Math.floor(item.akumulasiMenit);
      const jam = Math.floor(total / 60);
      const menit = total % 60;

      return {
        peringkat: index + 1,
        // ✅ FIX: Mengubah ObjectId menjadi String murni agar Next.js tidak error
        idSiswa: item._id.toString(), 
        nama: item.nama || "Siswa Quantum", 
        kelas: item.kelas || "N/A",        
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