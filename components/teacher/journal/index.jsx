"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { timeHelper } from "@/utils/timeHelper";
import { PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants";
import { potongDataPagination } from "@/utils/formatHelper"; 
import styles from "@/components/App.module.css";

import HeaderJurnal from "./HeaderJurnal";
import FilterJurnal from "./FilterJurnal"; 
import RiwayatJurnal from "./RiwayatJurnal";
import ModalJurnal from "./ModalJurnal"; 

// HELPER: Safari-Safe Date Normalizer
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

// Komponen Inti dipisah untuk Suspense
function InnerTabJurnalKelas({ dataUser, jadwal = [] }) {
  const hariIniMurni = getNormalizeDate(new Date());
  const hariIniString = timeHelper.getTglJakarta(); 
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  
  // State Pencarian dan Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KELAS || 10;

  // Reset ke halaman 1 saat mengetik pencarian
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // LOGIKA FILTER: Arsip Murni + Multi-Keyword AND
  const jadwalDitampilkan = useMemo(() => {
    // 1. Saring Arsip (Hanya masa lalu / hari ini yang sudah ada bab)
    let arsip = (jadwal || []).filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      const awalPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.MULAI);
      const akhirPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.AKHIR);

      const isMasaLalu = tglJadwalMurni < hariIniMurni;
      const isHariIniSudahSelesai = tglJadwalMurni === hariIniMurni && !!j.bab;
      const masukPeriode = tglJadwalMurni >= awalPeriodeMurni && tglJadwalMurni <= akhirPeriodeMurni;
      
      return masukPeriode && (isMasaLalu || isHariIniSudahSelesai);
    });

    // 2. Terapkan Mesin Pencari
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

    // 3. Urutkan dari yang terbaru ke terlama
    return arsip.sort((a, b) => getNormalizeDate(b.tanggal) - getNormalizeDate(a.tanggal));

  }, [jadwal, hariIniMurni, searchQuery]);

  // 4. Potong Data sesuai Pagination
  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(jadwalDitampilkan, page, ITEMS_PER_PAGE);

  return (
    <>
      <HeaderJurnal totalArsip={jadwalDitampilkan.length} />
      
      <FilterJurnal searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <RiwayatJurnal 
        dataHalIni={dataHalIni} 
        totalPage={totalPage}
        onPilihJadwal={setJadwalTerpilih} 
      />

      {jadwalTerpilih && (
        <ModalJurnal 
          jadwalTerpilih={jadwalTerpilih} 
          hariIni={hariIniString} 
          onClose={() => setJadwalTerpilih(null)} 
        />
      )}
    </>
  );
}

// Komponen Utama dibungkus Suspense agar aman di Vercel
export default function TabJurnalKelas({ dataUser, jadwal = [] }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Memuat Jurnal...</div>}>
        <InnerTabJurnalKelas dataUser={dataUser} jadwal={jadwal} />
      </Suspense>
    </div>
  );
}