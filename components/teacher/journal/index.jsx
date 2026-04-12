// File: components/teacher/journal/index.jsx
"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";

import HeaderJurnal from "./HeaderJurnal";
import RiwayatJurnal from "./RiwayatJurnal";
import ModalJurnal from "./ModalJurnal"; 

export default function TabJurnalKelas({ dataUser, jadwal = [] }) {
  const hariIni = timeHelper.getTglJakarta();
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // LOGIKA FILTER: Arsip Murni (Pisahkan UI dan Logika)
  const jadwalArsip = useMemo(() => {
    return (jadwal || [])
      .filter(j => {
        const isMasaLalu = j.tanggal < hariIni;
        const isHariIniSudahSelesai = j.tanggal === hariIni && !!j.bab;
        const masukPeriode = j.tanggal >= PERIODE_BELAJAR.MULAI && j.tanggal <= PERIODE_BELAJAR.AKHIR;
        
        return masukPeriode && (isMasaLalu || isHariIniSudahSelesai);
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [jadwal, hariIni]);

  return (
    <div className={styles.contentArea}>
      
      <HeaderJurnal totalArsip={jadwalArsip.length} />

      <RiwayatJurnal 
        jadwalArsip={jadwalArsip} 
        onPilihJadwal={setJadwalTerpilih} 
      />

      {jadwalTerpilih && (
        <ModalJurnal 
          jadwalTerpilih={jadwalTerpilih} 
          hariIni={hariIni} 
          onClose={() => setJadwalTerpilih(null)} 
        />
      )}
      
    </div>
  );
}