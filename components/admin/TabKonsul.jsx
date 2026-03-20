"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react"; 
// 👇 Import navigasi Next.js untuk URL State
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

import { unduhExcel } from "../../utils/exportExcel";
import { formatTanggal, formatJam, formatBulanTahun, hitungDurasiMenit, potongDataPagination } from "../../utils/formatHelper";
import { TIPE_SESI, STATUS_SESI, OPSI_MAPEL_KONSUL } from "../../utils/constants";

import { FaFileExcel, FaFilter } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KONSUL)
// ============================================================================
export default function TabKonsul({ dataRiwayat = [] }) {
  // --- HOOKS UNTUK URL STATE (Poin 9) ---
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Ambil halaman aktif langsung dari URL (Default ke 1)
  const page = Number(searchParams.get("page")) || 1;
  
  // --- STATE: FILTER ---
  const [filterBulan, setFilterBulan] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [filterNama, setFilterNama] = useState("");

  const ITEMS_PER_PAGE = 20;

  // SINKRONISASI FILTER: Jika kriteria filter berubah, reset halaman ke 1 di URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filterBulan, filterMapel, filterNama]);

  // --- HANDLERS ---
  const resetFilter = () => {
    setFilterBulan("");
    setFilterMapel("");
    setFilterNama("");
  };

  // --- LOGIKA FILTER (Dioptimasi dengan useMemo) ---
  const riwayatKonsulMurni = useMemo(() => {
    return dataRiwayat.filter(sesi => sesi.jenisSesi === TIPE_SESI.KONSUL);
  }, [dataRiwayat]);
  
  const riwayatKonsulDifilter = useMemo(() => {
    let riwayat = [...riwayatKonsulMurni];
    
    if (filterBulan) {
      riwayat = riwayat.filter(s => formatBulanTahun(s.waktuMulai) === filterBulan);
    }
    
    if (filterMapel) {
      // 👇 Mengatasi Poin 31: Filter mapel pakai strict equality (===) karena input dari dropdown pasti identik
      riwayat = riwayat.filter(s => s.namaMapel === filterMapel);
    }
    
    if (filterNama) {
      const kataKunci = filterNama.toLowerCase();
      riwayat = riwayat.filter(s => (s.siswaId?.nama || "").toLowerCase().includes(kataKunci));
    }
    
    return riwayat;
  }, [riwayatKonsulMurni, filterBulan, filterMapel, filterNama]);

  // Menggunakan 'page' yang ditarik dari URL
  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(riwayatKonsulDifilter, page, ITEMS_PER_PAGE);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint}`}>
      
      {/* HEADER & TOMBOL EXCEL */}
      <div className={styles.headerTabWrapper}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}>Record Konsul Siswa</h2>
        <button onClick={() => unduhExcel(riwayatKonsulDifilter, "konsul")} className={styles.btnExcel}>
          <FaFileExcel /> Unduh Excel ({riwayatKonsulDifilter.length})
        </button>
      </div>
      
      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <FaFilter color="#111827" size={18} style={{marginRight: '8px'}} />
        <span className={styles.labelFilter}>Filter:</span>
        
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
                // 👇 Hitung apakah status konsul sedang aktif
                const isAktif = sesi.status !== STATUS_SESI.SELESAI;

                return (
                  <tr key={sesi._id}>
                    
                    {/* Kolom 1: Siswa & Kelas */}
                    <td>
                      <p className={styles.teksNama}>{sesi.siswaId ? sesi.siswaId.nama : <span className={styles.teksErrorItalic}>Siswa Dihapus</span>}</p>
                      <p className={styles.teksKelas}>{sesi.siswaId ? sesi.siswaId.kelas : "-"}</p>
                    </td>
                    
                    {/* Kolom 2: Mapel */}
                    <td>
                      <span className={styles.badgeMapelAbu}>{sesi.namaMapel || "Bebas"}</span>
                    </td>
                    
                    {/* Kolom 3: Tanggal & Jam */}
                    <td>
                      <p className={styles.teksTanggal}>{formatTanggal(sesi.waktuMulai)}</p>
                      <p className={styles.teksJamPudar}>
                        {formatJam(sesi.waktuMulai)} - {sesi.waktuSelesai ? formatJam(sesi.waktuSelesai) : "Sekarang"}
                      </p>
                    </td>
                    
                    {/* Kolom 4: Durasi */}
                    <td style={{textAlign: 'center'}}>
                      <span className={styles.teksJam}>
                        {sesi.waktuSelesai ? `${hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)}m` : "-"}
                      </span>
                    </td>
                    
                    {/* Kolom 5: Status */}
                    <td style={{textAlign: 'center'}}>
                      {/* 👇 Pemasangan animasi brutalPulse hanya jika isAktif bernilai true */}
                      <span 
                        className={`${styles.badgeStatus} ${sesi.status === STATUS_SESI.SELESAI ? styles.statusSelesai : styles.statusBerjalan}`}
                        style={isAktif ? { animation: 'brutalPulse 2s infinite' } : {}}
                      >
                        {sesi.status === STATUS_SESI.SELESAI ? 'Selesai' : 'Aktif'}
                      </span>
                    </td>
                    
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* PAGINATION BAR sekarang mandiri membaca URL */}
      <PaginationBar totalPages={totalPage} />
      
    </div>
  );
}