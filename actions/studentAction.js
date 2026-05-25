"use server";

import connectDB from "../lib/db";
import Jadwal from "../models/Jadwal";
import Quiz from "../models/Quiz";
import StudySession from "../models/StudySession";
import HasilKuis from "../models/HasilKuis";
import mongoose from "mongoose";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { PESAN_SISTEM, PERAN } from "../utils/constants";

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 1. AMBIL DATA KUIS (ANTI-CHEAT + PARALLEL)
// ============================================================================
export const getKuisSiswa = async (jadwalId) => {
  try {
    await connectDB();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const [jadwalData, dataKuis] = await Promise.all([
      Jadwal.findById(jadwalId).select('mapel kelasTarget').lean(),
      Quiz.findOne({ jadwalId, isAktif: true }).select('-soal.kunciJawaban -soal.pembahasan').lean()
    ]);

    if (!dataKuis || !dataKuis.soal || dataKuis.soal.length === 0) {
      return responseHelper.error("Soal ujian belum tersedia.");
    }

    return responseHelper.success("Soal berhasil dimuat", serialize({
      mapel: jadwalData?.mapel || "Kuis CBT",
      kelas: jadwalData?.kelasTarget || "-",
      jumlahSoal: dataKuis.soal.length,
      soal: dataKuis.soal
    }));

  } catch (error) {
    console.error("[ERROR getKuisSiswa]:", error);
    return responseHelper.error("Terjadi kesalahan server saat memuat soal.");
  }
};

// ============================================================================
// 2. KUMPULKAN UJIAN (GRADING & AUTO-SYNC JURNAL) - DENGAN TRANSACTION 🔥
// ============================================================================
export const kumpulkanUjianSiswa = async ({ jadwalId, siswaId, nama, jawabanSiswa }) => {
  let session;
  try {
    await connectDB();
    const sesiAuth = await authHelper.ambilSesi();
    if (!sesiAuth || !sesiAuth.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    if (sesiAuth.peran === PERAN.SISWA.id && sesiAuth.userId !== siswaId) {
      return responseHelper.error("Akses Ditolak: Anda tidak dapat mengumpulkan ujian atas nama orang lain.");
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const sudahPernah = await HasilKuis.exists({ jadwalId, siswaId }).session(session);
    if (sudahPernah) {
      await session.abortTransaction();
      session.endSession();
      return responseHelper.error("Anda sudah mengumpulkan kuis ini.");
    }

    const dataKuis = await Quiz.findOne({ jadwalId }).select("_id soal").session(session).lean();
    if (!dataKuis) {
      await session.abortTransaction();
      session.endSession();
      return responseHelper.error("Data Kuis tidak ditemukan.");
    }

    const soalAsli = dataKuis.soal;
    let expDidapat = 0;
    let totalExpMaksimal = 0;
    const detailJawabanData = [];

    jawabanSiswa.forEach((jawaban, index) => {
      const soalDb = soalAsli[index];
      if (soalDb) {
        const bobot = Number(soalDb.bobotExp) || 20;
        totalExpMaksimal += bobot;

        const kunciDbArr = Array.isArray(soalDb.kunciJawaban) ? soalDb.kunciJawaban.map(String) : [String(soalDb.kunciJawaban || "")];
        const jwbSiswaArr = Array.isArray(jawaban) ? jawaban.map(String) : [String(jawaban || "")];

        let isBenar = false;
        const tipe = soalDb.tipeSoal || "PG";

        if (tipe === "PG_KOMPLEKS") {
          const a = [...jwbSiswaArr].sort().join(",").toLowerCase().trim();
          const b = [...kunciDbArr].sort().join(",").toLowerCase().trim();
          isBenar = (a === b) && (a !== "");
        } else {
          isBenar = String(jwbSiswaArr[0]).trim().toLowerCase() === String(kunciDbArr[0]).trim().toLowerCase();
        }

        if (isBenar) expDidapat += bobot;

        detailJawabanData.push({
          kunciJawaban: kunciDbArr,
          jawabanSiswa: jwbSiswaArr,
          isBenar
        });
      }
    });

    const skorAkhir = totalExpMaksimal > 0 ? Math.round((expDidapat / totalExpMaksimal) * 100) : 0;
    const namaAman = validationHelper.sanitize(nama);

    await Promise.all([
      HasilKuis.create([{
        jadwalId: new mongoose.Types.ObjectId(jadwalId),
        quizId: dataKuis._id,
        siswaId: new mongoose.Types.ObjectId(siswaId),
        namaSiswa: namaAman,
        skorAkhir,
        detailJawaban: detailJawabanData
      }], { session }),

      StudySession.updateOne(
        { siswaId: new mongoose.Types.ObjectId(siswaId), jadwalId: new mongoose.Types.ObjectId(jadwalId) },
        { $set: { nilaiTest: skorAkhir } },
        { session }
      )
    ]);

    await session.commitTransaction();
    session.endSession();

    return responseHelper.success("Ujian berhasil dikumpulkan!", { skor: skorAkhir, exp: expDidapat });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("[CRITICAL ERROR] Kumpul Ujian CBT:", error);
    return responseHelper.error("Sistem sibuk. Gagal memproses nilai kuis, silakan coba lagi.");
  }
};

// ============================================================================
// 3. CEK KETERSEDIAAN KUIS (DIET DATA)
// ============================================================================
export const cekKetersediaanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const [kuis, riwayat] = await Promise.all([
      Quiz.findOne({ jadwalId, isAktif: true }).select("_id durasi soal").lean(),
      HasilKuis.findOne({ jadwalId, siswaId }).select("skorAkhir").lean()
    ]);

    if (!kuis || !kuis.soal) return responseHelper.success("Tidak ada kuis", { ada: false });

    return responseHelper.success("Kuis tersedia", {
      ada: true,
      _id: kuis._id.toString(),
      jumlahSoal: kuis.soal.length,
      durasi: kuis.durasi || 10,
      isSudahDikerjakan: !!riwayat,
      skor: riwayat ? riwayat.skorAkhir : null,
    });
  } catch (error) {
    return responseHelper.success("Error memuat", { ada: false });
  }
};

