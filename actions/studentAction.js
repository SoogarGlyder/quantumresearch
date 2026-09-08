"use server";

import connectDB from "../lib/db"; 
import Jadwal from "../models/Jadwal"; 
import Quiz from "../models/Quiz";
import StudySession from "../models/StudySession"; 
import HasilKuis from "../models/HasilKuis"; 
import BankSoal from "../models/BankSoal"; 
import mongoose from "mongoose";

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 1. AMBIL DATA KUIS SISWA (ROBUST FIND & SAFE SUBTEST MAPPING)
// ============================================================================
export const getKuisSiswa = async (jadwalId) => {
  try {
    await connectDB();

    const [jadwalData, dataKuis] = await Promise.all([
      Jadwal.findById(jadwalId).select('mapel kelasTarget').lean(),
      Quiz.findOne({ jadwalId }).lean()
    ]);

    if (!dataKuis) {
      return { sukses: false, pesan: "Soal ujian belum tersedia di server." };
    }

    const isTryOutMode = dataKuis.jenisUjian === "TRYOUT";

    if (isTryOutMode) {
      if (!dataKuis.daftarSubtes || dataKuis.daftarSubtes.length === 0) {
        return { sukses: false, pesan: "Bundel subtes Try Out kosong." };
      }
    } else {
      if (!dataKuis.soal || dataKuis.soal.length === 0) {
        return { sukses: false, pesan: "Soal kuis kosong." };
      }
    }

    const sanitizedSubtes = (dataKuis.daftarSubtes || []).map(sub => ({
      judulSubtes: sub.judulSubtes || "Subtes",
      durasi: Number(sub.durasi) || 10,
      soal: (sub.soal || []).map(s => ({
        _id: s._id || new mongoose.Types.ObjectId(),
        tipeSoal: s.tipeSoal || "PG",
        pertanyaan: s.pertanyaan || "",
        gambar: s.gambar || "",
        opsi: s.opsi || [],
        bobotExp: Number(s.bobotExp) || 20,
        jumlahOpsi: Number(s.jumlahOpsi) || 5
      }))
    }));

    const sanitizedSoal = (dataKuis.soal || []).map(s => ({
      _id: s._id || new mongoose.Types.ObjectId(),
      tipeSoal: s.tipeSoal || "PG",
      pertanyaan: s.pertanyaan || "",
      gambar: s.gambar || "",
      opsi: s.opsi || [],
      bobotExp: Number(s.bobotExp) || 20,
      jumlahOpsi: Number(s.jumlahOpsi) || 5
    }));

    let totalSoal = 0;
    let totalDurasi = 0;
    
    if (isTryOutMode) {
      totalSoal = sanitizedSubtes.reduce((acc, sub) => acc + (sub.soal?.length || 0), 0);
      totalDurasi = sanitizedSubtes.reduce((acc, sub) => acc + (sub.durasi || 0), 0);
    } else {
      totalSoal = sanitizedSoal.length;
      totalDurasi = Number(dataKuis.durasi) || 10;
    }

    return serialize({ 
      sukses: true, 
      data: {
        mapel: jadwalData?.mapel || "Kuis CBT",
        kelas: jadwalData?.kelasTarget || "-",
        jenisUjian: dataKuis.jenisUjian || "KUIS",
        jumlahSoal: totalSoal,
        durasi: totalDurasi,
        soal: isTryOutMode ? [] : sanitizedSoal,
        daftarSubtes: isTryOutMode ? sanitizedSubtes : []
      } 
    });

  } catch (error) {
    console.error("[ERROR getKuisSiswa]:", error); 
    return { sukses: false, pesan: "Terjadi kesalahan server saat memuat soal: " + error.message };
  }
};

