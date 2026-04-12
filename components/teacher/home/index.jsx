"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";

import HeaderPengajar from "./HeaderPengajar";
import AgendaHariIni from "./AgendaHariIni";
import DaftarAbsensiBulanIni from "./DaftarAbsensiBulanIni";

import ModalJurnal from "@/components/teacher/journal/ModalJurnal"; 

export default function TabBerandaPengajar({ dataUser, jadwal = [], absensi = [], absenAktif }) {
  const hariIni = timeHelper.getTglJakarta();
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  const [idAbsenTerbuka, setIdAbsenTerbuka] = useState(null);

  const toggleAbsen = (id) => setIdAbsenTerbuka(prev => prev === id ? null : id);

  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => j?.tanggal === hariIni && !j.bab)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)), 
  [jadwal, hariIni]);

  const riwayatAbsenBulanIni = useMemo(() => absensi || [], [absensi]);

  const statsPengajar = useMemo(() => ({ 
    totalKelas: (jadwal || []).length, 
    jurnalSelesai: (jadwal || []).filter(j => j?.bab).length,
    totalAbsensi: (absensi || []).length 
  }), [jadwal, absensi]);

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      <AgendaHariIni jadwalHariIni={jadwalHariIni} onPilihJadwal={setJadwalTerpilih} />
      <DaftarAbsensiBulanIni riwayatAbsenBulanIni={riwayatAbsenBulanIni} idAbsenTerbuka={idAbsenTerbuka} toggleAbsen={toggleAbsen} />

      {jadwalTerpilih && (
        <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIni} onClose={() => setJadwalTerpilih(null)} />
      )}
    </div>
  );
}