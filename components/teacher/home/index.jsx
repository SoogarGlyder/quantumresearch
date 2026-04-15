"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";

import HeaderPengajar from "./HeaderPengajar";
import AgendaHariIni from "./AgendaHariIni";
import JadwalMendatang from "./JadwalMendatang"; 

import ModalJurnal from "@/components/teacher/journal/ModalJurnal"; 
import WidgetRadarCBT from "./WidgetRadarCBT";

export default function TabBerandaPengajar({ dataUser, jadwal = [], absensi = [], absenAktif }) {
  const hariIni = timeHelper.getTglJakarta();
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // ===================================================================
  // 🚀 PERBAIKAN BUG TANGGAL SAFARI (Potong ISO String jadi YYYY-MM-DD)
  // ===================================================================
  
  // 1. FILTER: Jadwal Hari Ini
  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => {
      if (!j?.tanggal) return false;
      const tglJadwal = j.tanggal.substring(0, 10); // Paksa ambil 10 karakter pertama saja
      return tglJadwal === hariIni && !j.bab;
    })
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)), 
  [jadwal, hariIni]);

  // 2. FILTER: Jadwal Mendatang (Besok dan seterusnya)
  const jadwalMendatang = useMemo(() => (jadwal || [])
    .filter(j => {
      if (!j?.tanggal) return false;
      const tglJadwal = j.tanggal.substring(0, 10);
      return tglJadwal > hariIni && !j.bab;
    }) 
    .sort((a, b) => {
      const tglA = a.tanggal.substring(0, 10);
      const tglB = b.tanggal.substring(0, 10);
      return tglA.localeCompare(tglB) || a.jamMulai.localeCompare(b.jamMulai);
    }), 
  [jadwal, hariIni]);

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
        <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIni} onClose={() => setJadwalTerpilih(null)} />
      )}
    </div>
  );
}