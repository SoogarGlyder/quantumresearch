"use server";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";

import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import User from "../models/User";

import { PREFIX_BARCODE } from "../utils/constants";

// ============================================================================
// 2. INTERNAL HELPERS (Keamanan & Zona Waktu)
// ============================================================================
async function dapatkanSiswaLogin() {
  const cookieStore = await cookies();
  const idSiswa = cookieStore.get("karcis_quantum")?.value;
  
  if (!idSiswa) return null;
  return await User.findById(idSiswa).lean();
}

function dapatkanTanggalJakarta(tanggalObj) {
  return tanggalObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

function buatWaktuWIB(tanggalStr, jamStr) {
  return new Date(`${tanggalStr}T${jamStr}:00+07:00`);
}


export async function prosesHasilScan(teksQR, mapelPilihan) {
  try {
    await connectToDatabase();
    
    // ------------------------------------------------------------------------
    // FASE A: VALIDASI IDENTITAS & FORMAT QR
    // ------------------------------------------------------------------------
    const siswa = await dapatkanSiswaLogin();
    if (!siswa) return { sukses: false, pesan: "Sesi habis, silakan login ulang." };

    const sekarang = new Date();
    const tanggalHariIni = dapatkanTanggalJakarta(sekarang);

    let jenisQR = "Tidak Valid";
    if (teksQR.startsWith(PREFIX_BARCODE.KELAS)) jenisQR = "Kelas";
    else if (teksQR === PREFIX_BARCODE.KONSUL) jenisQR = "Konsul";

    if (jenisQR === "Tidak Valid") {
      return { sukses: false, pesan: "⚠️ QR Code tidak dikenali oleh sistem." };
    }

    // ------------------------------------------------------------------------
    // FASE B: PENANGANAN SESI LAMA (FITUR SCAN OUT / PULANG)
    // ------------------------------------------------------------------------
    let sesiAktif = await StudySession.findOne({ 
      siswaId: siswa._id, 
      status: "Berjalan" 
    });
    
    let pesanTambahan = ""; 

    if (sesiAktif) {
      const tglSesiLama = dapatkanTanggalJakarta(sesiAktif.waktuMulai);
      if (tglSesiLama !== tanggalHariIni) {
        sesiAktif.status = "Selesai (Lupa Scan Out)";
        sesiAktif.waktuSelesai = sesiAktif.waktuMulai;
        await sesiAktif.save();
        sesiAktif = null; 
      }
    }

    if (sesiAktif) {
      const selisihMenit = Math.floor((sekarang - sesiAktif.waktuMulai) / 60000);

      if (sesiAktif.jenisSesi === "Kelas") {
        
        if (selisihMenit < 15) {
          return { sukses: false, pesan: `⚠️ Baru masuk kelas! Tunggu ${15 - selisihMenit} menit lagi untuk absen pulang.` };
        }

        let menitExtra = 0;
        const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tanggalHariIni }).lean();
        
        if (jadwal) {
          const waktuSelesaiJadwal = buatWaktuWIB(tanggalHariIni, jadwal.jamSelesai);
          
          if (sekarang > waktuSelesaiJadwal) {
            menitExtra = Math.floor((sekarang - waktuSelesaiJadwal) / 60000);
          }
        }

        sesiAktif.status = "Selesai";
        sesiAktif.waktuSelesai = sekarang;
        sesiAktif.konsulExtraMenit = Math.max(0, menitExtra);
        await sesiAktif.save();

        if (jenisQR === "Kelas" || (jenisQR === "Konsul" && (!mapelPilihan || mapelPilihan === ""))) {
          return { sukses: true, pesan: `Berhasil Pulang! ${menitExtra > 0 ? '(Extra '+menitExtra+'m)' : ''}`.trim() };
        } else {
          pesanTambahan = `Pulang Kelas ${menitExtra > 0 ? '(+'+menitExtra+'m)' : ''}. `;
        }
      } 
      
      else if (sesiAktif.jenisSesi === "Konsul") {
        if (selisihMenit < 5) {
          await StudySession.findByIdAndDelete(sesiAktif._id);
          pesanTambahan = "Konsul lama batal (<5m). ";
        } else {
          sesiAktif.status = "Selesai";
          sesiAktif.waktuSelesai = sekarang;
          await sesiAktif.save();
          pesanTambahan = "Konsul selesai. ";
        }

        if (jenisQR === "Konsul" && (!mapelPilihan || mapelPilihan === "")) {
          return { 
            sukses: true, 
            pesan: (selisihMenit < 5 ? "Sesi Konsul dibatalkan." : "Sesi Konsul Selesai!") 
          };
        }
      }
    }

    // ------------------------------------------------------------------------
    // FASE C: PEMBUATAN SESI BARU (FITUR SCAN IN / MASUK)
    // ------------------------------------------------------------------------

    if (jenisQR === "Kelas") {
      const jadwal = await Jadwal.findOne({ kelasTarget: siswa.kelas, tanggal: tanggalHariIni }).lean();

      if (!jadwal) {
        return { sukses: false, pesan: "Maaf, tidak ada jadwal kelas untukmu hari ini." };
      }

      const barcodeHarusnya = `${PREFIX_BARCODE.KELAS}${jadwal.mapel.toUpperCase()}`;
      if (teksQR !== barcodeHarusnya) {
        return { sukses: false, pesan: `Salah Ruangan! Ini barcode untuk mapel ${jadwal.mapel}.` };
      }

      const waktuMulaiJadwal = buatWaktuWIB(tanggalHariIni, jadwal.jamMulai);
      const waktuSelesaiJadwal = buatWaktuWIB(tanggalHariIni, jadwal.jamSelesai);

      const batasAwalScan = new Date(waktuMulaiJadwal.getTime() - 30 * 60000);
      
      if (sekarang < batasAwalScan) {
        return { sukses: false, pesan: "Terlalu pagi! Absen kelas dibuka 30 menit sebelum dimulai." };
      }
      if (sekarang > waktuSelesaiJadwal) {
        return { sukses: false, pesan: "Gagal absen! Kelas hari ini sudah berakhir." };
      }

      let telat = 0;
      if (sekarang > waktuMulaiJadwal) {
        telat = Math.floor((sekarang - waktuMulaiJadwal) / 60000);
      }

      await StudySession.create({
        siswaId: siswa._id,
        jenisSesi: "Kelas",
        namaMapel: jadwal.mapel,
        terlambatMenit: telat,
        status: "Berjalan"
      });

      return { 
        sukses: true, 
        pesan: `${pesanTambahan}Selamat Belajar! ${telat > 0 ? '(Telat '+telat+'m)' : ''}`.trim() 
      };
    }

    if (jenisQR === "Konsul") {
      if (!mapelPilihan || mapelPilihan.trim() === "") {
        return { sukses: false, pesan: "Oops! Silakan pilih Mata Pelajaran terlebih dahulu." };
      }

      await StudySession.create({
        siswaId: siswa._id,
        jenisSesi: "Konsul",
        namaMapel: mapelPilihan.trim(),
        status: "Berjalan"
      });
      
      return { 
        sukses: true, 
        pesan: `${pesanTambahan}Mulai Konsul ${mapelPilihan.trim()}!`.trim() 
      };
    }

  } catch (error) {
    console.error("[ERROR prosesHasilScan]:", error.message);
    return { sukses: false, pesan: "Kesalahan sistem server saat memproses scan." };
  }
}