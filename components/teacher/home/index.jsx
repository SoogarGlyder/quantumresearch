"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";

// 🚀 IMPORT KOMPONEN LOKAL (Absensi dihapus dari sini)
import HeaderPengajar from "./HeaderPengajar";
import AgendaHariIni from "./AgendaHariIni";
import JadwalMendatang from "./JadwalMendatang"; 

import ModalJurnal from "@/components/teacher/journal/ModalJurnal"; 

export default function TabBerandaPengajar({ dataUser, jadwal = [], absensi = [], absenAktif }) {
  const hariIni = timeHelper.getTglJakarta();
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // 1. FILTER: Jadwal Hari Ini
  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => j?.tanggal === hariIni && !j.bab)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)), 
  [jadwal, hariIni]);

  // 2. FILTER: Jadwal Mendatang (Besok dan seterusnya)
  const jadwalMendatang = useMemo(() => (jadwal || [])
    .filter(j => j?.tanggal > hariIni && !j.bab) 
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jamMulai.localeCompare(b.jamMulai)), 
  [jadwal, hariIni]);

  // Statistik tetap butuh data absensi untuk menghitung "Total Absensi"
  const statsPengajar = useMemo(() => ({ 
    totalKelas: (jadwal || []).length, 
    jurnalSelesai: (jadwal || []).filter(j => j?.bab).length,
    totalAbsensi: (absensi || []).length 
  }), [jadwal, absensi]);

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      
      {/* SECTION 1: Agenda Hari Ini */}
      <AgendaHariIni jadwalHariIni={jadwalHariIni} onPilihJadwal={setJadwalTerpilih} />
      
      {/* SECTION 2: Jadwal Mendatang */}
      <JadwalMendatang jadwalMendatang={jadwalMendatang} />

      {/* MODAL JURNAL */}
      {jadwalTerpilih && (
        <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIni} onClose={() => setJadwalTerpilih(null)} />
      )}
    </div>
  );
}