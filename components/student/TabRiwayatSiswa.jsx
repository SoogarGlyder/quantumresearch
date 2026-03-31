"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo, useEffect, memo } from "react"; 
import Image from "next/image"; 
import { useSearchParams, usePathname, useRouter } from "next/navigation"; 

import PaginationBar from "../ui/PaginationBar"; 
import { potongDataPagination } from "../../utils/formatHelper"; 
import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR, LIMIT_DATA } from "../../utils/constants";
import { hitungDurasiMenit, formatJam } from "../../utils/formatHelper";

import { FaFilter, FaBoxOpen, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import styles from "../App.module.css";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER RIWAYAT (Pure & Memoized)
// ============================================================================
const HeaderRiwayat = memo(() => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <h1 className={styles.headerTitle}>Record Konsul</h1>
  </div>
));
HeaderRiwayat.displayName = "HeaderRiwayat";

// ============================================================================
// 3. SUB-KOMPONEN: FILTER RIWAYAT (Pure & Memoized)
// ============================================================================
const FilterRiwayat = memo(({ filterBulan, setFilterBulan, opsiBulan, filterMapel, setFilterMapel, opsiMapel }) => (
  <div className={styles.filterContainer}>
    <div className={styles.containerDropdownFilter}>
      <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={styles.filterOption}>
        <option value="">Semua Bulan</option>
        {opsiBulan.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      
      <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className={styles.filterOption}>
        <option value="">Semua Mapel</option>
        {opsiMapel.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  </div>
));
FilterRiwayat.displayName = "FilterRiwayat";

// ============================================================================
// 4. SUB-KOMPONEN: RECORD CARD (Item Tunggal - Pure & Memoized)
// ============================================================================
const RecordCard = memo(({ sesi, isOpen, onToggle }) => {
  const isSelesai = sesi.status === STATUS_SESI.SELESAI.id;

  const formatTanggalTanpaTahun = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString('id-ID', {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className={`${styles.recordCard} ${styles.recordCardClickable}`} onClick={() => onToggle(sesi._id)}>
      <div className={styles.recordCardRow}>
        <p className={styles.recordDate}>{formatTanggalTanpaTahun(sesi.waktuMulai)}</p>
        <span 
          className={styles.recordDuration} 
          style={{ backgroundColor: isSelesai ? '#4ade80' : '#facc15', display: isSelesai ? 'none' : 'flex', border: '2px solid #111827', color: '#111827' }}
        >
          {sesi.status.charAt(0).toUpperCase() + sesi.status.slice(1)}
        </span>
        {isSelesai && <span className={styles.recordDuration}>{hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)} menit</span>}
      </div>

      <div className={styles.recordCardRow}>
        <h3 className={styles.recordTitle}>{sesi.namaMapel || "Umum"}</h3>
        <div style={{ marginTop: '12px', color: '#111827', transition: 'transform 0.2s' }}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className={styles.recordDetail}>
            <div className={styles.recordDetailRow} style={{ backgroundColor: '#dbeafe' }}>
              <span>Mulai</span>
              <span>{formatJam(sesi.waktuMulai)} WIB</span>
            </div>
            <div className={styles.recordDetailRow} style={{ backgroundColor: isSelesai ? '#dcfce3' : '#fef08a' }}>
              <span>Selesai</span>
              <span>{isSelesai ? `${formatJam(sesi.waktuSelesai)} WIB` : 'Sedang Berjalan...'}</span>
            </div>
        </div>
      )}
    </div>
  );
});
RecordCard.displayName = "RecordCard";

