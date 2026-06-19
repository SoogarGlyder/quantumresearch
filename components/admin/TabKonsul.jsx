"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo, useCallback } from "react"; 
import { useRouter } from "next/navigation"; 

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

import { unduhExcel } from "../../utils/exportExcel";
import { formatTanggal, formatJam, hitungDurasiMenit, potongDataPagination, formatYYYYMMDD, formatHelper } from "@/utils/formatHelper"; 
import { paksaHentikanSesi } from "../../actions/adminAction";
import { TIPE_SESI, STATUS_SESI, OPSI_MAPEL_KONSUL, LIMIT_DATA, STATUS_USER, OPSI_KELAS } from "../../utils/constants";
import { timeHelper } from "@/utils/timeHelper"
import { FaFileExcel, FaFilter, FaMagnifyingGlass, FaClock } from "react-icons/fa6"; //  FIX: Import FaClock
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KONSUL)
// ============================================================================
export default function TabKonsul({ dataRiwayat = [], dataJadwal = [], bulanAktif }) {
  const router = useRouter(); 

  const [page, setPage] = useState(1);
  
  const [filterTglKonsul, setFilterTglKonsul] = useState(""); 
  const [filterMapel, setFilterMapel] = useState("");
  const [filterNama, setFilterNama] = useState("");
  const [filterKelasKonsul, setFilterKelasKonsul] = useState(""); 
  const [filterPengajar, setFilterPengajar] = useState("");

  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  const { minDate, maxDate } = useMemo(() => {
    if (!bulanAktif) return { minDate: "", maxDate: "" };
    
    const [tahunStr, bulanStr] = bulanAktif.split("-");
    const y = Number(tahunStr);
    const m = Number(bulanStr) - 1; 
    
    const endDay = new Date(y, m + 1, 0).getDate();
    
    const min = `${tahunStr}-${bulanStr}-01`;
    const max = `${tahunStr}-${bulanStr}-${String(endDay).padStart(2, '0')}`;
    
    return { minDate: min, maxDate: max };
  }, [bulanAktif]);

  const resetHalamanKeSatu = () => {
    setPage(1);
  };

  useEffect(() => {
    setFilterTglKonsul("");
    setFilterNama("");
    setFilterKelasKonsul("");
    setFilterMapel("");
    setFilterPengajar("");
    resetHalamanKeSatu();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulanAktif]);

  const resetFilter = () => {
    setFilterTglKonsul("");
    setFilterMapel("");
    setFilterNama("");
    setFilterKelasKonsul(""); 
    setFilterPengajar("");
    resetHalamanKeSatu(); 
  };

  const riwayatBulanIni = useMemo(() => {
    return dataRiwayat.filter(r => {
      const tglStr = timeHelper.getTglJakarta(r.waktuMulai);
      return tglStr >= minDate && tglStr <= maxDate;
    });
  }, [dataRiwayat, minDate, maxDate]);

  const riwayatKonsulGabungan = useMemo(() => {
    const konsulMurni = riwayatBulanIni.filter(r => r.jenisSesi === TIPE_SESI.KONSUL);

    const konsulExtra = riwayatBulanIni
      .filter(r => r.jenisSesi === TIPE_SESI.KELAS && r.konsulExtraMenit > 0 && r.waktuSelesai)
      .map(r => {
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

    const gabungan = [...konsulMurni, ...konsulExtra];
    return gabungan.sort((a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai));
  }, [riwayatBulanIni]);

  const getGuruLabel = useCallback((sesi) => {
    const isExtra = sesi._id.toString().includes("_extra");
    let labelPendamping = "Belajar Mandiri";
    
    if (isExtra) {
      let jadwalTerkait = null;
      if (sesi.jadwalId) {
        const idJadwalBiasa = typeof sesi.jadwalId === 'object' ? sesi.jadwalId?._id : sesi.jadwalId;
        jadwalTerkait = dataJadwal.find(j => j._id === idJadwalBiasa);
      }
      if (!jadwalTerkait) {
        const tglSesi = timeHelper.getTglJakarta(sesi.waktuMulai);
        const mapelAsli = sesi.namaMapel ? sesi.namaMapel.replace(" (Extra)", "").trim() : "";
        jadwalTerkait = dataJadwal.find(j => 
          j.tanggal === tglSesi && 
          j.kelasTarget === sesi.siswaId?.kelas && 
          j.mapel === mapelAsli
        );
      }
      const kodeGuruExtra = jadwalTerkait?.pengajarId?.kodePengajar || jadwalTerkait?.kodePengajar;
      labelPendamping = kodeGuruExtra ? `${kodeGuruExtra}` : "Guru Kelas";
      
    } else if (sesi.pengajarPendamping) {
      if (typeof sesi.pengajarPendamping === 'object') {
         const kode = sesi.pengajarPendamping.kodePengajar || sesi.pengajarPendamping.nama || "Guru";
         labelPendamping = `${kode}`;
      } else {
         labelPendamping = `ID: ${sesi.pengajarPendamping.substring(0, 4)}...`;
      }
    }
    return labelPendamping;
  }, [dataJadwal]);
  
  const opsiPengajar = useMemo(() => {
    const semuaGuru = riwayatKonsulGabungan.map(s => getGuruLabel(s));
    const unik = [...new Set(semuaGuru)].filter(g => g !== "Belajar Mandiri");
    return unik.sort();
  }, [riwayatKonsulGabungan, getGuruLabel]);

  const riwayatKonsulDifilter = useMemo(() => {
    let riwayat = riwayatKonsulGabungan.filter(s => s.siswaId?.status !== STATUS_USER.NONAKTIF);
    
    if (filterTglKonsul) {
      riwayat = riwayat.filter(s => timeHelper.getTglJakarta(s.waktuMulai) === filterTglKonsul);
    }
    if (filterKelasKonsul) {
      riwayat = riwayat.filter(s => s.siswaId?.kelas === filterKelasKonsul);
    }
    if (filterMapel) {
      riwayat = riwayat.filter(s => (s.namaMapel || "").includes(filterMapel));
    }
    if (filterNama) {
      const kataKunci = filterNama.toLowerCase();
      riwayat = riwayat.filter(s => (s.siswaId?.nama || "").toLowerCase().includes(kataKunci));
    }
    if (filterPengajar) {
      riwayat = riwayat.filter(s => getGuruLabel(s) === filterPengajar);
    }
    
    return riwayat;
  }, [riwayatKonsulGabungan, filterTglKonsul, filterMapel, filterNama, filterKelasKonsul, filterPengajar, getGuruLabel]);

  //  FIX: Logika Penghitung Total Durasi
  const totalDurasi = useMemo(() => {
    let totalMenit = 0;
    riwayatKonsulDifilter.forEach(sesi => {
      if (sesi.status === STATUS_SESI.SELESAI.id && sesi.waktuMulai && sesi.waktuSelesai) {
        const mulai = new Date(sesi.waktuMulai).getTime();
        const selesai = new Date(sesi.waktuSelesai).getTime();
        totalMenit += Math.max(0, Math.round((selesai - mulai) / 60000));
      }
    });

    const jam = Math.floor(totalMenit / 60);
    const menit = totalMenit % 60;
    return { jam, menit };
  }, [riwayatKonsulDifilter]);

  const { totalPage, dataTerpotong: dataHalIni } = formatHelper.potongDataPagination(riwayatKonsulDifilter, page, ITEMS_PER_PAGE);

  const handlePaksaHenti = async (idSesi, namaSiswa) => {
    const pilihan = window.confirm(
      `Paksa hentikan sesi konsul ${namaSiswa}?\n\n[OK] = Beri 30 Menit (Kasian)\n[Cancel] = Set 0 Menit (HUKUMAN PINALTI)`
    );
    
    const durasi = pilihan ? 30 : 0;
    const labelTindakan = durasi === 0 ? "PINALTI (0 Menit)" : "SELESAI (30 Menit)";
    
    const konfirmasiLagi = window.confirm(`Konfirmasi final: Set status sesi ini menjadi ${labelTindakan}?`);
    if (!konfirmasiLagi) return;

    const hasil = await paksaHentikanSesi(idSesi, durasi);
    if (hasil.ok) {
      alert(hasil.pesan);
      router.refresh(); 
    } else {
      alert(hasil.pesan);
    }
  };

  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahMonitoring}`}>
      
      {/*  FIX: Menambahkan Kotak Total Durasi di samping Tombol Unduh */}
      <div className={styles.headerTabWrapper} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}>Monitoring Konsul & Extra</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Kotak Info Durasi */}
          <div className={styles.btnExcel} style={{backgroundColor: '#dbeafe'}}>
            <FaClock size={16} />
            <span>
              Total: {totalDurasi.jam > 0 ? `${totalDurasi.jam}j ` : ""}{totalDurasi.menit}m
            </span>
          </div>

          <button onClick={() => unduhExcel(riwayatKonsulDifilter, "konsul")} className={styles.btnExcel}>
            <FaFileExcel /> Unduh Excel ({riwayatKonsulDifilter.length})
          </button>
        </div>
      </div>
      
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaFilter color="#111827" size={18} style={{marginRight: '8px'}} />
          <span className={styles.labelFilter}>Filter:</span>
        </div>
        
        <div className={styles.wadahCari} style={{ minWidth: '180px' }}>
          <div className={styles.iconCari}><FaMagnifyingGlass color="#6b7280" /></div>
          <input 
            type="text" 
            placeholder="Cari Nama..." 
            value={filterNama} 
            onChange={(e) => {
              setFilterNama(e.target.value);
              resetHalamanKeSatu();
            }} 
            className={styles.inputCari} 
          />
        </div>
        
        <FilterInput 
          type="date" 
          value={filterTglKonsul} 
          onChange={(e) => {
            setFilterTglKonsul(e.target.value);
            resetHalamanKeSatu();
          }} 
          min={minDate} 
          max={maxDate} 
        />
        
        <select 
          value={filterKelasKonsul} 
          onChange={(e) => {
            setFilterKelasKonsul(e.target.value);
            resetHalamanKeSatu();
          }} 
          className={styles.filterSelectMurni}
        >
          <option value="">Semua Kelas</option>
          {OPSI_KELAS.map(opsi => <option key={opsi} value={opsi}>{opsi}</option>)}
        </select>

        <select 
          value={filterMapel} 
          onChange={(e) => {
            setFilterMapel(e.target.value);
            resetHalamanKeSatu();
          }} 
          className={styles.filterSelectMurni}
        >
          <option value="">Semua Mapel</option>
          {OPSI_MAPEL_KONSUL.map(opsi => <option key={opsi} value={opsi}>{opsi}</option>)}
        </select>

        <select 
          value={filterPengajar} 
          onChange={(e) => {
            setFilterPengajar(e.target.value);
            resetHalamanKeSatu();
          }} 
          className={styles.filterSelectMurni}
        >
          <option value="">Semua Guru</option>
          <option value="Belajar Mandiri">Belajar Mandiri</option>
          {opsiPengajar.map(opsi => <option key={opsi} value={opsi}> {opsi}</option>)}
        </select>

        <button onClick={resetFilter} className={styles.btnReset}>Reset</button>
      </div>

      <div className={styles.wadahTabel}>
        <table className={styles.tabelStyle}>
          <thead>
            <tr>
              <th>Nama & Kelas</th>
              <th>Mata Pelajaran</th>
              <th>Pendamping</th>
              <th>Waktu Konsul</th>
              <th style={{textAlign: 'center'}}>Durasi</th>
              <th style={{textAlign: 'center'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {dataHalIni.length === 0 ? (
              <tr><td colSpan="6" className={styles.selKosong}>Tidak ada data konsul di bulan ini.</td></tr>
            ) : (
              dataHalIni.map(sesi => {
                const isBerjalan = sesi.status === STATUS_SESI.BERJALAN.id;
                const isPinalti = sesi.status === STATUS_SESI.PINALTI?.id;
                const isExtra = sesi._id.toString().includes("_extra");

                const labelPendamping = getGuruLabel(sesi);

                return (
                  <tr key={sesi._id}>
                    <td>
                      <p className={styles.teksNama}>{sesi.siswaId ? sesi.siswaId.nama : <span className={styles.teksErrorItalic}>Siswa Dihapus</span>}</p>
                      <p className={styles.teksKelas}>{sesi.siswaId ? sesi.siswaId.kelas : "-"}</p>
                    </td>
                    
                    <td><span className={styles.badgeMapelAbu}>{sesi.namaMapel || "Bebas"}</span></td>
                    
                    <td>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: '900', 
                        color: sesi.pengajarPendamping || isExtra ? '#2563eb' : '#64748b' 
                      }}>
                        {labelPendamping !== "Belajar Mandiri" ? `${labelPendamping}` : "Belajar Mandiri"}
                      </span>
                    </td>
                    
                    <td>
                      <p className={styles.teksTanggal}>{timeHelper.formatTanggalLengkap(sesi.waktuMulai)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className={styles.teksJamPudar}>{timeHelper.formatJam(sesi.waktuMulai)}</span>
                        <span className={styles.teksJamPudar}>-</span>
                        <span className={styles.teksJamPudar}>{sesi.waktuSelesai ? timeHelper.formatJam(sesi.waktuSelesai) : "Sekarang"}</span>
                      </div>
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      <span className={styles.teksJam}>
                        {sesi.waktuSelesai ? `${timeHelper.hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)}m` : "-"}
                      </span>
                    </td>
                    
                    <td style={{textAlign: 'center'}}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        
                        {isPinalti ? (
                           <span style={{
                             backgroundColor: '#111827', color: '#ef4444', 
                             border: '2px solid #ef4444', borderRadius: '4px',
                             padding: '4px 8px', fontSize: '11px', fontWeight: 'bold'
                           }}>
                             PINALTI LUPA SCAN
                           </span>
                        ) : (
                           <span 
                            className={`${styles.badgeStatus} ${sesi.status === STATUS_SESI.SELESAI.id ? styles.statusSelesai : styles.statusBerjalan}`}
                            style={isBerjalan ? { animation: 'brutalPulse 2s infinite' } : {}}
                          >
                            {isExtra ? "EXTRA" : (sesi.status === STATUS_SESI.SELESAI.id ? STATUS_SESI.SELESAI.label : STATUS_SESI.BERJALAN.label)}
                          </span>
                        )}

                        {isBerjalan && !isExtra && (
                          <button 
                            onClick={() => handlePaksaHenti(sesi._id, sesi.siswaId?.nama)}
                            style={{ 
                              fontSize: '10px', padding: '4px 8px', backgroundColor: '#ef4444', 
                              color: 'white', border: '2px solid #111827', borderRadius: '4px',
                              fontWeight: 'bold', cursor: 'pointer', boxShadow: '1px 1px 0 #111827'
                            }}
                          >
                            STOP MANUAL
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <PaginationBar totalPages={totalPage} currentPage={page} onPageChange={setPage} />
      </div>
    </div>
  );
}