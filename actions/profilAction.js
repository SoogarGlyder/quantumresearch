"use server";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Models
import User from "../models/User";
import StudySession from "../models/StudySession";

// ============================================================================
// 2. INTERNAL HELPERS (Middleware Auth & Security)
// ============================================================================
async function validasiAkses(idTarget) {
  try {
    const cookieStore = await cookies();
    // Gunakan nama cookie yang konsisten sesuai sistem Quantum Bos
    const karcis = cookieStore.get("karcis_quantum");
    
    if (!karcis || !karcis.value) return false;

    // Jika ID yang login sama dengan ID yang diakses
    if (String(karcis.value) === String(idTarget)) return true;

    // Cek apakah yang mengakses adalah Admin
    const userLokal = await User.findById(karcis.value).select("peran").lean();
    return userLokal && userLokal.peran === "admin";
  } catch (error) {
    console.error("[SECURITY validasiAkses]:", error.message);
    return false;
  }
}

// ============================================================================
// 3. STATISTIK & GAMIFIKASI (Penebusan Dosa No. 11 - Aggregation)
// ============================================================================
export async function getStatistikSiswa(idSiswa) {
  try {
    await connectToDatabase();

    const punyaAkses = await validasiAkses(idSiswa);
    if (!punyaAkses) return { sukses: false, pesan: "Akses Ditolak!" };

    const oid = new mongoose.Types.ObjectId(idSiswa);

    // --- AGGREGATION: Total Menit & Sesi per Kategori ---
    // Menghitung (waktuSelesai - waktuMulai) + konsulExtraMenit langsung di DB
    const statsKategori = await StudySession.aggregate([
      { $match: { siswaId: oid, status: "Selesai" } },
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

    // --- LOGIC: Streak Kehadiran (Server-Side) ---
    const riwayatTanggal = await StudySession.aggregate([
      { $match: { siswaId: oid } },
      { 
        $project: { 
          tgl: { $dateToString: { format: "%Y-%m-%d", date: "$waktuMulai", timezone: "Asia/Jakarta" } } 
        } 
      },
      { $group: { _id: "$tgl" } },
      { $sort: { _id: -1 } }
    ]);

    let currentStreak = 0;
    if (riwayatTanggal.length > 0) {
      const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      const tglUnik = riwayatTanggal.map(d => d._id);
      
      let indexCek = 0;
      let tglCek = new Date(hariIni);

      // Proteksi Streak: Jika hari ini belum absen, cek apakah kemarin ada absen
      if (tglUnik[0] !== hariIni) {
        tglCek.setDate(tglCek.getDate() - 1);
        const tglKemarin = tglCek.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
        if (tglUnik[0] !== tglKemarin) {
          currentStreak = 0;
        }
      }

      // Hitung runutan mundur
      if (tglUnik[0] === hariIni || tglUnik[0] === tglCek.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })) {
        for (let i = indexCek; i < tglUnik.length; i++) {
          const tglTarget = tglCek.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
          if (tglUnik[i] === tglTarget) {
            currentStreak++;
            tglCek.setDate(tglCek.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    return { 
      sukses: true, 
      data: {
        stats: statsKategori,
        streak: currentStreak
      }
    };

  } catch (error) {
    console.error("[ERROR getStatistikSiswa]:", error.message);
    return { sukses: false, pesan: "Gagal memproses statistik di server." };
  }
}

// ============================================================================
// 4. PROFILE ACTIONS
// ============================================================================
export async function updateProfilSiswa(idSiswa, usernameBaru, passwordBaru) {
  try {
    await connectToDatabase();

    const punyaAkses = await validasiAkses(idSiswa);
    if (!punyaAkses) {
      return { sukses: false, pesan: "Akses Ditolak! Anda tidak berhak mengubah profil ini." };
    }

    let updateData = {};

    if (usernameBaru && usernameBaru.trim() !== "") {
      const cleanUsername = usernameBaru.trim().toLowerCase();
      const usernameRegex = /^[a-z0-9_.-]+$/;
      if (!usernameRegex.test(cleanUsername)) {
        return { sukses: false, pesan: "Format username tidak valid." };
      }

      const cekUsername = await User.findOne({ 
        username: cleanUsername, 
        _id: { $ne: idSiswa } 
      }).select("_id").lean();

      if (cekUsername) {
        return { sukses: false, pesan: "Username sudah dipakai." };
      }
      updateData.username = cleanUsername;
    }

    if (passwordBaru && passwordBaru.trim() !== "") {
      if (passwordBaru.trim().length < 6) {
         return { sukses: false, pesan: "Password minimal 6 karakter!" };
      }
      updateData.password = await bcrypt.hash(passwordBaru.trim(), 10);
    }

    if (Object.keys(updateData).length === 0) {
       return { sukses: true, pesan: "Tidak ada data yang diubah." };
    }

    await User.findByIdAndUpdate(idSiswa, updateData);
    return { sukses: true, pesan: "Profil berhasil diperbarui!" };
    
  } catch (error) {
    console.error("[ERROR updateProfilSiswa]:", error.message);
    return { sukses: false, pesan: "Kesalahan server saat update profil." };
  }
}