"use server";

import connectToDatabase from "../lib/db";
import mongoose from "mongoose";
import User from "../models/User";
import StudySession from "../models/StudySession";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { validationHelper } from "../utils/validationHelper";
import { 
  STATUS_SESI, 
  PERAN, 
  TIPE_SESI, 
  PERIODE_BELAJAR,
  VALIDASI_SISTEM,
  PESAN_SISTEM 
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL SECURITY
// ============================================================================

async function pastikanPunyaAkses(idTarget) {
  const { userId, peran } = await authHelper.ambilSesi();
  if (!userId) return false;
  
  const isPemilik = String(userId) === String(idTarget);
  const isAdmin = peran === PERAN.ADMIN.id;
  
  return isPemilik || isAdmin;
}

// ============================================================================
// 2. STATISTIK & GAMIFIKASI
// ============================================================================

export async function getStatistikSiswa(idSiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanPunyaAkses(idSiswa))) {
      return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    }

    const oid = new mongoose.Types.ObjectId(idSiswa);

    const statsKategori = await StudySession.aggregate([
      { 
        $match: { 
          siswaId: oid, 
          status: STATUS_SESI.SELESAI.id 
        } 
      },
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

    const riwayatTanggal = await StudySession.aggregate([
      { $match: { siswaId: oid } },
      { 
        $project: { 
          tgl: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$waktuMulai", 
              timezone: PERIODE_BELAJAR.TIMEZONE 
            } 
          } 
        } 
      },
      { $group: { _id: "$tgl" } },
      { $sort: { _id: -1 } }
    ]);

    let currentStreak = 0;
    if (riwayatTanggal.length > 0) {
      const tglUnik = riwayatTanggal.map(d => d._id); 
      const hariIni = timeHelper.getTglJakarta();
      const dCek = new Date();
      dCek.setDate(dCek.getDate() - 1);
      const tglKemarinStr = timeHelper.getTglJakarta(dCek);

      if (tglUnik[0] !== hariIni && tglUnik[0] !== tglKemarinStr) {
        currentStreak = 0;
      } else {
        let dHitung = new Date();
        if (tglUnik[0] !== hariIni) dHitung.setDate(dHitung.getDate() - 1);

        while (true) {
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

    return responseHelper.success("Statistik profil dimuat.", {
      stats: statsKategori,
      streak: currentStreak
    });
  } catch (error) {
    return responseHelper.error("Gagal statistik profil.");
  }
}

// ============================================================================
// 3. PROFILE UPDATES
// ============================================================================

export async function updateProfilSiswa(idSiswa, dataUpdate) {
  try {
    await connectToDatabase();
    if (!(await pastikanPunyaAkses(idSiswa))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const payload = {};

    if (dataUpdate.username) {
      const cleanUser = validationHelper.sanitize(dataUpdate.username).toLowerCase();
      const ada = await User.findOne({ 
        username: cleanUser, 
        _id: { $ne: idSiswa } 
      }).select("_id");
      
      if (ada) return responseHelper.error("Username dipakai pengguna lain.");
      payload.username = cleanUser;
    }

    if (dataUpdate.password) {
      // Menggunakan minimal karakter dari konstanta
      if (dataUpdate.password.length < VALIDASI_SISTEM.MIN_PASSWORD) {
        return responseHelper.error(`Password minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter.`);
      }
      payload.password = await authHelper.buatHash(dataUpdate.password);
    }

    if (Object.keys(payload).length === 0) return responseHelper.success("Tidak ada perubahan.");

    await User.findByIdAndUpdate(idSiswa, payload);
    
    revalidatePath(PERAN.SISWA.home);
    revalidatePath(PERAN.ADMIN.home);
    
    return responseHelper.success(PESAN_SISTEM.SUKSES_SIMPAN);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}