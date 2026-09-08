"use server";

import connectDB from "../lib/db"; 
import Jadwal from "../models/Jadwal"; 
import Quiz from "../models/Quiz";
import StudySession from "../models/StudySession"; 
import HasilKuis from "../models/HasilKuis"; 
import BankSoal from "../models/BankSoal"; // Wajib di-import agar Mongoose mengenali model
import mongoose from "mongoose";

// Alat pencuci data agar aman dikirim ke Client Component
const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 1. AMBIL DATA KUIS (ANTI-CHEAT + PARALLEL)
// ============================================================================
export const getKuisSiswa = async (jadwalId) => {
  try {
    await connectDB();

    const [jadwalData, dataKuis] = await Promise.all([
      Jadwal.findById(jadwalId).select('mapel kelasTarget').lean(),
      // 🚀 PERBAIKAN: Sembunyikan juga kunci & pembahasan untuk mode Try Out (daftarSubtes)
      Quiz.findOne({ jadwalId, isAktif: true })
          .select('-soal.kunciJawaban -soal.pembahasan -daftarSubtes.soal.kunciJawaban -daftarSubtes.soal.pembahasan')
          .lean()
    ]);

    if (!dataKuis || (!dataKuis.soal?.length && !dataKuis.daftarSubtes?.length)) {
      return { sukses: false, pesan: "Soal ujian belum tersedia." };
    }

    const isTryOutMode = dataKuis.jenisUjian === "TRYOUT";

    return serialize({ 
      sukses: true, 
      data: {
        mapel: jadwalData?.mapel || "Kuis CBT",
        kelas: jadwalData?.kelasTarget || "-",
        jenisUjian: dataKuis.jenisUjian || "KUIS",
        // Kirim sesuai mode yang aktif
        jumlahSoal: isTryOutMode ? 0 : (dataKuis.soal?.length || 0),
        durasi: isTryOutMode ? 0 : (dataKuis.durasi || 10),
        soal: isTryOutMode ? [] : dataKuis.soal,
        daftarSubtes: isTryOutMode ? dataKuis.daftarSubtes : []
      } 
    });

  } catch (error) {
    console.error("[ERROR getKuisSiswa]:", error); 
    return { sukses: false, pesan: "Terjadi kesalahan server saat memuat soal." };
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

    // 🚀 PERBAIKAN: Tarik data HasilKuis untuk mengecek Checkpoint
    let riwayatHasil = await HasilKuis.findOne({ jadwalId, siswaId }).session(session);
    
    if (riwayatHasil && riwayatHasil.statusPengerjaan === "SELESAI") {
      await session.abortTransaction();
      session.endSession();
      return { sukses: false, pesan: "Anda sudah menyelesaikan ujian ini sepenuhnya." };
    }

    // Tarik soal untuk grading
    const dataKuis = await Quiz.findOne({ jadwalId }).select("_id jenisUjian soal daftarSubtes").session(session).lean();
    if (!dataKuis) {
      await session.abortTransaction();
      session.endSession();
      return { sukses: false, pesan: "Data Kuis tidak ditemukan." };
    }

    const isTryOutMode = dataKuis.jenisUjian === "TRYOUT";
    // Tentukan soal mana yang akan di-grading saat ini
    const soalAsli = isTryOutMode ? (dataKuis.daftarSubtes[subtesAktifIndex]?.soal || []) : dataKuis.soal;
    
    let expDidapat = 0;
    let totalExpMaksimal = 0;
    const detailJawabanData = []; 

    // PROSES GRADING
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

    // 🚀 LOGIKA PENYIMPANAN BERDASARKAN MODE UJIAN
    if (isTryOutMode) {
      const dataSubtes = {
        judulSubtes: judulSubtes || `Subtes ${subtesAktifIndex + 1}`,
        skorSubtes: skorSaatIni,
        detailJawaban: detailJawabanData
      };

      if (riwayatHasil) {
        // UPDATE (Lanjut Try Out): Idempoten, timpa index yang sama jika spam click
        if (riwayatHasil.riwayatSubtes.length > subtesAktifIndex) {
          riwayatHasil.riwayatSubtes[subtesAktifIndex] = dataSubtes;
        } else {
          riwayatHasil.riwayatSubtes.push(dataSubtes);
        }
        
        riwayatHasil.subtesAktifIndex = isPartialSubmit ? subtesAktifIndex + 1 : subtesAktifIndex;
        
        // Jika kumpul akhir, kalkulasi rata-rata skor
        if (!isPartialSubmit) {
          riwayatHasil.statusPengerjaan = "SELESAI";
          const totalSkorTryout = riwayatHasil.riwayatSubtes.reduce((acc, curr) => acc + curr.skorSubtes, 0);
          riwayatHasil.skorAkhir = Math.round(totalSkorTryout / riwayatHasil.riwayatSubtes.length);
        }
        
        await riwayatHasil.save({ session });
      } else {
        // CREATE (Pertama kali mulai Try Out)
        riwayatHasil = new HasilKuis({
          jadwalId, quizId: dataKuis._id, siswaId, namaSiswa: nama,
          statusPengerjaan: isPartialSubmit ? "BERJALAN" : "SELESAI",
          subtesAktifIndex: isPartialSubmit ? subtesAktifIndex + 1 : subtesAktifIndex,
          skorAkhir: isPartialSubmit ? 0 : skorSaatIni, // Sementara 0 jika masih parsial
          riwayatSubtes: [dataSubtes]
        });
        await riwayatHasil.save({ session });
      }

      // Update nilai di Jurnal Absensi Kelas (Hanya jika benar-benar selesai)
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
      // LOGIKA KUIS REGULER LAMA (Tetap Utuh & Aman)
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
// 3. CEK KETERSEDIAAN KUIS (DIET DATA + DEEP POPULATE JUDUL)
// ============================================================================
export const cekKetersediaanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    
    const [kuis, riwayat, jadwal] = await Promise.all([
      Quiz.findOne({ jadwalId, isAktif: true })
        .select("_id durasi soal jenisUjian daftarSubtes sumberBankSoalId")
        .populate("sumberBankSoalId", "judul")
        .lean(),
      HasilKuis.findOne({ jadwalId, siswaId }).select("skorAkhir statusPengerjaan subtesAktifIndex").lean(),
      Jadwal.findById(jadwalId).select("mapel bab subBab materi").lean()
    ]);
    
    if (!kuis) return { ada: false };
    const isTryOutMode = kuis.jenisUjian === "TRYOUT";

    // Validasi isi soal
    if (isTryOutMode && (!kuis.daftarSubtes || kuis.daftarSubtes.length === 0)) return { ada: false };
    if (!isTryOutMode && (!kuis.soal || kuis.soal.length === 0)) return { ada: false };

    // 🚀 PENGAMANAN: Cek apakah status pengerjaan sudah final
    const isSelesaiTotal = riwayat ? riwayat.statusPengerjaan === "SELESAI" : false;

    return {
      ada: true,
      data: {
        _id: kuis._id.toString(),
        jadwalId: jadwalId.toString(),
        jenisUjian: kuis.jenisUjian || "KUIS",
        
        mapel: jadwal?.mapel || "Kuis CBT",
        bab: jadwal?.bab || "Pre-Test",
        judul: kuis.sumberBankSoalId?.judul || jadwal?.subBab || jadwal?.materi || "Pre-Test CBT",
        
        jumlahSoal: isTryOutMode ? 0 : kuis.soal.length, 
        durasi: isTryOutMode ? 0 : (kuis.durasi || 10),
        
        // Mode Lanjutkan Try Out
        isSudahDikerjakan: isSelesaiTotal, 
        statusPengerjaan: riwayat?.statusPengerjaan || null,
        subtesAktifIndex: riwayat?.subtesAktifIndex || 0,
        skor: riwayat ? riwayat.skorAkhir : null,
      }
    };
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
// 5. RIWAYAT KUIS (N+1 EXTERMINATOR + DEEP POPULATE JUDUL)
// ============================================================================
export const getRiwayatKuisSiswa = async (siswaId) => {
  try {
    await connectDB();
    
    // Hanya tarik riwayat yang status pengerjaannya sudah benar-benar SELESAI
    const riwayat = await HasilKuis.find({ siswaId, statusPengerjaan: "SELESAI" })
      .populate("jadwalId", "mapel bab subBab materi tanggal")
      .populate({
        path: "quizId",
        select: "soal jenisUjian daftarSubtes sumberBankSoalId",
        populate: {
          path: "sumberBankSoalId",
          select: "judul"
        }
      })
      .sort({ dikumpulkanPada: -1 })
      .lean();

    const dataFinal = riwayat.map(r => {
      const isTryOutMode = r.quizId?.jenisUjian === "TRYOUT";
      let totalSoalTryOut = 0;
      if (isTryOutMode && r.quizId?.daftarSubtes) {
        totalSoalTryOut = r.quizId.daftarSubtes.reduce((acc, curr) => acc + (curr.soal?.length || 0), 0);
      }

      return {
        _id: r._id.toString(),
        jadwalId: r.jadwalId ? r.jadwalId._id.toString() : "-",
        mapel: isTryOutMode ? "Try Out UTBK" : (r.jadwalId?.mapel || "Kuis CBT"),
        bab: isTryOutMode ? "Simulasi" : (r.jadwalId?.bab || "Ujian"),
        judul: r.quizId?.sumberBankSoalId?.judul || r.jadwalId?.subBab || r.jadwalId?.materi || (isTryOutMode ? "Try Out Estafet" : "Latihan CBT"),
        tanggal: r.jadwalId?.tanggal || r.dikumpulkanPada,
        skor: r.skorAkhir || 0,
        jumlahSoal: isTryOutMode ? totalSoalTryOut : (r.quizId?.soal?.length || r.detailJawaban?.length || 0)
      };
    });

    return serialize({ sukses: true, data: dataFinal });
  } catch (error) {
    console.error("Error getRiwayatKuisSiswa:", error);
    return { sukses: false, data: [] };
  }
};
