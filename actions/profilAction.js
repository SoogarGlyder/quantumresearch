"use server";

import connectToDatabase from "../lib/db";
import mongoose from "mongoose";
import User from "../models/User";
import StudySession from "../models/StudySession";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { validationHelper } from "../utils/validationHelper";
import { syncHelper } from "../utils/syncHelper";
import {
  STATUS_SESI,
  PERAN,
  PERIODE_BELAJAR,
  VALIDASI_SISTEM,
  PESAN_SISTEM,
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL SECURITY
// ============================================================================
/**
 * @param {string} idTarget
 * @returns {Promise<boolean>}
 */
async function pastikanPunyaAkses(idTarget) {
  const sesi = await authHelper.ambilSesi();
  if (!sesi?.userId) return false;
  return String(sesi.userId) === String(idTarget) || sesi.peran === PERAN.ADMIN.id;
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

    const [statsKategori, riwayatTanggal] = await Promise.all([
      StudySession.aggregate([
        { $match: { siswaId: oid, status: STATUS_SESI.SELESAI.id } },
        {
          $group: {
            _id: "$jenisSesi",
            totalMenit: {
              $sum: {
                $add: [
                  { $divide: [{ $subtract: ["$waktuSelesai", "$waktuMulai"] }, 60_000] },
                  { $ifNull: ["$konsulExtraMenit", 0] },
                ],
              },
            },
            jumlahSesi: { $sum: 1 },
          },
        },
      ]),
      StudySession.aggregate([
        { $match: { siswaId: oid } },
        {
          $project: {
            tgl: {
              $dateToString: {
                format:   "%Y-%m-%d",
                date:     "$waktuMulai",
                timezone: PERIODE_BELAJAR.TIMEZONE,
              },
            },
          },
        },
        { $group: { _id: "$tgl" } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    let currentStreak = 0;

    if (riwayatTanggal.length > 0) {
      const tglUnik    = riwayatTanggal.map((d) => d._id);
      const hariIni    = timeHelper.getTglJakarta();
      const kemarin    = timeHelper.getTglJakarta(
        new Date(Date.now() - 86_400_000) // 24 jam lalu
      );

      const streakAktif = tglUnik[0] === hariIni || tglUnik[0] === kemarin;

      if (streakAktif) {
        let dHitung = new Date();
        if (tglUnik[0] !== hariIni) dHitung = new Date(Date.now() - 86_400_000);

        const MAKS_STREAK = 366;

        for (let i = 0; i < MAKS_STREAK; i++) {
          const target = timeHelper.getTglJakarta(dHitung);
          if (tglUnik.includes(target)) {
            currentStreak++;
            dHitung = new Date(dHitung.getTime() - 86_400_000);
          } else {
            break;
          }
        }
      }
    }

    return responseHelper.success("Statistik profil dimuat.", {
      stats:  statsKategori,
      streak: currentStreak,
    });
  } catch (error) {
    console.error("[ERROR getStatistikSiswa]:", error);
    return responseHelper.error("Gagal memuat statistik profil.");
  }
}

// ============================================================================
// 3. PROFILE UPDATES
// ============================================================================
export async function updateProfilSiswa(idSiswa, dataUpdate) {
  try {
    await connectToDatabase();
    if (!(await pastikanPunyaAkses(idSiswa))) {
      return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    }

    const payload           = {};
    let adaPerubahanNama    = false;

    if (dataUpdate.nama) {
      payload.nama     = validationHelper.trimInput(dataUpdate.nama);
      adaPerubahanNama = true;
    }

    if (dataUpdate.username) {
      const cleanUser = validationHelper.trimInput(dataUpdate.username).toLowerCase();
      const ada = await User.exists({ username: cleanUser, _id: { $ne: idSiswa } });
      if (ada) return responseHelper.error("Username dipakai pengguna lain.");
      payload.username = cleanUser;
    }

    if (dataUpdate.password) {
      if (dataUpdate.password.length < VALIDASI_SISTEM.MIN_PASSWORD) {
        return responseHelper.error(
          `Password minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter.`
        );
      }
      payload.password = await authHelper.buatHash(dataUpdate.password);
    }

    if (Object.keys(payload).length === 0) {
      return responseHelper.success("Tidak ada perubahan.");
    }

    await User.updateOne({ _id: idSiswa }, { $set: payload });

    if (adaPerubahanNama) {
      syncHelper.sinkronisasiNamaMassal(idSiswa, payload.nama, PERAN.SISWA.id);
    }

    revalidatePath(PERAN.SISWA.home);
    revalidatePath(PERAN.ADMIN.home);

    return responseHelper.success(PESAN_SISTEM.SUKSES_SIMPAN);
  } catch (error) {
    console.error("[ERROR updateProfilSiswa]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}