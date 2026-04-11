"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useMemo, useState, memo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation"; 

import PaginationBar from "../ui/PaginationBar"; 
import { potongDataPagination } from "../../utils/formatHelper"; 
import { pilahJadwalSiswa } from "../../utils/kalkulatorData";
import { PERIODE_BELAJAR, STATUS_SESI, LIMIT_DATA } from "../../utils/constants"; 

// 🚀 IMPORT MODAL GALERI YANG SUDAH DIPISAH
import ModalGaleri from "./ModalGaleri";

import { 
  FaUserTie, FaXmark, FaCheck, 
  FaTriangleExclamation, FaStopwatch, FaArrowsRotate
} from "react-icons/fa6";
import styles from "../App.module.css";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER KELAS (Pure & Memoized)
// ============================================================================
const HeaderKelas = memo(() => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <h1 className={styles.headerTitle}>Absen Kelas</h1>
  </div>
));
HeaderKelas.displayName = "HeaderKelas";

// ============================================================================
// 3. SUB-KOMPONEN: BADGE KEHADIRAN (Pure & Memoized)
// ============================================================================
const BadgeKehadiran = memo(({ sesiTerkait }) => {
  if (!sesiTerkait) {
    return <span className={`${styles.presenceBadge} ${styles.alphaBadge}`}><FaXmark />&nbsp;{STATUS_SESI.ALPA.label}</span>;
  }

  if ([STATUS_SESI.TIDAK_HADIR.id, STATUS_SESI.ALPA.id, STATUS_SESI.SAKIT.id, STATUS_SESI.IZIN.id].includes(sesiTerkait.status)) {
    const labelTampil = sesiTerkait.status.charAt(0).toUpperCase() + sesiTerkait.status.slice(1);
    return <span className={`${styles.presenceBadge} ${styles.alphaBadge}`}><FaXmark />&nbsp;{labelTampil}</span>;
  }

  if (sesiTerkait.status === STATUS_SESI.SELESAI.id) {
    return (
      <>
        <span className={`${styles.presenceBadge} ${styles.attendBadge}`}><FaCheck />&nbsp;Hadir</span>
        {sesiTerkait.terlambatMenit > 0 && (
          <span className={`${styles.presenceBadge} ${styles.lateBadge}`}><FaTriangleExclamation />&nbsp;Telat {sesiTerkait.terlambatMenit}m</span>
        )}
        {sesiTerkait.konsulExtraMenit > 0 && (
          <span className={`${styles.presenceBadge} ${styles.extraBadge}`}><FaStopwatch />&nbsp;+{sesiTerkait.konsulExtraMenit}m Extra</span>
        )}
      </>
    );
  }

  return <span className={`${styles.presenceBadge} ${styles.ongoingBadge}`}><FaArrowsRotate />&nbsp;Sedang Kelas</span>;
});
BadgeKehadiran.displayName = "BadgeKehadiran";

// ============================================================================
// 4. SUB-KOMPONEN: DAFTAR RIWAYAT KELAS (Pure & Memoized)
// ============================================================================
const DaftarRiwayatKelas = memo(({ dataHalIni, onBukaCatatan }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>Klik untuk melihat foto papan</h3>

    {dataHalIni.length === 0 ? (
      <p className={styles.emptySchedule}>Belum ada riwayat kelas pada periode ini.</p>
    ) : (
      <div className={styles.scheduleList}>
        {dataHalIni.map(({ item: j, sesiTerkait }) => (
          <div key={j._id} className={styles.scheduleCard} onClick={() => onBukaCatatan(j)} style={{ cursor: 'pointer', position: 'relative' }}>   
            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleDate}>
                {new Date(j.tanggal).toLocaleDateString('id-ID', { timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
            </div>
              
            <div className={styles.scheduleCardRow}>
              <p className={styles.scheduleSubject}>{j.mapel}</p>
            </div>

            <div className={styles.scheduleCardRow}>
              {j.kodePengajar && (
                <div className={styles.scheduleTeacher}>
                  <FaUserTie color="#2563eb" size={14} /> 
                  <span>Pengajar: <span className={styles.teacherName}>{j.kodePengajar}</span></span>
                </div>
              )}
              {j.pertemuan && <div className={styles.scheduleCount}>P-{j.pertemuan}</div>}
            </div>

            <div className={styles.presenceArea} style={{ marginTop: '2px' }}>
              <div className={styles.badgesContainer}>
                <BadgeKehadiran sesiTerkait={sesiTerkait} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));
DaftarRiwayatKelas.displayName = "DaftarRiwayatKelas";

// ============================================================================
// 5. MAIN EXPORT COMPONENT
// ============================================================================
export default function TabKelas({ jadwal = [], riwayat = [] }) {
  const [galeriAktif, setGaleriAktif] = useState(null);
  const searchParams = useSearchParams();
  
  // 🛡️ Ambil halaman dari URL (Default 1)
  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KELAS || 10;
  
  // Memilah jadwal yang sudah berlalu
  const { jadwalSelesai } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);

  // 🚀 LOGIKA PAGINATION
  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(jadwalSelesai, page, ITEMS_PER_PAGE);

  // --- HANDLER ---
  const klikBukaCatatan = (jadwalItem) => {
    setGaleriAktif({
      mapel: jadwalItem.mapel,
      tanggal: jadwalItem.tanggal,
      foto: jadwalItem.galeriPapan || [], 
      bab: jadwalItem.bab,
      subBab: jadwalItem.subBab
    });
  };

  return (
    <div className={styles.contentArea}>
      
      <HeaderKelas />

      <DaftarRiwayatKelas 
        dataHalIni={dataHalIni} 
        onBukaCatatan={klikBukaCatatan} 
      />

      {/* 🚀 PAGINATION BAR */}
      <div style={{ margin: '24px 16px 0 16px' }}>
        <PaginationBar totalPages={totalPage} style={{ justifyContent: 'space-evenly'}} />
      </div>

      {/* 🚀 MODAL GALERI DIPANGGIL DI SINI */}
      <ModalGaleri 
        galeriAktif={galeriAktif} 
        onClose={() => setGaleriAktif(null)} 
      />

    </div>
  );
}