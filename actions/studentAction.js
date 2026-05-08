"use server";

import connectDB from "../lib/db"; 
import Jadwal from "../models/Jadwal"; 
import Quiz from "../models/Quiz";
import StudySession from "../models/StudySession"; 
import HasilKuis from "../models/HasilKuis"; 
import mongoose from "mongoose";

// Alat pencuci data agar aman dikirim ke Client Component (Mencegah error "Only plain objects")
const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 1. AMBIL DATA KUIS (ANTI-CHEAT + PARALLEL)
// ============================================================================
export const getKuisSiswa = async (jadwalId) => {
  try {
    await connectDB();

    // OPTIMASI: Ambil Jadwal dan Quiz secara PARALEL
    const [jadwalData, dataKuis] = await Promise.all([
      Jadwal.findById(jadwalId).select('mapel kelasTarget').lean(),
      Quiz.findOne({ jadwalId, isAktif: true }).select('-soal.kunciJawaban -soal.pembahasan').lean() // Rahasiakan kunci dan pembahasan!
    ]);

    if (!dataKuis || !dataKuis.soal || dataKuis.soal.length === 0) {
      return { sukses: false, pesan: "Soal ujian belum tersedia." };
    }

    return serialize({ 
      sukses: true, 
      data: {
        mapel: jadwalData?.mapel || "Kuis CBT",
        kelas: jadwalData?.kelasTarget || "-",
        jumlahSoal: dataKuis.soal.length,
        soal: dataKuis.soal
      } 
    });

  } catch (error) {
    return { sukses: false, pesan: "Terjadi kesalahan server." };
  }
};

// ============================================================================
// 2. KUMPULKAN UJIAN (GRADING & AUTO-SYNC JURNAL) - MENGGUNAKAN TABEL HASILKUIS
// ============================================================================
export const kumpulkanUjianSiswa = async ({ jadwalId, siswaId, nama, jawabanSiswa }) => {
  try {
    await connectDB();

    // Proteksi: Cek di tabel HasilKuis apakah siswa sudah pernah mengerjakan
    const sudahPernah = await HasilKuis.exists({ jadwalId, siswaId });
    if (sudahPernah) return { sukses: false, pesan: "Anda sudah mengumpulkan kuis ini." };

    // Tarik soal untuk grading
    const dataKuis = await Quiz.findOne({ jadwalId }).select("_id soal").lean();
    if (!dataKuis) return { sukses: false, pesan: "Data Kuis tidak ditemukan." };

    const soalAsli = dataKuis.soal;
    let expDidapat = 0;
    let totalExpMaksimal = 0;
    const detailJawabanData = []; 

    // PROSES GRADING
    jawabanSiswa.forEach((jawaban, index) => {
      const soalDb = soalAsli[index];
      if (soalDb) {
        const bobot = Number(soalDb.bobotExp) || 20;
        totalExpMaksimal += bobot;
        
        // Normalisasi: Pastikan semua array string (Sesuai model Anda)
        const kunciDbArr = Array.isArray(soalDb.kunciJawaban) ? soalDb.kunciJawaban.map(String) : [String(soalDb.kunciJawaban || "")];
        const jwbSiswaArr = Array.isArray(jawaban) ? jawaban.map(String) : [String(jawaban || "")];

        let isBenar = false;
        const tipe = soalDb.tipeSoal || "PG";

        // Logika Pemeriksaan (Termasuk PG Kompleks)
        if (tipe === "PG_KOMPLEKS") {
          const a = [...jwbSiswaArr].sort().join(",").toLowerCase().trim();
          const b = [...kunciDbArr].sort().join(",").toLowerCase().trim();
          isBenar = (a === b) && (a !== ""); // Tidak boleh kosong
        } else {
          isBenar = String(jwbSiswaArr[0]).trim().toLowerCase() === String(kunciDbArr[0]).trim().toLowerCase();
        }
        
        if (isBenar) expDidapat += bobot;

        // Simpan detail untuk fitur "Review Merah/Hijau"
        detailJawabanData.push({ 
          kunciJawaban: kunciDbArr, 
          jawabanSiswa: jwbSiswaArr, 
          isBenar 
        });
      }
    });

    // Hitung Skor (Skala 100)
    const skorAkhir = totalExpMaksimal > 0 ? Math.round((expDidapat / totalExpMaksimal) * 100) : 0;

    // SIMPAN KE DATABASE (Tabel HasilKuis & StudySession secara PARALEL)
    await Promise.all([
      HasilKuis.create({
        jadwalId: new mongoose.Types.ObjectId(jadwalId),
        quizId: dataKuis._id,
        siswaId: new mongoose.Types.ObjectId(siswaId),
        namaSiswa: nama,
        skorAkhir,
        detailJawaban: detailJawabanData
      }),
      StudySession.updateOne(
        { siswaId: new mongoose.Types.ObjectId(siswaId), jadwalId: new mongoose.Types.ObjectId(jadwalId) },
        { $set: { nilaiTest: skorAkhir } }
      )
    ]);

    return { sukses: true, skor: skorAkhir, exp: expDidapat };

  } catch (error) {
    console.error("ERROR GRADING:", error);
    return { sukses: false, pesan: "Gagal memproses nilai kuis." };
  }
};