// ============================================================================
// 2. KUMPULKAN UJIAN (GRADING & AUTO-SYNC JURNAL) - DENGAN TRANSACTION 🔥
// ============================================================================
export const kumpulkanUjianSiswa = async ({ 
  jadwalId, siswaId, nama, jawabanSiswa, 
  isPartialSubmit = false, subtesAktifIndex = 0, judulSubtes = "" 
}) => {
  let session;
  try {
    await connectDB();
    
    session = await mongoose.startSession();
    session.startTransaction();

    let riwayatHasil = await HasilKuis.findOne({ jadwalId, siswaId }).session(session);
    
    if (riwayatHasil && riwayatHasil.statusPengerjaan === "SELESAI") {
      await session.abortTransaction();
      session.endSession();
      return { sukses: false, pesan: "Anda sudah menyelesaikan ujian ini sepenuhnya." };
    }

    const dataKuis = await Quiz.findOne({ jadwalId }).select("_id jenisUjian soal daftarSubtes").session(session).lean();
    if (!dataKuis) {
      await session.abortTransaction();
      session.endSession();
      return { sukses: false, pesan: "Data Kuis tidak ditemukan." };
    }

    const isTryOutMode = dataKuis.jenisUjian === "TRYOUT";
    const soalAsli = isTryOutMode ? (dataKuis.daftarSubtes[subtesAktifIndex]?.soal || []) : dataKuis.soal;
    
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

    const skorSaatIni = totalExpMaksimal > 0 ? Math.round((expDidapat / totalExpMaksimal) * 100) : 0;

    if (isTryOutMode) {
      const dataSubtes = {
        judulSubtes: judulSubtes || `Subtes ${subtesAktifIndex + 1}`,
        skorSubtes: skorSaatIni,
        detailJawaban: detailJawabanData
      };

      if (riwayatHasil) {
        if (riwayatHasil.riwayatSubtes.length > subtesAktifIndex) {
          riwayatHasil.riwayatSubtes[subtesAktifIndex] = dataSubtes;
        } else {
          riwayatHasil.riwayatSubtes.push(dataSubtes);
        }
        
        riwayatHasil.subtesAktifIndex = isPartialSubmit ? subtesAktifIndex + 1 : subtesAktifIndex;
        
        if (!isPartialSubmit) {
          riwayatHasil.statusPengerjaan = "SELESAI";
          const totalSkorTryout = riwayatHasil.riwayatSubtes.reduce((acc, curr) => acc + curr.skorSubtes, 0);
          riwayatHasil.skorAkhir = Math.round(totalSkorTryout / riwayatHasil.riwayatSubtes.length);
        }
        
        await riwayatHasil.save({ session });
      } else {
        riwayatHasil = new HasilKuis({
          jadwalId, quizId: dataKuis._id, siswaId, namaSiswa: nama,
          statusPengerjaan: isPartialSubmit ? "BERJALAN" : "SELESAI",
          subtesAktifIndex: isPartialSubmit ? subtesAktifIndex + 1 : subtesAktifIndex,
          skorAkhir: isPartialSubmit ? 0 : skorSaatIni,
          riwayatSubtes: [dataSubtes]
        });
        await riwayatHasil.save({ session });
      }

      if (!isPartialSubmit) {
        await StudySession.updateOne(
          { siswaId, jadwalId },
          { $set: { nilaiTest: riwayatHasil.skorAkhir } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
      return { sukses: true, skor: isPartialSubmit ? skorSaatIni : riwayatHasil.skorAkhir, exp: expDidapat };

    } else {
      await Promise.all([
        HasilKuis.create([{
          jadwalId, quizId: dataKuis._id, siswaId, namaSiswa: nama,
          statusPengerjaan: "SELESAI", skorAkhir: skorSaatIni,
          detailJawaban: detailJawabanData
        }], { session }),
        
        StudySession.updateOne(
          { siswaId, jadwalId }, { $set: { nilaiTest: skorSaatIni } }, { session }
        )
      ]);

      await session.commitTransaction();
      session.endSession();
      return { sukses: true, skor: skorSaatIni, exp: expDidapat };
    }

  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("[CRITICAL ERROR] Kumpul Ujian CBT:", error);
    return { sukses: false, pesan: "Sistem sibuk. Gagal memproses nilai kuis, silakan coba lagi." };
  }
};

// ============================================================================
// 3. CEK KETERSEDIAAN KUIS (KINI DILENGKAPI DATA SOAL & SUBTES) 🔥
// ============================================================================
export const cekKetersediaanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    
    const [kuis, riwayat, jadwal] = await Promise.all([
      Quiz.findOne({ jadwalId }).lean(),
      HasilKuis.findOne({ jadwalId, siswaId }).select("skorAkhir statusPengerjaan subtesAktifIndex").lean(),
      Jadwal.findById(jadwalId).select("mapel bab subBab materi").lean()
    ]);
    
    if (!kuis) return { ada: false };
    const isTryOutMode = kuis.jenisUjian === "TRYOUT";

    if (isTryOutMode && (!kuis.daftarSubtes || kuis.daftarSubtes.length === 0)) return { ada: false };
    if (!isTryOutMode && (!kuis.soal || kuis.soal.length === 0)) return { ada: false };

    const sanitizedSubtes = (kuis.daftarSubtes || []).map(sub => ({
      judulSubtes: sub.judulSubtes || "Subtes",
      durasi: Number(sub.durasi) || 10,
      soal: (sub.soal || []).map(s => ({
        _id: s._id || new mongoose.Types.ObjectId(),
        tipeSoal: s.tipeSoal || "PG",
        pertanyaan: s.pertanyaan || "",
        gambar: s.gambar || "",
        opsi: s.opsi || [],
        bobotExp: Number(s.bobotExp) || 20,
        jumlahOpsi: Number(s.jumlahOpsi) || 5
      }))
    }));

    const sanitizedSoal = (kuis.soal || []).map(s => ({
      _id: s._id || new mongoose.Types.ObjectId(),
      tipeSoal: s.tipeSoal || "PG",
      pertanyaan: s.pertanyaan || "",
      gambar: s.gambar || "",
      opsi: s.opsi || [],
      bobotExp: Number(s.bobotExp) || 20,
      jumlahOpsi: Number(s.jumlahOpsi) || 5
    }));

    let totalSoal = 0;
    let totalDurasi = 0;
    
    if (isTryOutMode) {
      totalSoal = sanitizedSubtes.reduce((acc, sub) => acc + (sub.soal?.length || 0), 0);
      totalDurasi = sanitizedSubtes.reduce((acc, sub) => acc + (sub.durasi || 0), 0);
    } else {
      totalSoal = sanitizedSoal.length;
      totalDurasi = Number(kuis.durasi) || 10;
    }

    const isSelesaiTotal = riwayat ? riwayat.statusPengerjaan === "SELESAI" : false;

    return serialize({
      ada: true,
      data: {
        _id: kuis._id.toString(),
        jadwalId: jadwalId.toString(),
        jenisUjian: kuis.jenisUjian || "KUIS",
        mapel: jadwal?.mapel || "Kuis CBT",
        bab: jadwal?.bab || "Pre-Test",
        judul: kuis.sumberBankSoalId?.judul || jadwal?.subBab || jadwal?.materi || "Pre-Test CBT",
        jumlahSoal: totalSoal,
        durasi: totalDurasi,
        soal: isTryOutMode ? [] : sanitizedSoal,
        daftarSubtes: isTryOutMode ? sanitizedSubtes : [],
        isSudahDikerjakan: isSelesaiTotal, 
        statusPengerjaan: riwayat?.statusPengerjaan || null,
        subtesAktifIndex: riwayat?.subtesAktifIndex || 0,
        skor: riwayat ? riwayat.skorAkhir : null,
      }
    });
  } catch (error) {
    console.error("Error cekKetersediaanKuis:", error);
    return { ada: false };
  }
};

// ============================================================================
// 4. AMBIL PEMBAHASAN (Untuk Mode Review)
// ============================================================================
export const getPembahasanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    
    const [dataKuis, riwayatHasil] = await Promise.all([
       Quiz.findOne({ jadwalId }).select("soal jenisUjian daftarSubtes").lean(),
       HasilKuis.findOne({ jadwalId, siswaId }).select("detailJawaban riwayatSubtes statusPengerjaan").lean()
    ]);

    if (!riwayatHasil || riwayatHasil.statusPengerjaan !== "SELESAI") {
      return { sukses: false, pesan: "Akses ditolak. Riwayat pengerjaan belum selesai atau tidak ditemukan." };
    }
    
    const isTryOutMode = dataKuis?.jenisUjian === "TRYOUT";

    if (isTryOutMode) {
      if (!dataKuis.daftarSubtes || dataKuis.daftarSubtes.length === 0) {
        return { sukses: false, pesan: "Soal asli Try Out telah dihapus." };
      }
      return serialize({ 
        sukses: true, 
        data: { 
          jenisUjian: "TRYOUT",
          daftarSubtes: dataKuis.daftarSubtes,
          riwayatSubtes: riwayatHasil.riwayatSubtes || []
        } 
      });
    } else {
      if (!dataKuis || !dataKuis.soal) {
        return { sukses: false, pesan: "Soal asli Kuis telah dihapus." };
      }
      const jawabanSiswaEkstrak = riwayatHasil.detailJawaban.map(d => {
        if (d.jawabanSiswa.length > 1) return d.jawabanSiswa; 
        return d.jawabanSiswa[0] || ""; 
      });
      return serialize({ 
        sukses: true, 
        data: { 
          jenisUjian: "KUIS",
          soal: dataKuis.soal, 
          jawabanSiswa: jawabanSiswaEkstrak 
        } 
      });
    }
  } catch (error) {
    console.error("[ERROR getPembahasanKuis]:", error);
    return { sukses: false, pesan: "Terjadi kesalahan server saat mengambil pembahasan." };
  }
};

