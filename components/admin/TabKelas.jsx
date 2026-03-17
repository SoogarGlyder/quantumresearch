"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react"; 

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

import { inputAbsenManual } from "../../actions/adminAction";
import { kalkulasiAbsensiLengkap } from "../../utils/kalkulatorData";
import { formatTanggal, formatJam, formatYYYYMMDD, potongDataPagination, ekstrakKeteranganAbsen } from "../../utils/formatHelper";
import { unduhExcel } from "../../utils/exportExcel";
import { STATUS_SESI, OPSI_KELAS, OPSI_MAPEL_KELAS, OPSI_KETERANGAN_ABSEN } from "../../utils/constants";

import { FaFileExcel, FaTriangleExclamation, FaClock, FaFilter } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KELAS / ABSENSI)
// ============================================================================
export default function TabKelas({ dataRiwayat = [], dataJadwal = [], dataSiswa = [], muatData }) {
  
  // --- STATE: FILTER & PAGINATION ---
  const [filterTglKelas, setFilterTglKelas] = useState("");
  const [filterKelasAbsen, setFilterKelasAbsen] = useState("");
  const [filterMapelKelas, setFilterMapelKelas] = useState("");
  
  const [pageKelas, setPageKelas] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // --- STATE: INLINE EDITING (Edit Langsung di Tabel) ---
  const [editingAbsenId, setEditingAbsenId] = useState(null);
  const [inlineKet, setInlineKet] = useState("");
  const [inlineCatatan, setInlineCatatan] = useState("");
  const [loadingInline, setLoadingInline] = useState(false);

  useEffect(() => { setPageKelas(1); }, [filterTglKelas, filterKelasAbsen, filterMapelKelas]);

  // --- HANDLERS ---
  const mulaiEditAbsen = (sesi) => {
    setEditingAbsenId(sesi._id); 
    const { keterangan, catatan } = ekstrakKeteranganAbsen(sesi.status); 
    
    setInlineKet(keterangan || OPSI_KETERANGAN_ABSEN[0] || "Alpa"); 
    setInlineCatatan(catatan || "");
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
  // 1. Hitung seluruh record (Asli + Virtual) HANYA jika data mentahnya berubah
  const riwayatKelasMurni = useMemo(() => {
    return kalkulasiAbsensiLengkap(dataRiwayat, dataJadwal, dataSiswa);
  }, [dataRiwayat, dataJadwal, dataSiswa]);
  
  // 2. Terapkan filter di atas data yang sudah dihitung (Sangat Cepat)
  const riwayatKelasDifilter = useMemo(() => {
    let riwayat = [...riwayatKelasMurni];
    
    if (filterTglKelas) riwayat = riwayat.filter(s => formatYYYYMMDD(s.waktuMulai) === filterTglKelas);
    if (filterKelasAbsen) riwayat = riwayat.filter(s => s.siswaId?.kelas === filterKelasAbsen);
    if (filterMapelKelas) riwayat = riwayat.filter(s => s.namaMapel === filterMapelKelas);
    
    return riwayat;
  }, [riwayatKelasMurni, filterTglKelas, filterKelasAbsen, filterMapelKelas]);
  
  // 3. Potong untuk Pagination
  const { totalPage, dataTerpotong: dataKelasHalIni } = potongDataPagination(riwayatKelasDifilter, pageKelas, ITEMS_PER_PAGE);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint}`}>
      
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
                const isTidakHadir = sesi.status?.includes(STATUS_SESI.TIDAK_HADIR) || false;
                
                return (
                  <tr key={sesi._id}>
                    
                    {/* Kolom 1: Mapel & Tanggal */}
                    <td>
                      <p className={styles.teksTanggal}>{formatTanggal(sesi.waktuMulai)}</p>
                      <p className={styles.teksMapel}>{sesi.namaMapel || "-"}</p>
                    </td>
                    
                    {/* Kolom 2: Siswa & Kelas */}
                    <td>
                      <p className={styles.teksNama}>{sesi.siswaId ? sesi.siswaId.nama : <span style={{color: '#ef4444'}}>Dihapus</span>}</p>
                      <p className={styles.teksKelas}>{sesi.siswaId ? sesi.siswaId.kelas : "-"}</p>
                    </td>
                    
                    {/* Kolom 3: Waktu (Masuk -> Pulang) */}
                    <td style={{textAlign: 'center'}}>
                      {isTidakHadir ? (
                        <span className={styles.teksPudar}>-</span>
                      ) : (
                        <>
                          <span className={styles.teksJam}>{formatJam(sesi.waktuMulai)}</span>
                          <span className={styles.panahJam}>→</span>
                          <span className={styles.teksJamPudar}>{sesi.waktuSelesai ? formatJam(sesi.waktuSelesai) : "??:??"}</span>
                        </>
                      )}
                    </td>
                    
                    {/* Kolom 4: Extra Konsul */}
                    <td style={{textAlign: 'center'}}>
                      {sesi.konsulExtraMenit > 0 ? (
                        <span className={styles.badgeExtraBadge}><FaClock style={{marginRight: '4px'}} /> +{sesi.konsulExtraMenit}m</span>
                      ) : (
                        <span className={styles.teksPudar}>-</span>
                      )}
                    </td>
                    
                    {/* Kolom 5: Keterangan (Normal / Edit Mode) */}
                    <td style={{textAlign: 'center'}}>
                      {isEditing ? (
                        <div className={styles.wadahAksiInline}>
                          <select value={inlineKet} onChange={e => setInlineKet(e.target.value)} className={styles.inlineSelect}>
                            {OPSI_KETERANGAN_ABSEN.map(opsi => <option key={opsi} value={opsi}>{opsi}</option>)}
                          </select>
                          <input type="text" placeholder="Catatan opsional..." value={inlineCatatan} onChange={e => setInlineCatatan(e.target.value)} className={styles.inlineInput} />
                        </div>
                      ) : (
                        isTidakHadir ? (
                          <span className={styles.teksAlpa}>{sesi.status.split('-')[1]?.trim() || "Absen"}</span>
                        ) : sesi.terlambatMenit > 0 ? (
                          <span className={styles.teksTelat}><FaTriangleExclamation /> Telat {sesi.terlambatMenit}m</span>
                        ) : (
                          <span className={styles.teksTepatWaktu}>Tepat Waktu</span>
                        )
                      )}
                    </td>
                    
                    {/* Kolom 6: Status Tag (Selesai/Aktif/Absen) */}
                    <td style={{textAlign: 'center'}}>
                      <span className={`${styles.badgeStatus} ${sesi.status === STATUS_SESI.SELESAI || isTidakHadir ? styles.statusSelesai : styles.statusBerjalan}`}>
                        {sesi.status === STATUS_SESI.SELESAI ? 'Selesai' : isTidakHadir ? 'Absen' : 'Aktif'}
                      </span>
                    </td>
                    
                    {/* Kolom 7: Tombol Aksi (Simpan / Batal / Edit) */}
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
      
      <PaginationBar currentPage={pageKelas} totalPages={totalPage} setPage={setPageKelas} />
    </div>
  );
}