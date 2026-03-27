"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useMemo, useState } from "react";
import Image from "next/image";
import dynamic from 'next/dynamic'; // Menggunakan dynamic import untuk Zoom agar aman dari error Hydration Next.js
import 'react-medium-image-zoom/dist/styles.css';

import { pilahJadwalSiswa } from "../../utils/kalkulatorData";
import { PERIODE_BELAJAR, STATUS_SESI } from "../../utils/constants"; 

import { 
  FaUserTie, FaXmark, FaCheck, 
  FaTriangleExclamation, FaStopwatch, FaArrowsRotate, 
  FaImages, FaMagnifyingGlassPlus, FaBookBookmark
} from "react-icons/fa6";
import styles from "../StudentApp.module.css";

// Dynamic import library Zoom (SSR diset false agar hantu data-rmiz-ghost tidak muncul)
const Zoom = dynamic(() => import('react-medium-image-zoom'), { ssr: false });

// ============================================================================
// 2. MAIN COMPONENT (TAB KELAS SISWA)
// ============================================================================
export default function TabKelas({ jadwal = [], riwayat = [] }) {
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

  // 🚀 HANDLER BUKA GALERI (ALWAY OPEN MODAL)
  const klikBukaCatatan = (jadwalItem) => {
    setGaleriAktif({
      mapel: jadwalItem.mapel,
      tanggal: jadwalItem.tanggal,
      foto: jadwalItem.galeriPapan || [], // Pastikan selalu berupa array, minimal array kosong
      bab: jadwalItem.bab,
      subBab: jadwalItem.subBab
    });
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
          Klik untuk melihat foto papan
        </h3>

        {jadwalSelesai.length === 0 ? (
          <p className={styles.emptySchedule}>
            Belum ada riwayat kelas pada periode ini.
          </p>
        ) : (
          <div className={styles.scheduleList}>
            {jadwalSelesai.map(({ item: j, sesiTerkait }) => {
              return (
                <div 
                  key={j._id} 
                  className={styles.scheduleCard}
                  onClick={() => klikBukaCatatan(j)}
                  style={{ cursor: 'pointer', position: 'relative' }} 
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
        <div className={styles.wrapperGallery}>
          <div className={styles.containerGallery}> 
            <div className={styles.headerGallery}>
              <div className={styles.wrapperTitle}>
                <h3 className={styles.galleryTitle}>
                  CATATAN {galeriAktif.mapel}
                </h3>
                <span className={styles.galleryDate}>
                  {new Date(galeriAktif.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button className={styles.galleryButton}
                onClick={() => setGaleriAktif(null)}>
                <FaXmark size={20} />
              </button>
            </div>
            
            <div className={styles.areaGallery}>
              
              {/* 🚀 SELALU MUNCUL: Info Bab & Sub-bab */}
              <div className={styles.galleryInfo}>
                <div className={styles.gallerySubject}>
                  <div style={{ marginTop: '3px'}}><FaBookBookmark size={35} /></div>
                  <div>
                    <h4 style={{ marginBottom: '1px', fontSize: '16px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                      {galeriAktif.bab || 'Materi Kelas'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#4b5563', lineHeight: '1.4' }}>
                      {galeriAktif.subBab || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {galeriAktif.foto.length === 0 ? (
                <div className={styles.emptyPhoto}>
                  <FaTriangleExclamation size={50} color="#facc15" style={{ marginBottom: '16px' }} />
                  <h4 style={{ fontWeight: '900', color: '#111827', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                    Foto Tidak Tersedia
                  </h4>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563', margin: 0 }}>
                    Pengajar belum mengunggah catatan untuk sesi ini.
                  </p>
                </div>
              ) : (
                <div className={styles.containerPhoto}>
                  {galeriAktif.foto.map((urlFoto, idx) => (
                    <div className={styles.wrapperPhoto} key={idx}>
                      <Zoom>
                        <img className={styles.galleryPhoto}
                          src={urlFoto}
                          alt={`Catatan Papan ${idx + 1}`} 
                          style={{ cursor: 'zoom-in', width: '100%', display: 'block' }}
                        />
                      </Zoom>
                      <div className={styles.countPhoto}>
                        {idx + 1} / {galeriAktif.foto.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}