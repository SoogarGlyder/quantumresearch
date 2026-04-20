"use server";

import connectDB from "../lib/db"; 
import Jadwal from "../models/Jadwal"; 
import Quiz from "../models/Quiz";
import StudySession from "../models/StudySession"; // 🚀 IMPORT MODEL JURNAL
import mongoose from "mongoose";

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// FUNGSI: MENGAMBIL DATA KUIS (ANTI-CHEAT + PARALLEL)
// ============================================================================
export const getKuisSiswa = async (jadwalId) => {
  try {
    await connectDB();

    // 🚀 OPTIMASI: Ambil Jadwal dan Quiz secara PARALEL
    const [jadwalData, dataKuis] = await Promise.all([
      Jadwal.findById(jadwalId).select('mapel kelasTarget').lean(),
      Quiz.findOne({ jadwalId, isAktif: true }).select('-soal.kunciJawaban').lean()
    ]);

    if (!dataKuis || !dataKuis.soal || dataKuis.soal.length === 0) {
      return { sukses: false, pesan: "Soal ujian belum tersedia." };
    }

    return { 
      sukses: true, 
      data: {
        mapel: jadwalData?.mapel || "Kuis CBT",
        kelas: jadwalData?.kelasTarget || "-",
        jumlahSoal: dataKuis.soal.length,
        soal: dataKuis.soal
      } 
    };

  } catch (error) {
    return { sukses: false, pesan: "Terjadi kesalahan server." };
  }
};

// ============================================================================
// FUNGSI: KIRIM JAWABAN & AUTO-SYNC JURNAL (ATOMIC $PUSH OPTIMIZED)
// ============================================================================
export const kumpulkanUjianSiswa = async ({ jadwalId, siswaId, nama, jawabanSiswa }) => {
  try {
    await connectDB();

    // 🚀 OPTIMASI: Cukup ambil data soal untuk grading
    const dataKuis = await Quiz.findOne({ jadwalId }).select("soal hasilPengerjaan.siswaId").lean();
    if (!dataKuis) return { sukses: false, pesan: "Data Kuis tidak ditemukan." };

    // Cek duplikat di RAM (Data sudah diproject di atas)
    const sudahPernah = dataKuis.hasilPengerjaan.some(h => h.siswaId.toString() === siswaId.toString());
    if (sudahPernah) return { sukses: false, pesan: "Anda sudah mengerjakan kuis ini." };

    const soalAsli = dataKuis.soal;
    let expDidapat = 0;
    let totalExpMaksimal = 0;

    // --- LOGIKA GRADING TETAP SAMA ---
    jawabanSiswa.forEach((jawaban, index) => {
      const soalDatabase = soalAsli[index];
      if (soalDatabase) {
        const bobotSoal = Number(soalDatabase.bobotExp) || 20;
        totalExpMaksimal += bobotSoal;
        const tipe = soalDatabase.tipeSoal || "PG";
        let isBenar = false;

        if (tipe === "PG" || tipe === "BENAR_SALAH") {
          isBenar = (String(jawaban) === String(soalDatabase.kunciJawaban));
        } else if (tipe === "ISIAN") {
          const jwbSiswa = String(jawaban || "").toLowerCase().trim();
          const jwbKunci = String(soalDatabase.kunciJawaban || "").toLowerCase().trim();
          isBenar = (jwbSiswa === jwbKunci);
        } else if (tipe === "PG_KOMPLEKS") {
          const jwbArr = Array.isArray(jawaban) ? jawaban.sort() : [];
          const kunciArr = Array.isArray(soalDatabase.kunciJawaban) ? soalDatabase.kunciJawaban.sort() : [];
          isBenar = JSON.stringify(jwbArr) === JSON.stringify(kunciArr);
        }
        if (isBenar) expDidapat += bobotSoal;
      }
    });

    const skorAkhir = totalExpMaksimal > 0 ? Math.round((expDidapat / totalExpMaksimal) * 100) : 0;

    // 🚀 1. UPDATE KUIS: Atomic $push (Langsung simpan hasil ke array tanpa load seluruh kuis)
    const updateQuiz = Quiz.updateOne(
      { jadwalId },
      { 
        $push: { 
          hasilPengerjaan: {
            siswaId: new mongoose.Types.ObjectId(siswaId),
            nama,
            skor: skorAkhir,
            jawabanSiswa,
            dikumpulkanPada: new Date()
          } 
        } 
      }
    );

    // 🚀 2. AUTO-SYNC JURNAL: Memasukkan nilaiTest ke absen siswa
    const updateJurnal = StudySession.updateOne(
      { 
        siswaId: new mongoose.Types.ObjectId(siswaId), 
        jadwalId: new mongoose.Types.ObjectId(jadwalId) 
      },
      { 
        $set: { nilaiTest: skorAkhir } 
      }
    );

    // 🚀 EKSEKUSI PARALEL (Jauh lebih ngebut!)
    await Promise.all([updateQuiz, updateJurnal]);

    return { sukses: true, skor: skorAkhir, exp: expDidapat };

  } catch (error) {
    return { sukses: false, pesan: "Terjadi kesalahan proses nilai." };
  }
};

