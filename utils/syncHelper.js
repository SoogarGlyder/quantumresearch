import AbsensiPengajar from "../models/AbsensiPengajar";
import BankSoal from "../models/BankSoal";
import HasilKuis from "../models/HasilKuis";
import Jadwal from "../models/Jadwal";
import LatihanSoal from "../models/LatihanSoal";
import Quiz from "../models/Quiz";
import StudySession from "../models/StudySession";
import { PERAN } from "./constants";

/**
 * ============================================================================
 * BACKGROUND WORKER: SINKRONISASI NAMA DENORMALISASI
 * ============================================================================
 */
export const syncHelper = {
  /**
   * @param {string} userId - ID User (Siswa/Pengajar/Admin)
   * @param {string} namaBaru - Nama hasil update terbaru
   * @param {string} peran - Peran user (berdasarkan PERAN.SISWA.id dll)
   */
  sinkronisasiNamaMassal: async (userId, namaBaru, peran) => {
    try {
      console.log(`[syncHelper] Memulai sinkronisasi background untuk ID: ${userId} -> ${namaBaru}`);
      
      const operasiSinkronisasi = [];

      if (peran === PERAN.SISWA.id) {
        operasiSinkronisasi.push(
          StudySession.updateMany({ siswaId: userId }, { $set: { namaSiswa: namaBaru } }),
          HasilKuis.updateMany({ siswaId: userId }, { $set: { namaSiswa: namaBaru } })
        );
      }

      if (peran === PERAN.PENGAJAR.id || peran === PERAN.ADMIN.id) {
        operasiSinkronisasi.push(
          Jadwal.updateMany({ pengajarId: userId }, { $set: { namaPengajar: namaBaru } }),
          AbsensiPengajar.updateMany({ pengajarId: userId }, { $set: { namaPengajar: namaBaru } }),
          StudySession.updateMany({ pengajarPendamping: userId }, { $set: { namaPengajarPendamping: namaBaru } }),
          BankSoal.updateMany({ pembuatId: userId }, { $set: { namaPembuat: namaBaru } }),
          Quiz.updateMany({ pembuatId: userId }, { $set: { namaPembuat: namaBaru } }),
          LatihanSoal.updateMany({ pembuatId: userId }, { $set: { namaPembuat: namaBaru } })
        );
      }

      const hasil = await Promise.allSettled(operasiSinkronisasi);
      
      const yangGagal = hasil.filter(r => r.status === "rejected");
      if (yangGagal.length > 0) {
        console.warn(`[syncHelper] Ada ${yangGagal.length} operasi update yang gagal.`, yangGagal);
      } else {
        console.log(`[syncHelper] Sinkronisasi nama ${namaBaru} sukses 100%.`);
      }

    } catch (error) {
      console.error("[syncHelper] Terjadi kegagalan fatal saat sinkronisasi:", error.message);
    }
  }
};