// ============================================================================
// 5. RIWAYAT KUIS SISWA
// ============================================================================
export const getRiwayatKuisSiswa = async (siswaId) => {
  try {
    await connectDB();
    
    const riwayat = await HasilKuis.find({ siswaId, statusPengerjaan: "SELESAI" })
      .populate("jadwalId", "mapel bab subBab materi tanggal jamMulai kelasTarget")
      .populate({
        path: "quizId",
        select: "durasi jenisUjian soal daftarSubtes sumberBankSoalId",
        populate: {
          path: "sumberBankSoalId",
          select: "judul"
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!riwayat || riwayat.length === 0) return { sukses: true, data: [] };

    const formattedData = riwayat.map(r => {
      const isTryOutMode = r.quizId?.jenisUjian === "TRYOUT";
      let totalSoalTryOut = 0;
      let totalDurasiTryOut = 0;
      
      if (isTryOutMode && r.quizId?.daftarSubtes) {
        totalSoalTryOut = r.quizId.daftarSubtes.reduce((acc, curr) => acc + (curr.soal?.length || 0), 0);
        totalDurasiTryOut = r.quizId.daftarSubtes.reduce((acc, curr) => acc + (curr.durasi || 0), 0);
      }

      const totalDurasiReal = isTryOutMode ? totalDurasiTryOut : (r.quizId?.durasi || 10);
      
      return {
        _id: r._id,
        jadwalId: r.jadwalId?._id,
        jenisUjian: r.quizId?.jenisUjian || "KUIS",
        mapel: r.jadwalId?.mapel || "Kuis CBT",
        bab: r.jadwalId?.bab || "Pre-Test",
        
        judul: r.quizId?.sumberBankSoalId?.judul || r.jadwalId?.subBab || r.jadwalId?.materi || "CBT Module",
        
        tanggal: r.jadwalId?.tanggal,
        jamMulai: r.jadwalId?.jamMulai,
        kelasTarget: r.jadwalId?.kelasTarget,
        
        jumlahSoal: isTryOutMode ? totalSoalTryOut : (r.quizId?.soal?.length || r.detailJawaban?.length || 0),
        durasi: totalDurasiReal,
        
        skorAkhir: Math.round(r.skorAkhir || 0),
        waktuPengumpulan: r.updatedAt || r.createdAt
      };
    });

    return serialize({ sukses: true, data: formattedData });
  } catch (error) {
    console.error("Error getRiwayatKuisSiswa:", error);
    return { sukses: false, pesan: "Gagal memuat riwayat." };
  }
};