// ============================================================================
// FUNGSI: CEK KETERSEDIAAN (DIET DATA)
// ============================================================================
export const cekKetersediaanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    // 🚀 OPTIMASI: Projection (Jangan tarik isi soal, cukup jumlahnya saja)
    const kuis = await Quiz.findOne({ jadwalId, isAktif: true })
      .select("durasi hasilPengerjaan soal")
      .lean();
    
    if (!kuis || !kuis.soal) return { ada: false };

    const riwayatPengerjaan = kuis.hasilPengerjaan?.find(
      (hasil) => hasil.siswaId.toString() === siswaId.toString()
    );

    return {
      ada: true,
      data: {
        _id: kuis._id.toString(),
        jumlahSoal: kuis.soal.length, // Ukuran array soal
        durasi: kuis.durasi || 10,
        isSudahDikerjakan: !!riwayatPengerjaan, 
        skor: riwayatPengerjaan ? riwayatPengerjaan.skor : null,
      }
    };
  } catch (error) {
    return { ada: false };
  }
};

export const getPembahasanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    const dataKuis = await Quiz.findOne({ jadwalId }).select("soal hasilPengerjaan").lean();
    if (!dataKuis) return { sukses: false, pesan: "Data Kuis tidak ditemukan." };

    const riwayat = dataKuis.hasilPengerjaan?.find(h => h.siswaId.toString() === siswaId.toString());
    if (!riwayat) return { sukses: false, pesan: "Akses ditolak." };

    return { sukses: true, data: { soal: dataKuis.soal, jawabanSiswa: riwayat.jawabanSiswa } };
  } catch (error) {
    return { sukses: false, pesan: "Terjadi kesalahan server." };
  }
};

// ============================================================================
// FUNGSI: RIWAYAT KUIS (N+1 EXTERMINATOR - 1 QUERY SAJA!)
// ============================================================================
export const getRiwayatKuisSiswa = async (siswaId) => {
  try {
    await connectDB();
    const oid = new mongoose.Types.ObjectId(siswaId);

    // 🚀 OPTIMASI TOTAL: Gunakan Aggregation Pipeline (Menyatukan Quiz & Jadwal)
    const riwayat = await Quiz.aggregate([
      { $match: { "hasilPengerjaan.siswaId": oid } }, // Cari kuis yang pernah dikerjakan siswa
      {
        $lookup: { // JOIN dengan tabel Jadwals
          from: "jadwals", 
          localField: "jadwalId",
          foreignField: "_id",
          as: "infoJadwal"
        }
      },
      { $unwind: "$infoJadwal" }, // Pecah array hasil join
      {
        $project: { // Pilih field yang dibutuhkan saja
          _id: 1,
          jadwalId: 1,
          mapel: "$infoJadwal.mapel",
          bab: "$infoJadwal.bab",
          tanggal: "$infoJadwal.tanggal",
          jumlahSoal: { $size: "$soal" },
          // Ekstrak skor milik siswa tersebut dari array hasilPengerjaan
          hasil: {
            $filter: {
              input: "$hasilPengerjaan",
              as: "h",
              cond: { $eq: ["$$h.siswaId", oid] }
            }
          }
        }
      },
      { $sort: { tanggal: -1 } }
    ]);

    const dataFinal = riwayat.map(r => ({
      _id: r._id.toString(),
      jadwalId: r.jadwalId.toString(),
      mapel: r.mapel || "Kuis CBT",
      bab: r.bab || "Ujian",
      tanggal: r.tanggal || new Date(),
      skor: r.hasil[0] ? r.hasil[0].skor : 0,
      jumlahSoal: r.jumlahSoal
    }));

    return { sukses: true, data: dataFinal };
  } catch (error) {
    console.error("Error getRiwayatKuisSiswa:", error);
    return { sukses: false, data: [] };
  }
};