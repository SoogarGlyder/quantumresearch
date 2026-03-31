"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react"; 
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

// 🚀 IMPORT FUNGSI UNDUH EXCEL
import { unduhExcel } from "../../utils/exportExcel";
import { formatTanggal, formatJam, formatBulanTahun, hitungDurasiMenit, potongDataPagination } from "../../utils/formatHelper";

// 👈 Import Konstanta Lengkap
import { TIPE_SESI, STATUS_SESI, OPSI_MAPEL_KONSUL, LIMIT_DATA, STATUS_USER } from "../../utils/constants";

import { FaFileExcel, FaFilter } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KONSUL)
// ============================================================================
export default function TabKonsul({ dataRiwayat = [] }) {
  // --- HOOKS UNTUK URL STATE ---
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  
  // --- STATE: FILTER ---
  const [filterBulan, setFilterBulan] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [filterNama, setFilterNama] = useState("");

  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // SINKRONISASI FILTER: Reset ke hal 1 jika kriteria filter berubah
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filterBulan, filterMapel, filterNama]);

  const resetFilter = () => {
    setFilterBulan("");
    setFilterMapel("");
    setFilterNama("");
  };

  // ============================================================================
  // 🚀 LOGIKA INTI: PENGGABUNGAN KONSUL MURNI & EXTRA KELAS
  // ============================================================================
  const riwayatKonsulGabungan = useMemo(() => {
    // 1. Ambil Konsul Murni
    const konsulMurni = dataRiwayat.filter(r => r.jenisSesi === TIPE_SESI.KONSUL);

    // 2. Ciptakan Konsul "Ilusi" dari Kelas yang punya Extra Konsul
    const konsulExtra = dataRiwayat
      .filter(r => r.jenisSesi === TIPE_SESI.KELAS && r.konsulExtraMenit > 0 && r.waktuSelesai)
      .map(r => {
        // Hitung mundur waktuMulai = waktuSelesai - konsulExtraMenit
        const waktuSelesaiObj = new Date(r.waktuSelesai);
        const waktuMulaiObj = new Date(waktuSelesaiObj.getTime() - r.konsulExtraMenit * 60000);

        return {
          ...r,
          _id: `${r._id}_extra`, 
          jenisSesi: TIPE_SESI.KONSUL, 
          namaMapel: `${r.namaMapel || "Umum"} (Extra)`, 
          waktuMulai: waktuMulaiObj.toISOString(),
          waktuSelesai: r.waktuSelesai
        };
      });

    // 3. Gabungkan dan Urutkan Terbaru di Atas
    const gabungan = [...konsulMurni, ...konsulExtra];
    return gabungan.sort((a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai));
  }, [dataRiwayat]);
  
  // ============================================================================
  // 🚀 LOGIKA FILTERING
  // ============================================================================
  const riwayatKonsulDifilter = useMemo(() => {
    let riwayat = riwayatKonsulGabungan.filter(s => s.siswaId?.status !== STATUS_USER.NONAKTIF);
    
    if (filterBulan) {
      riwayat = riwayat.filter(s => {
        if (!s.waktuMulai) return false;
        const dateObj = new Date(s.waktuMulai);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0'); 
        return `${yyyy}-${mm}` === filterBulan;
      });
    }
    
    if (filterMapel) {
      riwayat = riwayat.filter(s => (s.namaMapel || "").includes(filterMapel));
    }
    
    if (filterNama) {
      const kataKunci = filterNama.toLowerCase();
      riwayat = riwayat.filter(s => (s.siswaId?.nama || "").toLowerCase().includes(kataKunci));
    }
    
    return riwayat;
  }, [riwayatKonsulGabungan, filterBulan, filterMapel, filterNama]);

  // 🚀 PAGINATION
  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(riwayatKonsulDifilter, page, ITEMS_PER_PAGE);

  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahMonitoring}`}>
      
      {/* HEADER & TOMBOL EXCEL */}
      <div className={styles.headerTabWrapper}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}>Monitoring Konsul & Extra</h2>
        <button onClick={() => unduhExcel(riwayatKonsulDifilter, "konsul")} className={styles.btnExcel}>
          <FaFileExcel /> Unduh Excel ({riwayatKonsulDifilter.length})
        </button>
      </div>
      
      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaFilter color="#111827" size={18} style={{marginRight: '8px'}} />
          <span className={styles.labelFilter}>Filter:</span>
        </div>
        
        <FilterInput type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />
        <FilterInput placeholder="Cari Nama Siswa..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} />
        
        <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className={styles.filterSelectMurni}>
          <option value="">Semua Mapel</option>
          {OPSI_MAPEL_KONSUL.map(opsi => (
            <option key={opsi} value={opsi}>{opsi}</option>
          ))}
        </select>

        <button onClick={resetFilter} className={styles.btnReset}>
          Reset
        </button>
      </div>

      {/* TABEL DATA KONSUL */}
      <div className={styles.wadahTabel}>
        <table className={styles.tabelStyle}>
          <thead>
            <tr>
              <th>Nama & Kelas</th>
              <th>Mata Pelajaran</th>
              <th>Waktu Konsul</th>
              <th style={{textAlign: 'center'}}>Durasi</th>
              <th style={{textAlign: 'center'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {dataHalIni.length === 0 ? (
              <tr><td colSpan="5" className={styles.selKosong}>Tidak ada data konsul yang cocok.</td></tr>
            ) : (
              dataHalIni.map(sesi => {
                const isAktif = sesi.status !== STATUS_SESI.SELESAI.id;
                const isExtra = sesi._id.toString().includes("_extra");

                return (
                  <tr key={sesi._id}>
                    <td>
                      <p className={styles.teksNama}>{sesi.siswaId ? sesi.siswaId.nama : <span className={styles.teksErrorItalic}>Siswa Dihapus</span>}</p>
                      <p className={styles.teksKelas}>{sesi.siswaId ? sesi.siswaId.kelas : "-"}</p>
                    </td>
                    
                    <td>
                      {/* ✅ Style Mapel dibuat sama (abu-abu) untuk Normal maupun Extra */}
                      <span className={styles.badgeMapelAbu}>
                        {sesi.namaMapel || "Bebas"}
                      </span>
                    </td>
                    
                    <td>
                      <p className={styles.teksTanggal}>{formatTanggal(sesi.waktuMulai)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className={styles.teksJamPudar}>{formatJam(sesi.waktuMulai)}</span>
                        <span className={styles.teksJamPudar}>-</span>
                        <span className={styles.teksJamPudar}>{sesi.waktuSelesai ? formatJam(sesi.waktuSelesai) : "Sekarang"}</span>
                      </div>
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      <span className={styles.teksJam}>
                        {sesi.waktuSelesai ? `${hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)}m` : "-"}
                      </span>
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      <span 
                        className={`${styles.badgeStatus} ${sesi.status === STATUS_SESI.SELESAI.id ? styles.statusSelesai : styles.statusBerjalan}`}
                        style={isAktif ? { animation: 'brutalPulse 2s infinite' } : {}}
                      >
                        {isExtra ? "EXTRA" : (sesi.status === STATUS_SESI.SELESAI.id ? STATUS_SESI.SELESAI.label : STATUS_SESI.BERJALAN.label)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <PaginationBar totalPages={totalPage} />
      </div>
    </div>
  );
}