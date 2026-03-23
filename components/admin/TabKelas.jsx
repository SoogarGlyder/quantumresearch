"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react"; 
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

import { inputAbsenManual } from "../../actions/adminAction";
import { kalkulasiAbsensiLengkap } from "../../utils/kalkulatorData";
import { formatTanggal, formatJam, formatYYYYMMDD, potongDataPagination, ekstrakKeteranganAbsen } from "../../utils/formatHelper";
// 👈 Import Konstanta Sistem & Limit
import { STATUS_SESI, OPSI_KELAS, OPSI_MAPEL_KELAS, OPSI_KETERANGAN_ABSEN, LIMIT_DATA } from "../../utils/constants";

import { FaFileExcel, FaTriangleExclamation, FaClock, FaFilter } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KELAS / ABSENSI)
// ============================================================================
export default function TabKelas({ dataRiwayat = [], dataJadwal = [], dataSiswa = [], muatData }) {
  
  // --- HOOKS UNTUK URL STATE ---
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Ambil halaman aktif langsung dari URL (Default ke 1)
  const page = Number(searchParams.get("page")) || 1;

  // --- STATE: FILTER ---
  const [filterTglKelas, setFilterTglKelas] = useState("");
  const [filterKelasAbsen, setFilterKelasAbsen] = useState("");
  const [filterMapelKelas, setFilterMapelKelas] = useState("");
  
  // 🛡️ ZERO HARDCODE: Ambil limit dari konstanta
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // --- STATE: INLINE EDITING (Edit Langsung di Tabel) ---
  const [editingAbsenId, setEditingAbsenId] = useState(null);
  const [inlineKet, setInlineKet] = useState("");
  const [inlineCatatan, setInlineCatatan] = useState("");
  const [loadingInline, setLoadingInline] = useState(false);

  // SINKRONISASI FILTER: Jika kriteria pencarian berubah, reset URL page ke 1
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filterTglKelas, filterKelasAbsen, filterMapelKelas]);

  // --- HANDLERS ---
  const mulaiEditAbsen = (sesi) => {
    setEditingAbsenId(sesi._id); 
    
    // 🛡️ PERBAIKAN BUG: Pisahkan Keterangan dan Catatan dengan aman
    const catatanExtracted = ekstrakKeteranganAbsen(sesi.status);
    const ketExtracted = sesi.status ? sesi.status.split('(')[0].trim() : STATUS_SESI.ALPA.id;
    
    setInlineKet(ketExtracted || OPSI_KETERANGAN_ABSEN[0]?.value || STATUS_SESI.ALPA.id); 
    setInlineCatatan(catatanExtracted || "");
  };

  const simpanAbsenInline = async (sesi) => {
    setLoadingInline(true);
    
    const tgl = sesi.tanggalAsli || formatYYYYMMDD(sesi.waktuMulai); 
    const payload = { 
      siswaId: sesi.siswaId._id, 
      tanggal: tgl, 
      mapel: sesi.namaMapel, 
      keterangan: inlineKet, 
      catatan: inlineCatatan 
    };
    
    try {
      const res = await inputAbsenManual(payload);
      if (res.sukses) { 
        setEditingAbsenId(null); 
        if(typeof muatData === 'function') muatData(); 
      } else { 
        alert("⚠️ Gagal menyimpan: " + res.pesan); 
      }
    } catch (error) {
      console.error("[ERROR simpanAbsenInline]:", error);
      alert("⚠️ Terjadi kesalahan koneksi.");
    } finally {
      setLoadingInline(false);
    }
  };

  const batalEditAbsen = () => {
    if(!loadingInline) setEditingAbsenId(null);
  };

  // --- LOGIKA FILTER ---
  const riwayatKelasMurni = useMemo(() => {
    return kalkulasiAbsensiLengkap(dataRiwayat, dataJadwal, dataSiswa);
  }, [dataRiwayat, dataJadwal, dataSiswa]);
  
  const riwayatKelasDifilter = useMemo(() => {
    let riwayat = [...riwayatKelasMurni];
    
    if (filterTglKelas) riwayat = riwayat.filter(s => formatYYYYMMDD(s.waktuMulai) === filterTglKelas);
    if (filterKelasAbsen) riwayat = riwayat.filter(s => s.siswaId?.kelas === filterKelasAbsen);
    if (filterMapelKelas) riwayat = riwayat.filter(s => s.namaMapel === filterMapelKelas);
    
    return riwayat;
  }, [riwayatKelasMurni, filterTglKelas, filterKelasAbsen, filterMapelKelas]);
  
  const { totalPage, dataTerpotong: dataKelasHalIni } = potongDataPagination(riwayatKelasDifilter, page, ITEMS_PER_PAGE);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahMonitoring}`}>
      
      {/* HEADER & TOMBOL EXCEL */}
      <div className={styles.headerTabWrapper}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}>Data Kehadiran Kelas</h2>
        <button onClick={() => unduhExcel(riwayatKelasDifilter, "kelas")} className={styles.btnExcel}>
          <FaFileExcel /> Unduh Excel ({riwayatKelasDifilter.length})
        </button>
      </div>
      
      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <FaFilter color="#111827" size={18} style={{marginRight: '8px'}} />
        <FilterInput type="date" value={filterTglKelas} onChange={(e) => setFilterTglKelas(e.target.value)} />
        
        <select value={filterKelasAbsen} onChange={(e) => setFilterKelasAbsen(e.target.value)} className={styles.filterSelectMurni}>
          <option value="">Semua Kelas</option>
          {OPSI_KELAS.map(opsi => <option key={opsi} value={opsi}>{opsi}</option>)}
        </select>

        <select value={filterMapelKelas} onChange={(e) => setFilterMapelKelas(e.target.value)} className={styles.filterSelectMurni}>
          <option value="">Semua Mapel</option>
          {OPSI_MAPEL_KELAS.map(opsi => <option key={opsi} value={opsi}>{opsi}</option>)}
        </select>

        <button onClick={() => { setFilterTglKelas(""); setFilterKelasAbsen(""); setFilterMapelKelas(""); }} className={styles.btnReset}>
          Reset
        </button>
      </div>

      {/* TABEL DATA */}
      <div className={styles.wadahTabel}>
        <table className={styles.tabelStyle}>
          <thead>
            <tr>
              <th>Tanggal & Mapel</th>
              <th>Nama & Kelas</th>
              <th style={{textAlign: 'center'}}>Waktu</th>
              <th style={{textAlign: 'center'}}>Extra Konsul</th>
              <th style={{textAlign: 'center'}}>Keterangan</th>
              <th style={{textAlign: 'center'}}>Status</th>
              <th style={{textAlign: 'center'}}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataKelasHalIni.length === 0 ? (
              <tr><td colSpan="7" className={styles.selKosong}>Tidak ada data yang cocok dengan filter.</td></tr>
            ) : (
              dataKelasHalIni.map(sesi => {
                const isEditing = editingAbsenId === sesi._id;
                
                // 🛡️ ZERO HARDCODE: Cek Status
                const isTidakHadir = 
                  sesi.status?.includes(STATUS_SESI.TIDAK_HADIR.id) || 
                  sesi.status?.includes(STATUS_SESI.ALPA.id) || 
                  sesi.status?.includes(STATUS_SESI.SAKIT.id) || 
                  sesi.status?.includes(STATUS_SESI.IZIN.id);
                  
                const isAktif = sesi.status !== STATUS_SESI.SELESAI.id && !isTidakHadir;
                
                return (
                  <tr key={sesi._id}>
                    
                    <td className={styles.tdLebar}>
                      <p className={styles.teksTanggal}>{formatTanggal(sesi.waktuMulai)}</p>
                      <p className={styles.teksMapel}>{sesi.namaMapel || "-"}</p>
                    </td>
                    
                    <td className={styles.tdLebar}>
                      <p className={styles.teksNama}>{sesi.siswaId ? sesi.siswaId.nama : <span style={{color: '#ef4444'}}>Dihapus</span>}</p>
                      <p className={styles.teksKelas}>{sesi.siswaId ? sesi.siswaId.kelas : "-"}</p>
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      {isTidakHadir ? (
                        <span className={styles.teksPudar}>-</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span className={styles.teksJam}>{formatJam(sesi.waktuMulai)}</span>
                          <span className={styles.panahJam}>→</span>
                          <span className={styles.teksJamPudar}>{sesi.waktuSelesai ? formatJam(sesi.waktuSelesai) : "??:??"}</span>
                        </div>
                      )}
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      {sesi.konsulExtraMenit > 0 ? (
                        <span className={styles.badgeExtraBadge}><FaClock style={{marginRight: '4px'}} /> +{sesi.konsulExtraMenit}m</span>
                      ) : (
                        <span className={styles.teksPudar}>-</span>
                      )}
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      {isEditing ? (
                        <div className={styles.wadahAksiInline}>
                          {/* 🛡️ PERBAIKAN BUG: Map object {label, value} dengan benar */}
                          <select value={inlineKet} onChange={e => setInlineKet(e.target.value)} className={styles.inlineSelect}>
                            {OPSI_KETERANGAN_ABSEN.map(opsi => (
                              <option key={opsi.value} value={opsi.value}>{opsi.label}</option>
                            ))}
                          </select>
                          <input type="text" placeholder="Catatan opsional..." value={inlineCatatan} onChange={e => setInlineCatatan(e.target.value)} className={styles.inlineInput} />
                        </div>
                      ) : (
                        isTidakHadir ? (
                          <span className={styles.teksAlpa}>{sesi.status.toUpperCase()}</span>
                        ) : sesi.terlambatMenit > 0 ? (
                          <span className={styles.teksTelat}><FaTriangleExclamation /> Telat {sesi.terlambatMenit}m</span>
                        ) : (
                          <span className={styles.teksTepatWaktu}>Tepat Waktu</span>
                        )
                      )}
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      <span 
                        className={`${styles.badgeStatus} ${sesi.status === STATUS_SESI.SELESAI.id || isTidakHadir ? styles.statusSelesai : styles.statusBerjalan}`}
                        style={isAktif ? { animation: 'brutalPulse 2s infinite' } : {}}
                      >
                        {sesi.status === STATUS_SESI.SELESAI.id ? STATUS_SESI.SELESAI.label : isTidakHadir ? 'Absen' : STATUS_SESI.BERJALAN.label}
                      </span>
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      {isEditing ? (
                        <div className={styles.wadahAksiInlineHorizontal}>
                          <button disabled={loadingInline} onClick={() => simpanAbsenInline(sesi)} className={styles.btnSimpanInline} title="Simpan Perubahan">✔</button>
                          <button disabled={loadingInline} onClick={batalEditAbsen} className={styles.btnBatalInline} title="Batalkan">✖</button>
                        </div>
                      ) : (
                        (isTidakHadir || sesi.isVirtual) ? (
                          <button onClick={() => mulaiEditAbsen(sesi)} className={styles.btnEditKet}>✏️ Edit</button>
                        ) : (
                          <span className={styles.teksPudar}>-</span>
                        )
                      )}
                    </td>

                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      <PaginationBar totalPages={totalPage} />
    </div>
  );
}