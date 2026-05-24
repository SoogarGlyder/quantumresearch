"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { FaChevronDown, FaChevronUp, FaSkullCrossbones } from "react-icons/fa6";
import { getRiwayatKonsulPengajar } from "@/actions/teacherAction";
import PaginationBar from "@/components/ui/PaginationBar";
import { potongDataPagination, hitungDurasiMenit, formatJam } from "@/utils/formatHelper";
import { STATUS_SESI, PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";
import { timeHelper } from "@/utils/timeHelper";
import { formatHelper } from "@/utils/formatHelper";

import FilterKonsulGuru from "./FilterKonsulGuru"; 

// ============================================================================
// 1. SUB-COMPONENTS: KARTU KONSUL GURU
// ============================================================================
const RecordCardGuru = memo(({ sesi, isOpen, onToggle }) => {
  const isSelesai = sesi.status === STATUS_SESI.SELESAI.id;
  const isPinalti = sesi.status === STATUS_SESI.PINALTI?.id;
  const isBerjalan = sesi.status === STATUS_SESI.BERJALAN.id;

  const formatTanggalTanpaTahun = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString('id-ID', {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  };

  const namaSiswa = sesi.siswaId?.nama || "Siswa Terhapus";
  const kelasSiswa = sesi.siswaId?.kelas || "-";
  const judulKartu = `${namaSiswa} (${kelasSiswa})`;

  return (
    <div className={`${styles.recordCard} ${styles.recordCardClickable}`} onClick={() => onToggle(sesi._id)}>
      <div className={styles.recordCardRow}>
        <p className={styles.recordDate}>{formatTanggalTanpaTahun(sesi.waktuMulai)}</p>
        
        {isPinalti ? (
          <span className={styles.recordDuration} style={{ backgroundColor: '#111827', color: '#ef4444', border: '2px solid #ef4444', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <FaSkullCrossbones /> PINALTI
          </span>
        ) : (
          <span 
            className={styles.recordDuration} 
            style={{ backgroundColor: isSelesai ? '#4ade80' : '#facc15', display: isSelesai ? 'none' : 'flex', border: '2px solid #111827', color: '#111827' }}
          >
            {isBerjalan ? "Sedang Berjalan" : sesi.status.charAt(0).toUpperCase() + sesi.status.slice(1)}
          </span>
        )}

        {isSelesai && <span className={styles.recordDuration}>{timeHelper.hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)} menit</span>}
      </div>

      <div className={styles.recordCardRow}>
        <div>
          <h3 className={styles.recordTitle} style={{ fontSize: '28px' }}>{namaSiswa}</h3>
          <h3 className={styles.recordTitle} style={{ fontSize: '15px', marginTop: '0' }}>{kelasSiswa}</h3>
        </div>
        <div style={{ marginTop: 'auto', color: '#111827', transition: 'transform 0.2s' }}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className={styles.recordDetail}>
            <div className={styles.recordDetailRow} style={{ backgroundColor: '#f1f5f9'}}>
              <span>Mapel Konsul</span>
              <span style={{ fontWeight: '900', color: '#2563eb' }}>
                {sesi.namaMapel || "Umum"}
              </span>
            </div>

            <div className={styles.recordDetailRow} style={{ backgroundColor: '#dbeafe' }}>
              <span>Mulai</span>
              <span>{timeHelper.formatJam(sesi.waktuMulai)} WIB</span>
            </div>
            
            <div className={styles.recordDetailRow} style={{ backgroundColor: isSelesai ? '#dcfce3' : isPinalti ? '#fecaca' : '#fef08a' }}>
              <span>Selesai</span>
              <span>{isSelesai || isPinalti ? `${timeHelper.formatJam(sesi.waktuSelesai)} WIB` : 'Sedang Berjalan...'}</span>
            </div>
            
            {isPinalti && (
              <div style={{ backgroundColor: '#111827', color: 'white', padding: '8px', fontSize: '11px', textAlign: 'center', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px', fontWeight: 'bold' }}>
                Sesi dihentikan karena siswa lupa Scan Out! (0 Menit)
              </div>
            )}
        </div>
      )}
    </div>
  );
});

RecordCardGuru.displayName = "RecordCardGuru";

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================
export default function DaftarKonsul({ dataUser, setTotalKonsul }) {
  const [dataKonsul, setDataKonsul] = useState([]);
  
  //  FIX: State loading dihapus total
  const [filterBulan, setFilterBulan] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [idTerbuka, setIdTerbuka] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [filterBulan, filterMapel, filterKelas]);

  useEffect(() => {
    let isMounted = true;
    const fetchKonsul = async () => {
      const res = await getRiwayatKonsulPengajar();
      if (isMounted && res.sukses) {
        const listData = res.data || [];
        setDataKonsul(listData);
        if (setTotalKonsul) setTotalKonsul(listData.length); 
      }
    };
    fetchKonsul();
    return () => { isMounted = false; };
  }, [setTotalKonsul]);

  const dapatkanLabelBulan = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString('id-ID', { 
      timeZone: PERIODE_BELAJAR.TIMEZONE, 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const opsiBulan = useMemo(() => [...new Set(dataKonsul.map(r => dapatkanLabelBulan(r.waktuMulai)))], [dataKonsul]);
  
  const opsiMapel = useMemo(() => {
    const mapelBersih = dataKonsul.map(r => (r.namaMapel || "Umum").replace(" (Extra)", ""));
    return [...new Set(mapelBersih)].sort(); 
  }, [dataKonsul]);

  const opsiKelas = useMemo(() => {
    const kelasBersih = dataKonsul.map(r => r.siswaId?.kelas || "-");
    return [...new Set(kelasBersih)].sort(); 
  }, [dataKonsul]);

  const konsulDitampilkan = useMemo(() => {
    return dataKonsul.filter(k => {
      const matchBulan = filterBulan ? dapatkanLabelBulan(k.waktuMulai) === filterBulan : true;
      const namaMapelMurni = (k.namaMapel || "Umum").replace(" (Extra)", "");
      const matchMapel = filterMapel ? namaMapelMurni === filterMapel : true;
      const matchKelas = filterKelas ? (k.siswaId?.kelas || "-") === filterKelas : true;

      return matchBulan && matchMapel && matchKelas;
    });
  }, [dataKonsul, filterBulan, filterMapel, filterKelas]);

  const ringkasanFilter = useMemo(() => {
    let totalMenit = 0;
    let totalSesiSelesai = 0;

    konsulDitampilkan.forEach(sesi => {
      if (sesi.status === STATUS_SESI.SELESAI.id && sesi.waktuMulai && sesi.waktuSelesai) {
        const mulai = new Date(sesi.waktuMulai).getTime();
        const selesai = new Date(sesi.waktuSelesai).getTime();
        const durasiMenit = Math.max(0, Math.round((selesai - mulai) / 60000));
        
        totalMenit += durasiMenit;
        totalSesiSelesai += 1;
      }
    });

    const jam = Math.floor(totalMenit / 60);
    const menit = totalMenit % 60;

    return { totalMenit, jam, menit, totalSesiSelesai };
  }, [konsulDitampilkan]);

  const { totalPage, dataTerpotong: dataHalIni } = formatHelper.potongDataPagination(konsulDitampilkan, page, ITEMS_PER_PAGE);
  const toggleDetail = (id) => setIdTerbuka(prevId => prevId === id ? null : id);

  return (
    <>
      <FilterKonsulGuru 
        filterBulan={filterBulan} 
        setFilterBulan={setFilterBulan} 
        opsiBulan={opsiBulan} 
        filterMapel={filterMapel} 
        setFilterMapel={setFilterMapel} 
        opsiMapel={opsiMapel} 
        filterKelas={filterKelas}
        setFilterKelas={setFilterKelas}
        opsiKelas={opsiKelas}
        ringkasanFilter={ringkasanFilter}
      />

      <div className={styles.contentContainer} style={{ marginTop: '-24px' }}>
        {/*  FIX: Logika ternary rendering loading dihapus */}
        {dataHalIni.length === 0 ? (
          <div className={styles.emptySchedule} style={{ padding: '40px 20px' }}>
            <p style={{ fontSize: '30px', margin: 0 }}>☕</p>
            <p style={{ fontWeight: '800', marginTop: '12px' }}>BELUM ADA RIWAYAT KONSUL.</p>
            <p style={{ fontSize: '11px', color: '#64748b' }}>Siswa yang memilih Anda sebagai pendamping konsul akan muncul di sini.</p>
          </div>
        ) : (
          <>
            <div className={styles.containerRecord}>
              {dataHalIni.map(sesi => (
                <RecordCardGuru 
                  key={sesi._id} 
                  sesi={sesi} 
                  isOpen={idTerbuka === sesi._id} 
                  onToggle={toggleDetail} 
                />
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <PaginationBar currentPage={page} totalPages={totalPage} onPageChange={setPage} style={{ width: '100%', margin: '0 16px'}} />
            </div>
          </>
        )}
      </div>
    </>
  );
}