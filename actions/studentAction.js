"use server";

import connectToDatabase from "../lib/db";
import Jadwal from "../models/Jadwal";
import Quiz from "../models/Quiz";
import StudySession from "../models/StudySession";
import HasilKuis from "../models/HasilKuis";
import mongoose from "mongoose";
import { responseHelper, serialize } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { ambilSesiAktif } from "../utils/guardHelper";
import { PESAN_SISTEM, PERAN } from "../utils/constants";

// ============================================================================
// 1. AMBIL DATA KUIS (ANTI-CHEAT)
// ============================================================================
export const getKuisSiswa = async (jadwalId) => {
  try {
    if (!validationHelper.isValidObjectId(jadwalId)) {
      return responseHelper.error("ID Jadwal tidak valid.", null, "INVALID_ID");
    }

    await connectToDatabase();
    const sesi = await ambilSesiAktif();
    if (!sesi) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const [jadwalData, dataKuis] = await Promise.all([
      Jadwal.findById(jadwalId).select("mapel kelasTarget").lean(),
      Quiz.findOne({ jadwalId, isAktif: true })
        .select("-soal.kunciJawaban -soal.pembahasan")
        .lean(),
    ]);

    if (!dataKuis?.soal?.length) {
      return responseHelper.error("Soal ujian belum tersedia.");
    }

    return responseHelper.success("Soal berhasil dimuat", serialize({
      mapel:      jadwalData?.mapel      || "Kuis CBT",
      kelas:      jadwalData?.kelasTarget || "-",
      jumlahSoal: dataKuis.soal.length,
      soal:       dataKuis.soal,
    }));
  } catch (error) {
    console.error("[ERROR getKuisSiswa]:", error);
    return responseHelper.error("Terjadi kesalahan server saat memuat soal.");
  }
};

