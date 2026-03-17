"use server";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import connectToDatabase from "../lib/db";
import StudySession from "../models/StudySession";

// Konstanta
import { STATUS_SESI, TIPE_SESI } from "../utils/constants";

// ============================================================================
// 2. INTERNAL HELPERS (Logika Format & Gamifikasi)
// ============================================================================
function samarkanNama(namaLengkap) {
  if (!namaLengkap) return "Anonim";
  
  const bagianNama = namaLengkap.trim().split(" ");
  let namaSamaran = bagianNama[0]; // Ambil nama depan utuh
  
  // Jika ada nama belakang, ambil huruf pertamanya lalu beri bintang
  if (bagianNama.length > 1) {
    namaSamaran += ` ${bagianNama[1].charAt(0)}***`; 
  }
  return namaSamaran;
}

function tentukanGelar(jamKonsul) {
  if (jamKonsul >= 30) return "👑 Yang Punya Quantum";
  if (jamKonsul >= 20) return "🔥 Sepuh Quantum";
  if (jamKonsul >= 10) return "⚔️ Pejuang Ambis";
  if (jamKonsul >= 5)  return "🚀 Mulai Panas";
  return "🐢 Masih Pemanasan";
}

// ============================================================================
// 3. KLASEMEN ACTIONS (PIPELINE AGREGASI MONGODB)
// ============================================================================
export async function dapatkanKlasemenBulanIni() {
  try {
    await connectToDatabase();

    // ------------------------------------------------------------------------
    // ANTI-TIMEZONE BUG LOGIC: Menentukan Awal & Akhir Bulan (Kunci di WIB)
    // ------------------------------------------------------------------------
    // 1. Dapatkan waktu sekarang persis di Jakarta
    const sekarangWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const tahun = sekarangWIB.getFullYear();
    const bulanAngka = String(sekarangWIB.getMonth() + 1).padStart(2, '0');

    // 2. Kunci awal bulan ke 00:00:00 WIB (+07:00)
    const awalBulan = new Date(`${tahun}-${bulanAngka}-01T00:00:00+07:00`);
    
    // 3. Cari akhir bulan dengan mencari tanggal 1 bulan depan, lalu kurangi 1 milidetik
    let tahunDepan = tahun;
    let bulanDepan = sekarangWIB.getMonth() + 2;
    if (bulanDepan > 12) {
      bulanDepan = 1;
      tahunDepan++;
    }
    const bulanDepanStr = String(bulanDepan).padStart(2, '0');
    const awalBulanDepan = new Date(`${tahunDepan}-${bulanDepanStr}-01T00:00:00+07:00`);
    
    // Akhir bulan = Jam 23:59:59.999 di hari terakhir bulan ini
    const akhirBulan = new Date(awalBulanDepan.getTime() - 1);

    // ------------------------------------------------------------------------
    // MONGODB AGGREGATION PIPELINE
    // ------------------------------------------------------------------------
    const klasemenMentah = await StudySession.aggregate([
      // Tahap A: Saring hanya sesi Konsul yang Selesai pada bulan ini
      {
        $match: {
          jenisSesi: TIPE_SESI.KONSUL,
          status: STATUS_SESI.SELESAI,
          waktuMulai: { $gte: awalBulan, $lte: akhirBulan },
          waktuSelesai: { $exists: true }
        }
      },
      // Tahap B: Hitung durasi tiap sesi (dalam milidetik, lalu ubah ke menit)
      {
        $project: {
          siswaId: 1,
          durasiMenit: {
            $divide: [
              { $subtract: ["$waktuSelesai", "$waktuMulai"] },
              60000 
            ]
          }
        }
      },
      // Tahap C: Gabungkan (Group) total menit berdasarkan ID Siswa
      {
        $group: {
          _id: "$siswaId",
          totalMenit: { $sum: "$durasiMenit" }
        }
      },
      // Tahap D: Filter tambahan, singkirkan yang total menitnya 0 atau minus
      {
        $match: {
          totalMenit: { $gt: 0 }
        }
      },
      // Tahap E: Urutkan dari menit terbanyak (Ranking 1 di atas)
      {
        $sort: { totalMenit: -1 }
      },
      // Tahap F: Ambil hanya Top 10 (Sangat menghemat memori sebelum Lookup!)
      {
        $limit: 10
      },
      // Tahap G: Join dengan tabel Users untuk mengambil Nama siswa
      {
        $lookup: {
          from: "users", // Nama collection bawaan Mongoose (jamak & huruf kecil)
          localField: "_id",
          foreignField: "_id",
          as: "dataSiswa"
        }
      },
      // Tahap H: Buka array hasil join agar menjadi object tunggal
      {
        $unwind: "$dataSiswa"
      }
    ]);

    // ------------------------------------------------------------------------
    // FINALISASI FORMAT UNTUK FRONTEND
    // ------------------------------------------------------------------------
    const klasemenFinal = klasemenMentah.map((item, index) => {
      // Pastikan angkanya bulat dan tidak negatif
      const totalMenit = Math.max(0, Math.floor(item.totalMenit)); 
      
      const jamKonsul = Math.floor(totalMenit / 60);
      const menitSisa = totalMenit % 60;

      return {
        peringkat: index + 1,
        idSiswa: item._id.toString(),
        namaTampil: samarkanNama(item.dataSiswa?.nama),
        jam: jamKonsul,
        menit: menitSisa,
        gelar: tentukanGelar(jamKonsul),
      };
    });

    return { sukses: true, data: klasemenFinal };

  } catch (error) {
    console.error("[ERROR dapatkanKlasemenBulanIni]:", error.message);
    return { sukses: false, pesan: "Gagal memuat papan klasemen.", data: [] };
  }
}