// ============================================================================
// 3. CEK KETERSEDIAAN KUIS (DIET DATA)
// ============================================================================
export const cekKetersediaanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    
    // Cari Kuis dan Hasilnya secara paralel
    const [kuis, riwayat] = await Promise.all([
      Quiz.findOne({ jadwalId, isAktif: true }).select("_id durasi soal").lean(),
      HasilKuis.findOne({ jadwalId, siswaId }).select("skorAkhir").lean()
    ]);
    
    if (!kuis || !kuis.soal) return { ada: false };

    return {
      ada: true,
      data: {
        _id: kuis._id.toString(),
        jumlahSoal: kuis.soal.length, 
        durasi: kuis.durasi || 10,
        isSudahDikerjakan: !!riwayat, // Jika ada data di HasilKuis, berarti sudah dikerjakan
        skor: riwayat ? riwayat.skorAkhir : null,
      }
    };
  } catch (error) {
    return { ada: false };
  }
};

// ============================================================================
// 4. AMBIL PEMBAHASAN (Untuk Mode Review)
// ============================================================================
export const getPembahasanKuis = async (jadwalId, siswaId) => {
  try {
    await connectDB();
    
    // Ambil Soal dan Jawaban Siswa dari tabel yang terpisah
    const [dataKuis, riwayatHasil] = await Promise.all([
       Quiz.findOne({ jadwalId }).select("soal").lean(),
       HasilKuis.findOne({ jadwalId, siswaId }).select("detailJawaban").lean()
    ]);

    if (!riwayatHasil || !riwayatHasil.detailJawaban) {
      return { sukses: false, pesan: "Akses ditolak. Riwayat pengerjaan tidak ditemukan." };
    }
    
    if (!dataKuis || !dataKuis.soal) {
      return { sukses: false, pesan: "Soal asli telah dihapus oleh pengajar." };
    }

    // Ubah format detailJawaban menjadi format array flat (Sesuai kebutuhan Engine UI)
    const jawabanSiswaEkstrak = riwayatHasil.detailJawaban.map(d => {
      // Jika array isinya lebih dari 1 (PG Kompleks), kirim utuh. Jika cuma 1 (PG Biasa), kirim stringnya.
      if (d.jawabanSiswa.length > 1) return d.jawabanSiswa; 
      return d.jawabanSiswa[0] || ""; 
    });

    return serialize({ 
      sukses: true, 
      data: { 
        soal: dataKuis.soal, 
        jawabanSiswa: jawabanSiswaEkstrak 
      } 
    });
  } catch (error) {
    return { sukses: false, pesan: "Terjadi kesalahan server saat mengambil pembahasan." };
  }
};

// ============================================================================
// 5. RIWAYAT KUIS (N+1 EXTERMINATOR VERSI BARU!)
// ============================================================================
export const getRiwayatKuisSiswa = async (siswaId) => {
  try {
    await connectDB();
    
    // Tarik data riwayat langsung dari HasilKuis, sambil nge-JOIN info Jadwal dan total soal di Quiz
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

    return serialize({ sukses: true, data: dataFinal });
  } catch (error) {
    console.error("Error getRiwayatKuisSiswa:", error);
    return { sukses: false, data: [] };
  }
};