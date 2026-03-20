"use server";

import connectToDatabase from "../lib/db";
import StudySession from "../models/StudySession";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { STATUS_SESI, TIPE_SESI } from "../utils/constants";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

function samarkanNama(namaLengkap) {
  if (!namaLengkap) return "Siswa Quantum";
  const bagian = namaLengkap.trim().split(" ");
  let hasil = bagian[0];
  // Samarkan nama belakang untuk privasi di papan publik
  if (bagian.length > 1) hasil += ` ${bagian[1].charAt(0)}***`;
  return hasil;
}

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

    // 1. Proteksi Sesi: Pastikan hanya user login yang bisa lihat (opsional tapi disarankan)
    const { userId } = await authHelper.ambilSesi();
    if (!userId) return responseHelper.error("Silakan login untuk melihat klasemen.");

    // 2. Logika Waktu Jakarta via timeHelper
    const awalBulan = timeHelper.getAwalBulan();
    
    // Cari awal bulan depan untuk batas atas query ($lt)
    const kini = new Date();
    const awalBulanDepan = new Date(Date.UTC(kini.getFullYear(), kini.getMonth() + 1, 1, -7, 0, 0, 0));

    // 3. MONGODB AGGREGATION PIPELINE
    const klasemenMentah = await StudySession.aggregate([
      // TAHAP A: Filter data bulan ini yang sudah selesai
      {
        $match: {
          waktuMulai: { $gte: awalBulan, $lt: awalBulanDepan },
          status: STATUS_SESI.SELESAI 
        }
      },
      // TAHAP B: Proyeksi menit (Durasi murni konsul + Bonus extra menit dari kelas)
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
      // TAHAP C: Akumulasi total per baris
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
      // TAHAP E: Filter hanya yang punya record menit positif
      { $match: { akumulasiMenit: { $gt: 0 } } },
      // TAHAP F: Sorting & Limiting (Top 10)
      { $sort: { akumulasiMenit: -1 } },
      { $limit: 10 },
      // TAHAP G: Join ke User untuk ambil Nama (Gunakan $lookup)
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "siswa"
        }
      },
      { $unwind: "$siswa" },
      // TAHAP H: Bersihkan data (Hanya ambil field yang diperlukan)
      {
        $project: {
          nama: "$siswa.nama",
          akumulasiMenit: 1
        }
      }
    ]);

    // 4. Final Mapping untuk Frontend
    const dataFinal = klasemenMentah.map((item, index) => {
      const total = Math.floor(item.akumulasiMenit);
      const jam = Math.floor(total / 60);
      const menit = total % 60;

      return {
        peringkat: index + 1,
        nama: samarkanNama(item.nama),
        jam,
        menit,
        gelar: tentukanGelar(jam)
      };
    });

    return responseHelper.success("Klasemen berhasil dimuat.", dataFinal);

  } catch (error) {
    return responseHelper.error("Gagal memproses ranking klasemen.", error);
  }
}