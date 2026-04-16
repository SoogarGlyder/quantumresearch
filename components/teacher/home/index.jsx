"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";

import HeaderPengajar from "./HeaderPengajar";
import AgendaHariIni from "./AgendaHariIni";
import JadwalMendatang from "./JadwalMendatang"; 

import ModalJurnal from "@/components/teacher/journal/ModalJurnal"; 
import WidgetRadarCBT from "./WidgetRadarCBT";

// 🚀 HELPER: Safari-Safe Date Normalizer (Zona Waktu Jakarta)
const getNormalizeDate = (dateInput) => {
  if (!dateInput) return 0;
  
  try {
    // Tangani jika input berupa string atau object Date
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Konversi ke format string spesifik timezone Jakarta, lalu buat Date object baru darinya
    // Ini menghilangkan semua bias timezone lokal dari perangkat user/safari
    const jktString = dateObj.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const jktDate = new Date(jktString);
    
    // Reset jam, menit, detik agar kita hanya membandingkan "Hari"-nya saja
    jktDate.setHours(0, 0, 0, 0);
    return jktDate.getTime();
  } catch (error) {
    return 0; // Jika format benar-benar hancur, abaikan
  }
};

export default function TabBerandaPengajar({ dataUser, jadwal = [], absensi = [], absenAktif }) {
  // Ambil hari ini murni (jam 00:00:00 di Jakarta)
  const hariIniMurni = getNormalizeDate(new Date());
  
  // Karena Modal Jurnal butuh format YYYY-MM-DD
  const hariIniString = timeHelper.getTglJakarta(); 
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // ===================================================================
  // 🚀 PERBAIKAN BUG SAFARI: Filter menggunakan angka murni (getTime)
  // ===================================================================
  
  // 1. FILTER: Jadwal Hari Ini
  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      return tglJadwalMurni === hariIniMurni && !j.bab;
    })
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)), 
  [jadwal, hariIniMurni]);

  // 2. FILTER: Jadwal Mendatang (Besok dan seterusnya)
  const jadwalMendatang = useMemo(() => (jadwal || [])
    .filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      return tglJadwalMurni > hariIniMurni && !j.bab;
    }) 
    .sort((a, b) => {
      const tglAMurni = getNormalizeDate(a.tanggal);
      const tglBMurni = getNormalizeDate(b.tanggal);
      return tglAMurni - tglBMurni || a.jamMulai.localeCompare(b.jamMulai);
    }), 
  [jadwal, hariIniMurni]);

  // Statistik
  const statsPengajar = useMemo(() => ({ 
    totalKelas: (jadwal || []).length, 
    jurnalSelesai: (jadwal || []).filter(j => j?.bab).length,
    totalAbsensi: (absensi || []).length 
  }), [jadwal, absensi]);

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      
      <WidgetRadarCBT jadwalHariIni={jadwalHariIni} />
      
      {/* SECTION 1: Agenda Hari Ini */}
      <AgendaHariIni jadwalHariIni={jadwalHariIni} onPilihJadwal={setJadwalTerpilih} />
      
      {/* SECTION 2: Jadwal Mendatang */}
      <JadwalMendatang 
        jadwalMendatang={jadwalMendatang} 
        onPilihJadwal={setJadwalTerpilih} 
      />

      {/* MODAL JURNAL */}
      {jadwalTerpilih && (
        <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIniString} onClose={() => setJadwalTerpilih(null)} />
      )}
    </div>
  );
}