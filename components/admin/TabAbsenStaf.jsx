"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

import { unduhExcel } from "../../utils/exportExcel";
import { formatTanggal, formatBulanTahun, potongDataPagination } from "../../utils/formatHelper";
// 🚀 TAMBAHAN: STATUS_USER untuk memastikan staf nonaktif bisa disaring jika diperlukan
import { LIMIT_DATA, STATUS_USER } from "../../utils/constants";

import { FaFileExcel, FaFilter, FaClock, FaRightFromBracket, FaUserTie } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

export default function TabAbsenStaf({ dataAbsenStaf = [] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // --- STATE: FILTER ---
  const [filterBulan, setFilterBulan] = useState("");
  const [filterNama, setFilterNama] = useState("");

  // Sinkronisasi Filter ke Page 1
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBulan, filterNama]);

  // --- LOGIKA FILTER ---
  const dataDifilter = useMemo(() => {
    // 🚀 OPSI: Mem-filter pengajar yang statusnya nonaktif dari tabel (Opsional)
    // Uncomment baris di bawah ini jika Bos ingin menghilangkan riwayat staf yang sudah resign
    // let hasil = dataAbsenStaf.filter(a => a.pengajarId?.status !== STATUS_USER.NONAKTIF);
    
    // Default (semua absen terekam, termasuk dari staf lama):
    let hasil = [...dataAbsenStaf];

    // 🚀 LOGIKA FILTER BULAN
    if (filterBulan) {
      hasil = hasil.filter(a => {
        if (!a.waktuMasuk) return false;
        
        const dateObj = new Date(a.waktuMasuk);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        
        const bulanTahunAbsen = `${yyyy}-${mm}`;
        
        return bulanTahunAbsen === filterBulan;
      });
    }

    if (filterNama) {
      const keyword = filterNama.toLowerCase();
      hasil = hasil.filter(a => 
        (a.pengajarId?.nama || "").toLowerCase().includes(keyword) ||
        (a.pengajarId?.kodePengajar || "").toLowerCase().includes(keyword)
      );
    }

    return hasil;
  }, [dataAbsenStaf, filterBulan, filterNama]);

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
        
        <FilterInput type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />
        <FilterInput placeholder="Cari Nama / Kode Pengajar..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} />

        <button onClick={() => { setFilterBulan(""); setFilterNama(""); }} className={styles.btnReset}>
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
              <tr><td colSpan="5" className={styles.selKosong}>Tidak ada data absen staf yang cocok.</td></tr>
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

      {/* 🚀 PAGINATION BAR DENGAN JARAK */}
      <div style={{ marginTop: '24px' }}>
        <PaginationBar totalPages={totalPage} />
      </div>

    </div>
  );
}