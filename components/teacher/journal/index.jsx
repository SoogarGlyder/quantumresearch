"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
// 🚀 FIX: Bye-bye lag! Navigation hooks dari Next.js sudah dihapus

import { timeHelper } from "@/utils/timeHelper";
import { PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants";
import { potongDataPagination } from "@/utils/formatHelper"; 
import styles from "@/components/App.module.css";

import HeaderJurnal from "./HeaderJurnal";
import FilterJurnal from "./FilterJurnal"; 
import RiwayatJurnal from "./RiwayatJurnal";
import ModalJurnal from "./ModalJurnal"; 

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

function InnerTabJurnalKelas({ dataUser, jadwal = [] }) {
  const hariIniMurni = getNormalizeDate(new Date());
  const hariIniString = timeHelper.getTglJakarta(); 
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🚀 FIX: Jantung Pagination sekarang menggunakan Local State
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KELAS || 10;

  // 🚀 FIX: Reset memori ke halaman 1 murni saat mengetik pencarian
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const jadwalDitampilkan = useMemo(() => {
    let arsip = (jadwal || []).filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      const awalPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.MULAI);
      const akhirPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.AKHIR);

      const isMasaLalu = tglJadwalMurni < hariIniMurni;
      const isHariIniSudahSelesai = tglJadwalMurni === hariIniMurni && !!j.bab;
      const masukPeriode = tglJadwalMurni >= awalPeriodeMurni && tglJadwalMurni <= akhirPeriodeMurni;
      
      return masukPeriode && (isMasaLalu || isHariIniSudahSelesai);
    });

    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);
      arsip = arsip.filter(j => {
        const isTerisi = !!j.bab;
        const statusTeks = isTerisi ? "jurnal terisi" : "belum isi jurnal";
        const teksTanggal = j?.tanggal ? new Date(j.tanggal).toLocaleDateString('id-ID', { 
          timeZone: PERIODE_BELAJAR.TIMEZONE || "Asia/Jakarta", 
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        }).toLowerCase() : "";

        return keywords.every(kw => (
          (j?.mapel?.toLowerCase() || "").includes(kw) ||
          (j?.kelasTarget?.toLowerCase() || "").includes(kw) ||
          statusTeks.includes(kw) ||
          teksTanggal.includes(kw)
        ));
      });
    }

    return arsip.sort((a, b) => getNormalizeDate(b.tanggal) - getNormalizeDate(a.tanggal));

  }, [jadwal, hariIniMurni, searchQuery]);

  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(jadwalDitampilkan, page, ITEMS_PER_PAGE);

  return (
    <>
      <HeaderJurnal totalArsip={jadwalDitampilkan.length} />
      <FilterJurnal searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <RiwayatJurnal 
        dataHalIni={dataHalIni} 
        totalPage={totalPage}
        currentPage={page}        // 👈 Tembakkan Prop Baru
        onPageChange={setPage}    // 👈 Tembakkan Prop Baru
        onPilihJadwal={setJadwalTerpilih} 
      />
      {jadwalTerpilih && (
        <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIniString} onClose={() => setJadwalTerpilih(null)} />
      )}
    </>
  );
}

export default function TabJurnalKelas({ dataUser, jadwal = [] }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Memuat Jurnal...</div>}>
        <InnerTabJurnalKelas dataUser={dataUser} jadwal={jadwal} />
      </Suspense>
    </div>
  );
}