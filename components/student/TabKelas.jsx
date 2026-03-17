// File: components/student/TabKelas.jsx
"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useMemo } from "react";
import Image from "next/image";

import { pilahJadwalSiswa } from "../../utils/kalkulatorData";
import { PERIODE_BELAJAR } from "../../utils/constants";

import { FaClipboardCheck, FaUserTie } from "react-icons/fa6";
import styles from "../StudentApp.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB KELAS SISWA)
// ============================================================================
export default function TabKelas({ jadwal = [], riwayat = [] }) {
  
  // --- LOGIKA: AMBIL JADWAL YANG SUDAH LEWAT/SELESAI ---
  const { jadwalSelesai } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);

  // --- HELPER RENDER: BADGE KEHADIRAN ---
  const renderBadgeKehadiran = (sesiTerkait) => {
    if (!sesiTerkait) {
      return <span className={`${styles.badgeKehadiran} ${styles.badgeAlpa}`}>❌ Tidak Hadir</span>;
    }

    if (sesiTerkait.status.includes('Tidak Hadir')) {
      return <span className={`${styles.badgeKehadiran} ${styles.badgeAlpa}`}>❌ {sesiTerkait.status}</span>;
    }

    if (sesiTerkait.status === 'Selesai') {
      return (
        <>
          <span className={`${styles.badgeKehadiran} ${styles.badgeHadir}`}>✔️ Hadir</span>
          {sesiTerkait.terlambatMenit > 0 && <span className={`${styles.badgeKehadiran} ${styles.badgeTelat}`}>⚠️ Telat {sesiTerkait.terlambatMenit}m</span>}
          {sesiTerkait.konsulExtraMenit > 0 && <span className={`${styles.badgeKehadiran} ${styles.badgeExtra}`}>⏱️ +{sesiTerkait.konsulExtraMenit}m Extra</span>}
        </>
      );
    }

    return <span className={`${styles.badgeKehadiran} ${styles.badgeBerjalan}`}>🔄 Sedang Kelas</span>;
  };

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={styles.areaKonten} style={{ padding: 0, paddingBottom: '32px' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER HALAMAN */}
      {/* ------------------------------------------------------------- */}
      <div className={`${styles.headerHalaman} ${styles.stickyTop}`}>
        <div className={styles.hiasanBulat1}></div>
        <div className={styles.hiasanBulat2}></div>
        <div className={styles.wadahLogoTengah}>
          <div className={styles.kotakLogo}>
            <Image src="/logo-qr-panjang.png" alt="Logo Quantum" width={1000} height={40} className={styles.logoScannerPudar} priority />
          </div>
        </div>
        <h1 className={styles.judulHalaman}>Absen Kelas</h1>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DAFTAR RIWAYAT KELAS (DIUPDATE DENGAN DATA GURU) */}
      {/* ------------------------------------------------------------- */}
      <div style={{ padding: '0 24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '32px', marginBottom: '16px' }}>
          <h3 className={styles.judulJadwal} style={{ margin: 0 }}>
            <FaClipboardCheck color="#15803d" /> Riwayat Kehadiran
          </h3>
        </div>

        {jadwalSelesai.length === 0 ? (
          <p className={styles.jadwalKosong} style={{ margin: 0 }}>
            Belum ada riwayat kelas pada periode ini.
          </p>
        ) : (
          <div className={styles.wadahDaftarJadwal} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jadwalSelesai.map(({ item: j, sesiTerkait }) => (
              
              // 👇 KARTU RIWAYAT JADWAL NEO-BRUTALISM DIPERBARUI 👇
              <div key={j._id} className={styles.kartuJadwalPintar} style={{ opacity: 0.9, backgroundColor: '#f3f4f6', border: '3px solid #6b7280', borderRadius: '12px', padding: '0', boxShadow: '4px 4px 0 #6b7280', transition: 'transform 0.1s', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Area Utama (Diklik untuk lihat foto papan - Fitur Mendatang) */}
                <div 
                  className={styles.areaKlikJadwal}
                  style={{ backgroundColor: 'transparent', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                  onClick={() => alert("Galeri foto papan tulis sedang dalam pengembangan! 📸\nNantikan fitur ini segera.")}
                >
                  
                  {/* Baris Atas: Tanggal & Pertemuan */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#4b5563', backgroundColor: '#e5e7eb', padding: '4px 8px', borderRadius: '6px', border: '2px solid #9ca3af', textTransform: 'uppercase' }}>
                      {new Date(j.tanggal).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                    
                    {j.pertemuan && (
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#111827', backgroundColor: '#93c5fd', padding: '4px 8px', borderRadius: '6px', border: '2px solid #3b82f6', textTransform: 'uppercase' }}>
                        P-{j.pertemuan}
                      </div>
                    )}
                  </div>
                  
                  {/* Baris Tengah: Nama Mapel Besar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className={styles.hariJadwal} style={{ margin: 0, fontSize: '20px', color: '#374151', letterSpacing: '-0.5px' }}>{j.mapel}</p>
                    <div className={styles.waktuJadwal} style={{ margin: 0, backgroundColor: '#e5e7eb', color: '#4b5563', border: '2px solid #9ca3af', boxShadow: 'none', padding: '4px 8px' }}>
                      {j.jamMulai} - {j.jamSelesai}
                    </div>
                  </div>

                  {/* Baris Bawah: Nama Pengajar */}
                  {j.pengajar && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#6b7280', marginTop: '-4px' }}>
                      <FaUserTie color="#6b7280" size={14} /> 
                      <span>Pengajar: <span style={{ color: '#4b5563', fontWeight: '900' }}>{j.pengajar}</span></span>
                    </div>
                  )}

                </div>
                
                {/* Area Status Kehadiran (Bagian Bawah Kartu) */}
                <div className={styles.areaStatusKehadiran} style={{ backgroundColor: 'white', borderTop: '3px solid #6b7280', padding: '12px 16px' }}>
                  <div className={styles.wadahBadges} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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