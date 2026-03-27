"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useMemo, useState } from "react";
import Image from "next/image";

import { pilahJadwalSiswa } from "../../utils/kalkulatorData";
import { PERIODE_BELAJAR, STATUS_SESI } from "../../utils/constants"; 

import { 
  FaClipboardCheck, FaUserTie, FaXmark, FaCheck, 
  FaTriangleExclamation, FaStopwatch, FaArrowsRotate, 
  FaImages, FaMagnifyingGlassPlus, FaBookBookmark
} from "react-icons/fa6";
import styles from "../StudentApp.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KELAS SISWA)
// ============================================================================
export default function TabKelas({ jadwal = [], riwayat = [] }) {
  // 🚀 STATE UNTUK MODAL FOTO PAPAN TULIS
  const [galeriAktif, setGaleriAktif] = useState(null);
  
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

  // 🚀 HANDLER BUKA GALERI (DIUPGRADE: Menangkap Bab & Sub-Bab)
  const klikBukaCatatan = (jadwalItem) => {
    if (jadwalItem.galeriPapan && jadwalItem.galeriPapan.length > 0) {
      setGaleriAktif({
        mapel: jadwalItem.mapel,
        tanggal: jadwalItem.tanggal,
        foto: jadwalItem.galeriPapan,
        bab: jadwalItem.bab,          // 👈 Tambahan
        subBab: jadwalItem.subBab     // 👈 Tambahan
      });
    } else {
      alert("Pengajar belum mengunggah foto papan tulis untuk sesi ini.");
    }
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
      {/* DAFTAR RIWAYAT KELAS */}
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
            {jadwalSelesai.map(({ item: j, sesiTerkait }) => {
              const adaFoto = j.galeriPapan && j.galeriPapan.length > 0;
              
              return (
                <div 
                  key={j._id} 
                  className={styles.scheduleCard}
                  onClick={() => klikBukaCatatan(j)}
                  style={{ cursor: 'pointer', position: 'relative' }} // Jadikan kursor pointer
                >   
                  <div className={styles.scheduleCardRow}>
                    <div className={styles.scheduleDate}>
                      {new Date(j.tanggal).toLocaleDateString('id-ID', { 
                        timeZone: PERIODE_BELAJAR.TIMEZONE,
                        weekday: 'long', day: 'numeric', month: 'short'
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

                  <div className={styles.presenceArea} style={{ marginTop: '12px' }}>
                    <div className={styles.badgesContainer}>
                      {renderBadgeKehadiran(sesiTerkait)}
                    </div>
                  </div>

                  {/* 🚀 INDIKATOR ADA FOTO PAPAN */}
                  {adaFoto && (
                    <div style={{ marginTop: '12px', background: '#dcfce3', padding: '10px', border: '3px solid #111827', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '900', fontSize: '11px', color: '#15803d', textTransform: 'uppercase', boxShadow: '2px 2px 0 #111827' }}>
                      <FaImages size={16} /> LIHAT CATATAN PAPAN (KLIK)
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 🚀 MODAL POP-UP GALERI FOTO PAPAN (NEO-BRUTALISM) */}
      {/* ------------------------------------------------------------- */}
      {galeriAktif && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(17, 24, 39, 0.8)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px',
          backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ 
            background: '#fdfbf7', border: '4px solid #111827', borderRadius: '16px', 
            width: '100%', maxWidth: '448px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '8px 8px 0 #facc15', animation: 'slideUp 0.3s ease-out' 
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '4px solid #111827', background: '#2563eb', borderRadius: '12px 12px 0 0' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase', color: 'white', fontSize: '16px' }}>
                  CATATAN {galeriAktif.mapel}
                </h3>
                <span style={{ fontSize: '11px', color: '#fef08a', fontWeight: '800' }}>
                  {new Date(galeriAktif.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              
              <button 
                onClick={() => setGaleriAktif(null)} 
                style={{ 
                  background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '8px', 
                  width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '3px 3px 0 #111827' 
                }}
              >
                <FaXmark size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable Content) */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 🚀 BARU: INFO BAB & SUBBAB MATERI */}
              {(galeriAktif.bab || galeriAktif.subBab) && (
                <div style={{ background: '#fef08a', border: '3px solid #111827', borderRadius: '12px', padding: '16px', boxShadow: '4px 4px 0 #111827', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ marginTop: '4px', color: '#111827' }}><FaBookBookmark size={20} /></div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                        {galeriAktif.bab || 'Materi Kelas'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#4b5563', lineHeight: '1.4' }}>
                        {galeriAktif.subBab || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* LIST FOTO */}
              {galeriAktif.foto.map((urlFoto, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img 
                    src={urlFoto} 
                    alt={`Catatan Papan ${idx + 1}`} 
                    style={{ width: '100%', borderRadius: '12px', border: '4px solid #111827', background: '#e5e7eb', minHeight: '150px', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#facc15', border: '3px solid #111827', borderRadius: '8px', padding: '4px 10px', fontWeight: '900', fontSize: '12px', boxShadow: '2px 2px 0 #111827' }}>
                    <FaMagnifyingGlassPlus /> {idx + 1} / {galeriAktif.foto.length}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}