"use client";

import { useState, useMemo, Suspense } from "react";

import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";

import HeaderJurnal from "./HeaderJurnal";
import TabSelectorJurnal from "./TabSelectorJurnal"; 
import DaftarKelas from "./DaftarKelas";
import DaftarKonsul from "./DaftarKonsul";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================
const getNormalizeDate = (dateInput) => {
  if (!dateInput) return 0;
  try {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const jktString = dateObj.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const jktDate = new Date(jktString);
    jktDate.setHours(0, 0, 0, 0);
    return jktDate.getTime();
  } catch (error) { 
    return 0; 
  }
};

// ============================================================================
// 2. INNER COMPONENT (LOGIKA UTAMA JURNAL)
// ============================================================================
function InnerJurnalHub({ dataUser, jadwal = [] }) {
  const [activeTab, setActiveTab] = useState("KELAS");
  const [totalKonsul, setTotalKonsul] = useState(0);

  const hariIniMurni = getNormalizeDate(new Date());
  
  const totalKelasSah = useMemo(() => {
    return (jadwal || []).filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      const awalPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.MULAI);
      const akhirPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.AKHIR);

      const isMasaLalu = tglJadwalMurni < hariIniMurni;
      const isHariIniSudahSelesai = tglJadwalMurni === hariIniMurni && !!j.bab;
      const masukPeriode = tglJadwalMurni >= awalPeriodeMurni && tglJadwalMurni <= akhirPeriodeMurni;
      
      return masukPeriode && (isMasaLalu || isHariIniSudahSelesai);
    }).length;
  }, [jadwal, hariIniMurni]);

  // Penentuan Teks Judul dan Sub-judul secara dinamis mengikuti tab yang aktif
  const judulHeader = activeTab === "KELAS" ? "Jurnal Kelas" : "Riwayat Konsul";
  const subTeksHeader = activeTab === "KELAS" 
    ? `Ditemukan ${totalKelasSah} riwayat kelas bulan ini` 
    : `Ditemukan ${totalKonsul} sesi pendampingan konsul`;

  return (
    <>
      <HeaderJurnal judul={judulHeader} subTeks={subTeksHeader} />
      <TabSelectorJurnal activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "KELAS" ? (
        <DaftarKelas jadwal={jadwal} hariIniMurni={hariIniMurni} />
      ) : (
        <DaftarKonsul dataUser={dataUser} setTotalKonsul={setTotalKonsul} />
      )}
    </>
  );
}

// ============================================================================
// 3. MAIN EXPORT WRAPPER (DENGAN SUSPENSE)
// ============================================================================
export default function TabJurnalKelasMain({ dataUser, jadwal = [] }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={<div className={styles.messageLoading} style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Memuat Ruang Jurnal...</div>}>
        <InnerJurnalHub dataUser={dataUser} jadwal={jadwal} />
      </Suspense>
    </div>
  );
}