// ============================================================================
// 4. AMBIL PEMBAHASAN (Untuk Mode Review)
// ============================================================================
export const getPembahasanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const [dataKuis, riwayatHasil] = await Promise.all([
      Quiz.findOne({ jadwalId }).select("soal").lean(),
      HasilKuis.findOne({ jadwalId, siswaId }).select("detailJawaban").lean()
    ]);

    if (!riwayatHasil || !riwayatHasil.detailJawaban) {
      return responseHelper.error("Akses ditolak. Riwayat pengerjaan tidak ditemukan.");
    }

    if (!dataKuis || !dataKuis.soal) {
      return responseHelper.error("Soal asli telah dihapus oleh pengajar.");
    }

    const jawabanSiswaEkstrak = riwayatHasil.detailJawaban.map(d => {
      if (d.jawabanSiswa.length > 1) return d.jawabanSiswa;
      return d.jawabanSiswa[0] || "";
    });

    return responseHelper.success("Pembahasan dimuat", serialize({
      soal: dataKuis.soal,
      jawabanSiswa: jawabanSiswaEkstrak
    }));
  } catch (error) {
    console.error("[ERROR getPembahasanKuis]:", error);
    return responseHelper.error("Terjadi kesalahan server saat mengambil pembahasan.");
  }
};

// ============================================================================
// 5. RIWAYAT KUIS (N+1 EXTERMINATOR)
// ============================================================================
export const getRiwayatKuisSiswa = async (siswaId) => {
  try {
    await connectDB();
    const sesi = await authHelper.ambilSesi();
    if (!sesi || !sesi.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const riwayat = await HasilKuis.find({ siswaId })
      .populate("jadwalId", "mapel bab tanggal")
      .populate("quizId", "soal")
      .sort({ dikumpulkanPada: -1 })
      .lean();

    const dataFinal = riwayat.map(r => ({
      _id: r._id.toString(),
      jadwalId: r.jadwalId ? r.jadwalId._id.toString() : "-",
      mapel: r.jadwalId?.mapel || "Kuis CBT",
      bab: r.jadwalId?.bab || "Ujian",
      tanggal: r.jadwalId?.tanggal || r.dikumpulkanPada,
      skor: r.skorAkhir || 0,
      jumlahSoal: r.quizId?.soal?.length || r.detailJawaban?.length || 0
    }));

    return responseHelper.success("Riwayat dimuat", serialize(dataFinal));
  } catch (error) {
    console.error("Error getRiwayatKuisSiswa:", error);
    return responseHelper.error("Gagal memuat riwayat kuis.");
  }
};