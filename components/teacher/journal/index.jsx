"use client";

import { useState, useMemo, Suspense } from "react";
import { timeHelper } from "@/utils/timeHelper";
import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";
import journalStyles from "@/components/teacher/journal/Journal.module.css";

import HeaderJurnal from "./HeaderJurnal";
import TabSelectorJurnal from "./TabSelectorJurnal";
import DaftarKelas from "./DaftarKelas";
import DaftarKonsul from "./DaftarKonsul";

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
function InnerJurnalHub({ dataUser, jadwal = [] }) {
  const [activeTab,   setActiveTab]   = useState("KELAS");
  const [totalKonsul, setTotalKonsul] = useState(0);

  const hariIniString = timeHelper.getTglJakarta();

  const totalKelasSah = useMemo(
    () =>
      jadwal.filter((j) => {
        const tgl        = timeHelper.getTglJakarta(j.tanggal);
        const masukPeriode = tgl >= PERIODE_BELAJAR.MULAI && tgl <= PERIODE_BELAJAR.AKHIR;
        const sudahLewat   = tgl < hariIniString;
        const hariIniSelesai = tgl === hariIniString && !!j.bab;
        return masukPeriode && (sudahLewat || hariIniSelesai);
      }).length,
    [jadwal, hariIniString]
  );

  const judulHeader  = activeTab === "KELAS" ? "Jurnal Kelas" : "Riwayat Konsul";
  const subTeksHeader =
    activeTab === "KELAS"
      ? `Ditemukan ${totalKelasSah} riwayat kelas semester ini`
      : `Ditemukan ${totalKonsul} sesi pendampingan konsul`;

  return (
    <>
      <HeaderJurnal judul={judulHeader} subTeks={subTeksHeader} />
      <TabSelectorJurnal activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "KELAS" ? (
        <DaftarKelas jadwal={jadwal} hariIniString={hariIniString} />
      ) : (
        <DaftarKonsul dataUser={dataUser} setTotalKonsul={setTotalKonsul} />
      )}
    </>
  );
}

export default function TabJurnalKelasMain({ dataUser, jadwal = [] }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={<div className={journalStyles.loadingJurnal}>Memuat Ruang Jurnal...</div>}>
        <InnerJurnalHub dataUser={dataUser} jadwal={jadwal} />
      </Suspense>
    </div>
  );
}