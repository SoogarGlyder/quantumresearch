"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useMemo } from "react";
import Image from "next/image";

import { pilahJadwalSiswa } from "../../utils/kalkulatorData";
// 👈 Import Konstanta Lengkap
import { PERIODE_BELAJAR, STATUS_SESI } from "../../utils/constants"; 

import { FaClipboardCheck, FaUserTie, FaXmark, FaCheck, FaTriangleExclamation, FaStopwatch, FaArrowsRotate } from "react-icons/fa6";
import styles from "../StudentApp.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KELAS SISWA)
// ============================================================================
export default function TabKelas({ jadwal = [], riwayat = [] }) {
  
  const { jadwalSelesai } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);

  const renderBadgeKehadiran = (sesiTerkait) => {
    if (!sesiTerkait) {
      return <span className={`${styles.presenceBadge} ${styles.alphaBadge}`}><FaXmark />&nbsp;{STATUS_SESI.ALPA.label}</span>;
    }

    if (
      sesiTerkait.status === STATUS_SESI.TIDAK_HADIR.id || 
      sesiTerkait.status === STATUS_SESI.ALPA.id || 
      sesiTerkait.status === STATUS_SESI.SAKIT.id || 
      sesiTerkait.status === STATUS_SESI.IZIN.id
    ) {
      const labelTampil = sesiTerkait.status.charAt(0).toUpperCase() + sesiTerkait.status.slice(1);
      return <span className={`${styles.presenceBadge} ${styles.alphaBadge}`}><FaXmark />&nbsp;{labelTampil}</span>;
    }

    if (sesiTerkait.status === STATUS_SESI.SELESAI.id) {
      return (
        <>
          <span className={`${styles.presenceBadge} ${styles.attendBadge}`}><FaCheck />&nbsp;Hadir</span>
          {sesiTerkait.terlambatMenit > 0 && (
            <span className={`${styles.presenceBadge} ${styles.lateBadge}`}>
              <FaTriangleExclamation />&nbsp;Telat {sesiTerkait.terlambatMenit}m
            </span>
          )}
          {sesiTerkait.konsulExtraMenit > 0 && (
            <span className={`${styles.presenceBadge} ${styles.extraBadge}`}>
              <FaStopwatch />&nbsp;+{sesiTerkait.konsulExtraMenit}m Extra
            </span>
          )}
        </>
      );
    }

    return <span className={`${styles.presenceBadge} ${styles.ongoingBadge}`}><FaArrowsRotate />Sedang Kelas</span>;
  };

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={styles.contentArea}>
      {/* ------------------------------------------------------------- */}
      {/* HEADER HALAMAN */}
      {/* ------------------------------------------------------------- */}
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
      {/* ------------------------------------------------------------- */}
      {/* DAFTAR RIWAYAT KELAS (DIUPDATE DENGAN DATA Pengajar) */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.contentContainer}>
        <h3 className={styles.contentTitle}>
          <FaClipboardCheck color="#15803d" /> Riwayat Kehadiran
        </h3>

        {jadwalSelesai.length === 0 ? (
          <p className={styles.emptySchedule}>
            Belum ada riwayat kelas pada periode ini.
          </p>
        ) : (
          <div className={styles.scheduleList}>
            {jadwalSelesai.map(({ item: j, sesiTerkait }) => (
              <div key={j._id} className={styles.scheduleCard}
                onClick={() => alert("Galeri foto papan tulis sedang dalam pengembangan! 📸\nNantikan fitur ini segera.")}
              >   
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleDate}>
                    {new Date(j.tanggal).toLocaleDateString('id-ID', 
                      { timeZone: PERIODE_BELAJAR.TIMEZONE,
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <div className={styles.scheduleTime}>
                    {j.jamMulai} - {j.jamSelesai}
                  </div>
                </div>
                  
                <div className={styles.scheduleCardRow}>
                  {j.pertemuan && (
                    <div className={styles.scheduleCount}>
                      P-{j.pertemuan}
                    </div>
                  )}
                  <p className={styles.scheduleSubject}>
                    {j.mapel}
                  </p>
                </div>

                <div className={styles.scheduleCardRow}>
                {j.kodePengajar && (
                  <div className={styles.scheduleTeacher}>
                    <FaUserTie color="#2563eb" size={14} /> 
                    <span>Pengajar: <span className={styles.teacherName}>{j.kodePengajar}</span></span>
                  </div>
                )}
                </div>

                <div className={styles.presenceArea}>
                  <div className={styles.badgesContainer}>
                    {renderBadgeKehadiran(sesiTerkait)}
                  </div>
                </div>
              </div>

            ))}
          </div>
        )}
      </div>
    </div>
  );
}