// ============================================================================
// 5. MAIN EXPORT COMPONENT
// ============================================================================
export default function TabRiwayat({ riwayat = [] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 🛡️ State URL & Parameter Hal
  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KONSUL || 10;

  const [filterBulan, setFilterBulan] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [idTerbuka, setIdTerbuka] = useState(null);

  // 🚀 SINKRONISASI FILTER
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBulan, filterMapel]);

  const dapatkanLabelBulan = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString('id-ID', { 
      timeZone: PERIODE_BELAJAR.TIMEZONE, 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const toggleDetail = (id) => setIdTerbuka(prevId => prevId === id ? null : id);

  // --- PEMILAHAN DATA: PENCIPTAAN "ILUSI" EXTRA KONSUL ---
  const riwayatKonsul = useMemo(() => {
    // 1. Ambil Konsul Murni
    const konsulMurni = riwayat.filter(r => r.jenisSesi === TIPE_SESI.KONSUL);

    // 2. Ciptakan Konsul Ilusi dari Kelas yang punya Extra Konsul
    const konsulExtra = riwayat
      .filter(r => r.jenisSesi === TIPE_SESI.KELAS && r.konsulExtraMenit > 0 && r.waktuSelesai)
      .map(r => {
        // Hitung mundur waktuMulai = waktuSelesai - konsulExtraMenit
        const waktuSelesaiObj = new Date(r.waktuSelesai);
        const waktuMulaiObj = new Date(waktuSelesaiObj.getTime() - r.konsulExtraMenit * 60000);

        return {
          ...r,
          _id: `${r._id}_extra`, // ID dibedakan agar React tidak bentrok
          jenisSesi: TIPE_SESI.KONSUL, // Disamarkan jadi Konsul
          namaMapel: `${r.namaMapel || "Umum"} (Extra)`, // Mapel ditandai khusus
          waktuMulai: waktuMulaiObj.toISOString(),
          waktuSelesai: r.waktuSelesai
        };
      });

    // 3. Gabungkan Keduanya lalu Urutkan berdasarkan Waktu Terbaru
    const gabungan = [...konsulMurni, ...konsulExtra];
    gabungan.sort((a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai));

    return gabungan;
  }, [riwayat]);

  const opsiBulan = useMemo(() => [...new Set(riwayatKonsul.map(r => dapatkanLabelBulan(r.waktuMulai)))], [riwayatKonsul]);
  const opsiMapel = useMemo(() => [...new Set(riwayatKonsul.map(r => r.namaMapel || "Umum"))], [riwayatKonsul]);

  const konsulDitampilkan = useMemo(() => {
    return riwayatKonsul.filter(r => {
      const matchBulan = filterBulan ? dapatkanLabelBulan(r.waktuMulai) === filterBulan : true;
      const matchMapel = filterMapel ? (r.namaMapel || "Umum") === filterMapel : true;
      return matchBulan && matchMapel;
    });
  }, [riwayatKonsul, filterBulan, filterMapel]);

  // 🚀 LOGIKA PAGINATION
  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(konsulDitampilkan, page, ITEMS_PER_PAGE);

  // ============================================================================
  // 6. RENDER UI
  // ============================================================================
  return (
    <div className={styles.contentArea}>
      
      <HeaderRiwayat />
      
      <FilterRiwayat 
        filterBulan={filterBulan} 
        setFilterBulan={setFilterBulan} 
        opsiBulan={opsiBulan} 
        filterMapel={filterMapel} 
        setFilterMapel={setFilterMapel} 
        opsiMapel={opsiMapel} 
      />

      <div className={styles.containerRecord}>
        {dataHalIni.length === 0 ? (
          <div className={styles.wadahKosong} style={{ marginTop: '24px', padding: '40px', textAlign: 'center' }}>
            <FaBoxOpen className={styles.emptyIcon} />
            <p className={styles.emptyText}>Belum ada record konsul.</p>
          </div>
        ) : (
          dataHalIni.map(sesi => (
            <RecordCard 
              key={sesi._id} 
              sesi={sesi} 
              isOpen={idTerbuka === sesi._id} 
              onToggle={toggleDetail} 
            />
          ))
        )}

        {/* 🚀 PAGINATION BAR */}
        <div style={{ marginTop: '24px'}}>
          <PaginationBar totalPages={totalPage} style={{ justifyContent: 'space-evenly'}}/>
        </div>

      </div>
    </div>
  );
}