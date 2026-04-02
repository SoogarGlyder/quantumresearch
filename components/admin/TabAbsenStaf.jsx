"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

import { unduhExcel } from "../../utils/exportExcel";
import { formatTanggal, potongDataPagination, formatYYYYMMDD } from "../../utils/formatHelper"; // 🚀 FIX: Tambah formatYYYYMMDD
import { LIMIT_DATA, STATUS_USER } from "../../utils/constants";

// 🚀 FIX: Tambah FaMagnifyingGlass
import { FaFileExcel, FaFilter, FaClock, FaRightFromBracket, FaUserTie, FaMagnifyingGlass } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB ABSEN STAF)
// ============================================================================
// 🚀 FIX: Terima props bulanAktif
export default function TabAbsenStaf({ dataAbsenStaf = [], bulanAktif }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // --- STATE: FILTER ---
  const [filterTglAbsen, setFilterTglAbsen] = useState(""); // 🚀 Ganti filterBulan jadi filter Hari
  const [filterNama, setFilterNama] = useState("");
  
  useEffect(() => {
    setFilterTglAbsen("");
    setFilterNama("");
  }, [bulanAktif]);

  // ============================================================================
  // 🚀 BOSS LEVEL LOGIC: Hitung Batas Tanggal (Staf 29 bln lalu - 28 bln ini)
  // ============================================================================
  const { minDate, maxDate } = useMemo(() => {
    if (!bulanAktif) return { minDate: "", maxDate: "" };

    const [tahunStr, bulanStr] = bulanAktif.split("-");
    const y = Number(tahunStr);
    const m = Number(bulanStr) - 1; // Bulan di JS mulai dari 0

    // Tanggal Awal: 29 Bulan SEBELUMNYA
    const minObj = new Date(y, m - 1, 29);
    const minYYYY = minObj.getFullYear();
    const minMM = String(minObj.getMonth() + 1).padStart(2, '0');
    const min = `${minYYYY}-${minMM}-29`;

    // Tanggal Akhir: 28 Bulan INI
    const max = `${tahunStr}-${bulanStr}-28`;

    return { minDate: min, maxDate: max };
  }, [bulanAktif]);

  // Sinkronisasi Filter ke Page 1
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTglAbsen, filterNama]);

  // 🚀 DIET MEMORI: Potong data 1 Tahun jadi 1 Bulan (Siklus 29-28) SEBELUM difilter lokal
  const absenBulanIni = useMemo(() => {
    return dataAbsenStaf.filter(a => {
      if (!a.waktuMasuk) return false;
      const tglStr = formatYYYYMMDD(a.waktuMasuk);
      return tglStr >= minDate && tglStr <= maxDate;
    });
  }, [dataAbsenStaf, minDate, maxDate]);

  // --- LOGIKA FILTER LOKAL ---
  const dataDifilter = useMemo(() => {
    let hasil = [...absenBulanIni];

    // 🚀 Filter Hari Spesifik
    if (filterTglAbsen) {
      hasil = hasil.filter(a => formatYYYYMMDD(a.waktuMasuk) === filterTglAbsen);
    }

    if (filterNama) {
      const keyword = filterNama.toLowerCase();
      hasil = hasil.filter(a => 
        (a.pengajarId?.nama || "").toLowerCase().includes(keyword) ||
        (a.pengajarId?.kodePengajar || "").toLowerCase().includes(keyword)
      );
    }

    return hasil;
  }, [absenBulanIni, filterTglAbsen, filterNama]);

  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(dataDifilter, page, ITEMS_PER_PAGE);

  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahMonitoring}`}>
      
      {/* HEADER & EXCEL */}
      <div className={styles.headerTabWrapper}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}>Presensi Staff / Pengajar</h2>
        <button 
          onClick={() => unduhExcel(dataDifilter, "absen-staf")} 
          className={styles.btnExcel}
        >
          <FaFileExcel /> Unduh Excel ({dataDifilter.length})
        </button>
      </div>

      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaFilter color="#111827" size={18} style={{marginRight: '8px'}} />
          <span className={styles.labelFilter}>Filter:</span>
        </div>
        
        {/* 🚀 UI BARU: Kolom Pencarian Nama Sejajar */}
        <div className={styles.wadahCari} style={{ minWidth: '180px' }}>
          <div className={styles.iconCari}><FaMagnifyingGlass color="#6b7280" /></div>
          <input 
            type="text" 
            placeholder="Cari Nama / Kode..." 
            value={filterNama} 
            onChange={(e) => setFilterNama(e.target.value)} 
            className={styles.inputCari}
          />
        </div>

        {/* 🚀 Kalender "Terkunci" berdasarkan siklus 29-28 */}
        <FilterInput 
          type="date" 
          value={filterTglAbsen} 
          onChange={(e) => setFilterTglAbsen(e.target.value)} 
          min={minDate}
          max={maxDate}
        />

        <button onClick={() => { setFilterTglAbsen(""); setFilterNama(""); }} className={styles.btnReset}>
          Reset
        </button>
      </div>

      {/* TABEL DATA */}
      <div className={styles.wadahTabel}>
        <table className={styles.tabelStyle}>
          <thead>
            <tr>
              <th>Pengajar</th>
              <th>Tanggal</th>
              <th>Clock-In</th>
              <th>Clock-Out</th>
              <th style={{textAlign: 'center'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {dataHalIni.length === 0 ? (
              <tr><td colSpan="5" className={styles.selKosong}>Tidak ada data absen staf di periode ini.</td></tr>
            ) : (
              dataHalIni.map((absen) => (
                <tr key={absen._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ background: "#111827", color: "white", padding: "8px", borderRadius: "8px", border: "2px solid #facc15" }}>
                        <FaUserTie size={16} />
                      </div>
                      <div>
                        <p className={styles.teksNama} style={{textTransform: 'uppercase'}}>{absen.pengajarId?.nama || "Staff"}</p>
                        <p className={styles.teksKelas} style={{color: '#2563eb'}}>KODE: {absen.pengajarId?.kodePengajar || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: "800" }}>{formatTanggal(absen.waktuMasuk)}</td>
                  <td style={{ color: "#15803d", fontWeight: "900" }}>
                    <FaClock size={12} /> {new Date(absen.waktuMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ color: absen.waktuKeluar ? "#ef4444" : "#9ca3af", fontWeight: "900" }}>
                    {absen.waktuKeluar ? (
                      <><FaRightFromBracket size={12} /> {new Date(absen.waktuKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</>
                    ) : "--:--"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles.badgeStatus} ${absen.waktuKeluar ? styles.statusSelesai : styles.statusBerjalan}`} style={!absen.waktuKeluar ? { animation: 'brutalPulse 2s infinite' } : {}}>
                      {absen.waktuKeluar ? "SELESAI" : "AKTIF"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION BAR */}
      <div style={{ marginTop: '24px' }}>
        <PaginationBar totalPages={totalPage} />
      </div>

    </div>
  );
}