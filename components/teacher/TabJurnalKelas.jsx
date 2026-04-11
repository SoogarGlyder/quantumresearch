"use client";

import { useState, useMemo, memo } from "react";
import Image from "next/image";
import { FaBookBookmark, FaCalendarCheck, FaClock, FaCheckDouble, FaCircleExclamation } from "react-icons/fa6";
import { timeHelper } from "../../utils/timeHelper";
import { PERIODE_BELAJAR } from "../../utils/constants";
import ModalJurnal from "./ModalJurnal"; 
import styles from "../App.module.css";

// ============================================================================
// 1. SUB-KOMPONEN: HEADER KHUSUS JURNAL
// ============================================================================
const HeaderJurnal = memo(({ totalArsip }) => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <div className={styles.identityContainer}>
      <p className={styles.welcomeText}>Administrasi Mengajar</p>
      <h1 className={styles.userName}>Arsip Jurnal</h1>
      <div className={styles.containerIdNumber}>
         <span className={styles.IdNumber}>Ditemukan {totalArsip} riwayat kelas bulan ini</span>
      </div>
    </div>
  </div>
));
HeaderJurnal.displayName = "HeaderJurnal";

// ============================================================================
// 2. SUB-KOMPONEN: DAFTAR RIWAYAT JURNAL
// ============================================================================
const DaftarRiwayatJurnal = memo(({ jadwalArsip, onPilihJadwal }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>
      <FaCalendarCheck color="#10b981" /> Daftar Riwayat & Revisi
    </h3>
    
    {jadwalArsip.length === 0 ? (
      <div className={styles.emptySchedule} style={{ padding: '40px 20px' }}>
        <p style={{ fontSize: '30px', margin: 0 }}>📂</p>
        <p style={{ fontWeight: '800', marginTop: '12px' }}>BELUM ADA ARSIP JURNAL.</p>
        <p style={{ fontSize: '11px', color: '#64748b' }}>Selesaikan kelas di Beranda untuk memindahkannya ke sini.</p>
      </div>
    ) : (
      <div className={styles.scheduleList}>
        {jadwalArsip.map((j) => {
          const isTerisi = !!j.bab;
          
          return (
            <div 
              key={j._id} 
              className={styles.scheduleCard} 
              onClick={() => onPilihJadwal(j)}
              style={{ 
                backgroundColor: isTerisi ? '#ffffff' : '#ffffe0', 
                border: '3px solid #111827',
                cursor: 'pointer'
              }}
            >
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleDate} style={{ color: isTerisi ? '#15803d' : '#b45309' }}>
                  {isTerisi ? <FaCheckDouble /> : <FaCircleExclamation />} {new Date(j.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
              </div>

              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject}>{j.mapel}</p>
              </div>

              <div className={styles.scheduleCardRow}>
                <div 
                  className={styles.scheduleInfoBox} 
                  style={{ 
                    background: isTerisi ? '#15803d' : '#ef4444', 
                    border: '2px solid #111827',
                    padding: '4px 10px'
                  }}
                >
                  <span className={styles.scheduleInfo} style={{ color: 'white', fontSize: '10px', fontWeight: '900' }}>
                    {isTerisi ? 'JURNAL TERISI' : 'BELUM ISI JURNAL'}
                  </span>
                </div>
                <div className={styles.scheduleCount} style={{ fontWeight: '900' }}>
                  {j.kelasTarget}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
));
DaftarRiwayatJurnal.displayName = "DaftarRiwayatJurnal";

// ============================================================================
// 3. MAIN COMPONENT (State & Logic)
// ============================================================================
export default function TabJurnalKelas({ dataUser, jadwal = [] }) {
  const hariIni = timeHelper.getTglJakarta();
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // 🚀 LOGIKA FILTER: Ambil kelas masa lalu ATAU kelas hari ini yang sudah ada jurnalnya (bab terisi)
  const jadwalArsip = useMemo(() => {
    return (jadwal || [])
      .filter(j => {
        const isMasaLalu = j.tanggal < hariIni;
        const isHariIniSudahSelesai = j.tanggal === hariIni && !!j.bab;
        const masukPeriode = j.tanggal >= PERIODE_BELAJAR.MULAI && j.tanggal <= PERIODE_BELAJAR.AKHIR;
        
        return masukPeriode && (isMasaLalu || isHariIniSudahSelesai);
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Urutkan: Terbaru di atas
  }, [jadwal, hariIni]);

  return (
    <div className={styles.contentArea}>
      
      <HeaderJurnal totalArsip={jadwalArsip.length} />

      <DaftarRiwayatJurnal 
        jadwalArsip={jadwalArsip} 
        onPilihJadwal={setJadwalTerpilih} 
      />

      {/* RENDER MODAL JURNAL UNTUK REVISI / LIHAT DETAIL */}
      {jadwalTerpilih && (
        <ModalJurnal 
          jadwalTerpilih={jadwalTerpilih} 
          hariIni={hariIni} 
          onClose={() => setJadwalTerpilih(null)} 
        />
      )}
      
    </div>
  );
}