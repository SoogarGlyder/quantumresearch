"use client";

import { useState, useMemo, useEffect, memo } from "react";
import { FaCalendarCheck, FaCheckDouble, FaCircleExclamation } from "react-icons/fa6";
import { timeHelper } from "@/utils/timeHelper";
import { LIMIT_DATA, PERIODE_BELAJAR } from "@/utils/constants";
import { potongDataPagination } from "@/utils/formatHelper"; 
import PaginationBar from "@/components/ui/PaginationBar";
import styles from "@/components/App.module.css";

import FilterJurnal from "./FilterJurnal"; 
import ModalJurnal from "./ModalJurnal"; 

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

const CardJadwal = memo(({ j, onPilihJadwal }) => {
  const isTerisi = !!j.bab;
  return (
    <div 
      className={styles.scheduleCard} 
      onClick={() => onPilihJadwal(j)} 
      style={{ backgroundColor: isTerisi ? '#ffffff' : '#ffffe0', border: '3px solid #111827', cursor: 'pointer' }}
    >
      <div className={styles.scheduleCardRow}>
        <div className={styles.scheduleDate} style={{ color: isTerisi ? '#15803d' : '#b45309' }}>
          {isTerisi ? <FaCheckDouble /> : <FaCircleExclamation />} {new Date(j.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
        <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
      </div>
      <div className={styles.scheduleCardRow}><p className={styles.scheduleSubject}>{j.mapel}</p></div>
      <div className={styles.scheduleCardRow}>
        <div className={styles.scheduleInfoBox} style={{ background: isTerisi ? '#15803d' : '#ef4444', border: '2px solid #111827', padding: '4px 10px' }}>
          <span className={styles.scheduleInfo} style={{ color: 'white', fontSize: '10px', fontWeight: '900' }}>
            {isTerisi ? 'JURNAL TERISI' : 'BELUM ISI JURNAL'}
          </span>
        </div>
        <div className={styles.scheduleCount} style={{ fontWeight: '900' }}>{j.kelasTarget}</div>
      </div>
    </div>
  );
});
CardJadwal.displayName = "CardJadwal";

export default function DaftarKelas({ jadwal = [], hariIniMurni }) {
  const hariIniString = timeHelper.getTglJakarta(); 
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KELAS || 10;

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const jadwalDitampilkan = useMemo(() => {
    let arsip = (jadwal || []).filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      const awalPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.MULAI);
      const akhirPeriodeMurni = getNormalizeDate(PERIODE_BELAJAR.AKHIR);

      const isMasaLalu = tglJadwalMurni < hariIniMurni;
      const isHariIniSudahSelesai = tglJadwalMurni === hariIniMurni && !!j.bab;
      const masukPeriode = tglJadwalMurni >= awalPeriodeMurni && tglJadwalMurni <= akhirPeriodeMurni;
      
      return masukPeriode && (isMasaLalu || isHariIniSudahSelesai);
    });

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

    return arsip.sort((a, b) => getNormalizeDate(b.tanggal) - getNormalizeDate(a.tanggal));

  }, [jadwal, hariIniMurni, searchQuery]);

  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(jadwalDitampilkan, page, ITEMS_PER_PAGE);

  return (
    <>
      {/*  FIX: Lempar text placeholder kustom untuk Kelas */}
      <FilterJurnal 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        placeholder="Cari mapel, kelas, tanggal, atau status..."
      />
      
      <div className={styles.contentContainer}>
        <h3 className={styles.contentTitle}>
          <FaCalendarCheck color="#10b981" /> Daftar Riwayat & Revisi
        </h3>
        
        {(!dataHalIni || dataHalIni.length === 0) ? (
          <div className={styles.emptySchedule} style={{ padding: '40px 20px' }}>
            <p style={{ fontSize: '30px', margin: 0 }}>📂</p>
            <p style={{ fontWeight: '800', marginTop: '12px' }}>BELUM ADA ARSIP JURNAL.</p>
            <p style={{ fontSize: '11px', color: '#64748b' }}>Selesaikan kelas di Beranda untuk memindahkannya ke sini.</p>
          </div>
        ) : (
          <>
            <div className={styles.scheduleList}>
              {dataHalIni.map((j) => (
                <CardJadwal key={j._id} j={j} onPilihJadwal={setJadwalTerpilih} />
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <PaginationBar 
                currentPage={page} 
                totalPages={totalPage} 
                onPageChange={setPage} 
                style={{ justifyContent: 'space-evenly', width: '100%', margin: '0 16px'}} 
              />
            </div>
          </>
        )}
      </div>

      {jadwalTerpilih && (
        <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIniString} onClose={() => setJadwalTerpilih(null)} />
      )}
    </>
  );
}