// ============================================================================
// 2. KUMPULKAN UJIAN (GRADING) — DENGAN TRANSACTION
// ============================================================================
export const kumpulkanUjianSiswa = async ({ jadwalId, siswaId, nama, jawabanSiswa }) => {
  let session;
  try {
    await connectToDatabase();
    const sesiAuth = await ambilSesiAktif();
    if (!sesiAuth) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    if (sesiAuth.peran === PERAN.SISWA.id && String(sesiAuth.userId) !== String(siswaId)) {
      return responseHelper.error("Akses Ditolak: Anda tidak dapat mengumpulkan ujian atas nama orang lain.");
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const [sudahPernah, dataKuis] = await Promise.all([
      HasilKuis.exists({ jadwalId, siswaId }).session(session),
      Quiz.findOne({ jadwalId }).select("_id soal").session(session).lean(),
    ]);

    if (sudahPernah) {
      await session.abortTransaction();
      session.endSession();
      return responseHelper.error("Anda sudah mengumpulkan kuis ini.");
    }
    if (!dataKuis) {
      await session.abortTransaction();
      session.endSession();
      return responseHelper.error("Data Kuis tidak ditemukan.");
    }

    let expDidapat      = 0;
    let totalExpMaksimal = 0;
    let totalBenar      = 0;
    let totalSalah      = 0;
    const arrayJawaban  = [];

    jawabanSiswa.forEach((jawaban, index) => {
      const soalDb = dataKuis.soal[index];
      if (!soalDb) return;

      const bobot       = Number(soalDb.bobotExp) || 20;
      totalExpMaksimal += bobot;

      const kunciArr  = Array.isArray(soalDb.kunciJawaban)
        ? soalDb.kunciJawaban.map(String)
        : [String(soalDb.kunciJawaban || "")];
      const jwbArr    = Array.isArray(jawaban)
        ? jawaban.map(String)
        : [String(jawaban || "")];

      let isBenar = false;
      if ((soalDb.tipeSoal || "PG") === "PG_KOMPLEKS") {
        const a = [...jwbArr].sort().join(",").toLowerCase().trim();
        const b = [...kunciArr].sort().join(",").toLowerCase().trim();
        isBenar = a === b && a !== "";
      } else {
        isBenar =
          String(jwbArr[0]).trim().toLowerCase() ===
          String(kunciArr[0]).trim().toLowerCase();
      }

      if (isBenar) { expDidapat += bobot; totalBenar++; }
      else          { totalSalah++; }

      arrayJawaban.push({ nomorSoal: index + 1, jawabanSiswa: jwbArr, isBenar });
    });

    const nilai = totalExpMaksimal > 0
      ? Math.round((expDidapat / totalExpMaksimal) * 100)
      : 0;
    const namaAman = validationHelper.trimInput(nama);

    await Promise.all([
      HasilKuis.create(
        [{
          quizId:         dataKuis._id,
          jadwalId:       new mongoose.Types.ObjectId(jadwalId),
          siswaId:        new mongoose.Types.ObjectId(siswaId),
          namaSiswa:      namaAman,
          jawaban:        arrayJawaban,
          totalBenar,
          totalSalah,
          nilai,
          totalExpDidapat: expDidapat,
          waktuSelesai:   new Date(),
        }],
        { session }
      ),
      StudySession.updateOne(
        {
          siswaId:  new mongoose.Types.ObjectId(siswaId),
          jadwalId: new mongoose.Types.ObjectId(jadwalId),
        },
        { $set: { nilaiTest: nilai } },
        { session }
      ),
    ]);

    await session.commitTransaction();
    session.endSession();

    return responseHelper.success("Ujian berhasil dikumpulkan!", {
      skor: nilai,
      exp:  expDidapat,
    });
  } catch (error) {
    if (session) { await session.abortTransaction(); session.endSession(); }
    console.error("[CRITICAL ERROR kumpulkanUjianSiswa]:", error);
    return responseHelper.error("Sistem sibuk. Gagal memproses nilai kuis, silakan coba lagi.");
  }
};

// ============================================================================
// 3. CEK KETERSEDIAAN KUIS
// ============================================================================
export const cekKetersediaanKuis = async (jadwalId, siswaId) => {
  try {
    await connectToDatabase();
    const sesi = await ambilSesiAktif();
    if (!sesi) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const [kuis, riwayat] = await Promise.all([
      Quiz.findOne({ jadwalId, isAktif: true }).select("_id durasiMenit soal").lean(),
      HasilKuis.findOne({ jadwalId, siswaId }).select("nilai").lean(),
    ]);

    if (!kuis?.soal) return responseHelper.success("Tidak ada kuis", { ada: false });

    return responseHelper.success("Kuis tersedia", {
      ada:               true,
      _id:               kuis._id.toString(),
      jumlahSoal:        kuis.soal.length,
      durasi:            kuis.durasiMenit || 10,
      isSudahDikerjakan: !!riwayat,
      skor:              riwayat ? riwayat.nilai : null,
    });
  } catch (error) {
    console.error("[ERROR cekKetersediaanKuis]:", error);
    return responseHelper.error("Gagal memeriksa ketersediaan kuis.", null, "DB_ERROR");
  }
};

// ============================================================================
// 4. AMBIL PEMBAHASAN (Mode Review)
// ============================================================================
export const getPembahasanKuis = async (jadwalId, siswaId) => {
  try {
    await connectToDatabase();
    const sesi = await ambilSesiAktif();
    if (!sesi) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const [dataKuis, riwayatHasil] = await Promise.all([
      Quiz.findOne({ jadwalId }).select("soal").lean(),
      HasilKuis.findOne({ jadwalId, siswaId }).select("jawaban").lean(),
    ]);

    if (!riwayatHasil?.jawaban) {
      return responseHelper.error("Akses ditolak. Riwayat pengerjaan tidak ditemukan.");
    }
    if (!dataKuis?.soal) {
      return responseHelper.error("Soal asli telah dihapus oleh pengajar.");
    }

    const jawabanSiswaEkstrak = riwayatHasil.jawaban.map((d) =>
      d.jawabanSiswa.length > 1 ? d.jawabanSiswa : (d.jawabanSiswa[0] || "")
    );

    return responseHelper.success("Pembahasan dimuat", serialize({
      soal:          dataKuis.soal,
      jawabanSiswa:  jawabanSiswaEkstrak,
    }));
  } catch (error) {
    console.error("[ERROR getPembahasanKuis]:", error);
    return responseHelper.error("Terjadi kesalahan server saat mengambil pembahasan.");
  }
};

// ============================================================================
// 5. RIWAYAT KUIS SISWA
// ============================================================================
export const getRiwayatKuisSiswa = async (siswaId) => {
  try {
    await connectToDatabase();
    const sesi = await ambilSesiAktif();
    if (!sesi) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);

    const riwayat = await HasilKuis.find({ siswaId })
      .populate("jadwalId", "mapel bab tanggal")
      .populate("quizId", "soal")
      .sort({ createdAt: -1 })
      .lean();

    const dataFinal = riwayat.map((r) => ({
      _id:       r._id.toString(),
      jadwalId:  r.jadwalId ? r.jadwalId._id.toString() : "-",
      mapel:     r.jadwalId?.mapel  || "Kuis CBT",
      bab:       r.jadwalId?.bab    || "Ujian",
      tanggal:   r.jadwalId?.tanggal || r.createdAt,
      skor:      r.nilai || 0,
      jumlahSoal: r.quizId?.soal?.length || r.jawaban?.length || 0,
    }));

    return responseHelper.success("Riwayat dimuat", serialize(dataFinal));
  } catch (error) {
    console.error("[ERROR getRiwayatKuisSiswa]:", error);
    return responseHelper.error("Gagal memuat riwayat kuis.");
  }
};