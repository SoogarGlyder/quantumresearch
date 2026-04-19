"use client";

import { useMemo } from "react";
import { TIPE_SESI, STATUS_SESI, EVENT_PENTING, GAMIFIKASI } from "@/utils/constants";

// --- HELPER INTERNAL HOOK ---
const formatYYYYMMDD_lama = (dateData) => {
  if (!dateData) return "";
  const d = new Date(dateData);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatBulanTahun_lama = (dateData) => {
  if (!dateData) return "";
  const d = new Date(dateData);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function useStudentStats(riwayat, jadwal, siswa) {

  // 1. HITUNG STREAK KONSUL
  const streakKonsul = useMemo(() => {
    if (!riwayat || riwayat.length === 0) return 0;
    
    const daftarLibur = EVENT_PENTING.TANGGAL_LIBUR || [];
    const tanggalUnikKonsul = new Set(
      riwayat
        .filter(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuMulai)
        .map(r => formatYYYYMMDD_lama(r.waktuMulai))
    );
    
    const hariIni = new Date();
    let tanggalCek = new Date(hariIni);
    let totalStreak = 0;
    
    // Cari titik awal (kapan terakhir konsul)
    while (true) {
      const tglStr = formatYYYYMMDD_lama(tanggalCek);
      if (tanggalUnikKonsul.has(tglStr)) break; 
      
      // Lewati hari minggu atau libur
      if (tanggalCek.getDay() === 0 || daftarLibur.includes(tglStr)) { 
        tanggalCek.setDate(tanggalCek.getDate() - 1); 
        continue; 
      }
      
      tanggalCek.setDate(tanggalCek.getDate() - 1);
      const tglKemarinStr = formatYYYYMMDD_lama(tanggalCek);
      
      // Jika kemarinnya bukan libur dan tidak konsul, berarti streak putus/0
      if (!tanggalUnikKonsul.has(tglKemarinStr) && tanggalCek.getDay() !== 0 && !daftarLibur.includes(tglKemarinStr)) {
        return 0;
      }
      break;
    }
    
    // Hitung ke belakang
    while (true) {
      const tglStr = formatYYYYMMDD_lama(tanggalCek);
      if (tanggalUnikKonsul.has(tglStr)) { 
        totalStreak++; 
        tanggalCek.setDate(tanggalCek.getDate() - 1); 
      }
      else if (tanggalCek.getDay() === 0 || daftarLibur.includes(tglStr)) { 
        tanggalCek.setDate(tanggalCek.getDate() - 1); 
      }
      else { break; }
    }
    return totalStreak;
  }, [riwayat]);


  // 2. HITUNG STATISTIK BULAN INI
  const statsBulanIni = useMemo(() => {
    const sekarang = new Date();
    const bulanIniStr = formatBulanTahun_lama(sekarang);
    const tglSekarangString = formatYYYYMMDD_lama(sekarang);
    
    const riwayatBulanIni = riwayat?.filter(r => formatBulanTahun_lama(r.waktuMulai) === bulanIniStr) || [];
    
    let totalMenitKonsul = 0;
    let mapelCount = {};
    let kelasHadir = 0;

    riwayatBulanIni.forEach(r => {
      // Data Konsul
      if (r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuSelesai) {
        totalMenitKonsul += Math.floor((new Date(r.waktuSelesai) - new Date(r.waktuMulai)) / 60000);
        mapelCount[r.namaMapel || "Umum"] = (mapelCount[r.namaMapel || "Umum"] || 0) + 1;
      }
      // Data Kelas
      if (r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.SELESAI.id) {
        kelasHadir++;
        totalMenitKonsul += (r.konsulExtraMenit || 0); 
      }
    });

    const jadwalWajibBulanIni = jadwal?.filter(j => 
      formatBulanTahun_lama(j.tanggal) === bulanIniStr && 
      formatYYYYMMDD_lama(j.tanggal) <= tglSekarangString && 
      j.kelasTarget === siswa.kelas
    ).length || 0;

    const persenHadir = jadwalWajibBulanIni > 0 ? Math.round((kelasHadir / jadwalWajibBulanIni) * 100) : 100;
    const jamKonsul = Math.floor(totalMenitKonsul / 60);
    const menitSisa = totalMenitKonsul % 60;
    
    const mapelTerambis = Object.keys(mapelCount).length > 0 
      ? Object.keys(mapelCount).reduce((a, b) => mapelCount[a] > mapelCount[b] ? a : b) 
      : "-";
      
    const gelarMatch = GAMIFIKASI.GELAR_KLASEMEN.find(g => jamKonsul >= g.minJam);
    
    return { 
      jamKonsul, 
      menitSisa, 
      persenHadir, 
      kelasHadir, 
      jadwalWajibBulanIni, 
      mapelTerambis, 
      gelar: gelarMatch ? gelarMatch.gelar : "🐢 Masih Pemanasan", 
      selisihHariUTBK: Math.max(0, Math.ceil((new Date(EVENT_PENTING.TANGGAL_UTBK) - sekarang) / 86400000)) 
    };
  }, [riwayat, jadwal, siswa.kelas]);

  // 3. TARGET MISI BULANAN
  const targetKonsul = statsBulanIni.jamKonsul >= 30 ? 50 : statsBulanIni.jamKonsul >= 20 ? 30 : statsBulanIni.jamKonsul >= 10 ? 20 : statsBulanIni.jamKonsul >= 5 ? 10 : 5;
  const persenMisiKonsul = (Math.min(statsBulanIni.jamKonsul, targetKonsul) / targetKonsul) * 100;
  
  const targetStreak = streakKonsul >= 14 ? 30 : streakKonsul >= 7 ? 14 : streakKonsul >= 3 ? 7 : 3;
  const persenMisiStreak = (Math.min(streakKonsul, targetStreak) / targetStreak) * 100;

  return {
    streakKonsul,
    statsBulanIni,
    misiBulanan: {
      targetKonsul,
      persenMisiKonsul,
      targetStreak,
      persenMisiStreak
    }
  };
}