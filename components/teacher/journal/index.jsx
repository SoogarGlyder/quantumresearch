"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";

import HeaderJurnal from "./HeaderJurnal";
import RiwayatJurnal from "./RiwayatJurnal";
import ModalJurnal from "./ModalJurnal"; 

// 🚀 HELPER: Safari-Safe Date Normalizer (Copy dari Home)
const getNormalizeDate = (dateInput) => {
  if (!dateInput) return 0;
  try {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const jktString = dateObj.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const jktDate = new Date(jktString);
    jktDate.setHours(0, 0, 0, 0);
    return jktDate.getTime();
  } catch (error) { return 0; }
};

export default function TabJurnalKelas({ dataUser, jadwal = [] }) {
  const hariIniMurni = getNormalizeDate(new Date());
  const hariIniString = timeHelper.getTglJakarta(); // Untuk dikirim ke Modal
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // LOGIKA FILTER: Arsip Murni (Kebal Safari)
  const jadwalArsip = useMemo(() => {
    return (jadwal || [])
      .filter(j => {
        const tglJadwalMurni = getNormalizeDate(j.tanggal);
        const awalPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.MULAI);
        const akhirPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.AKHIR);

        const isMasaLalu = tglJadwalMurni < hariIniMurni;
        const isHariIniSudahSelesai = tglJadwalMurni === hariIniMurni && !!j.bab;
        const masukPeriode = tglJadwalMurni >= awalPeriodeMurni && tglJadwalMurni <= akhirPeriodeMurni;
        
        return masukPeriode && (isMasaLalu || isHariIniSudahSelesai);
      })
      .sort((a, b) => getNormalizeDate(b.tanggal) - getNormalizeDate(a.tanggal));
  }, [jadwal, hariIniMurni]);

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
          hariIni={hariIniString} 
          onClose={() => setJadwalTerpilih(null)} 
        />
      )}
      
    </div>
  );
}