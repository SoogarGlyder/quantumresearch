"use client";

import { memo } from "react";
import { FaLock, FaCirclePlay, FaGamepad } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const QuizHariIni = memo(({ kuisHariIni, riwayatSesiIni, onBukaKuis }) => {
  
  // 🚀 JIKA KOSONG ATAU SUDAH SELESAI, TAMPILKAN EMPTY STATE DI HOME
  if (!kuisHariIni || kuisHariIni.isSudahDikerjakan) {
    return (
      <div className={styles.contentContainer}>
        <h3 className={styles.contentTitle}><FaGamepad color="#2563eb" /> Daftar Pre-Test</h3>
        <p className={styles.emptySchedule}>Yeay! Tidak ada Pre-Test untukmu saat ini.</p>
      </div>
    );
  }

  const isSudahScanIn = riwayatSesiIni && riwayatSesiIni.waktuMulai;

  // 🚀 TAMPILAN AKTIF (BELUM DIKERJAKAN), STYLE MENGIKUTI LATIHAN HARI INI
  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}><FaGamepad color="#2563eb" /> Pre-Test Aktif</h3>
      <div className={styles.missionList}>
        <div 
          className={styles.missionCard} 
          style={{ cursor: isSudahScanIn ? 'pointer' : 'not-allowed', padding: '0', overflow: 'hidden', opacity: isSudahScanIn ? 1 : 0.7 }}
          onClick={isSudahScanIn ? () => onBukaKuis(kuisHariIni) : undefined}
        >
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: isSudahScanIn ? '#eff6ff' : '#f1f5f9', padding: '10px', borderRadius: '8px', color: isSudahScanIn ? '#2563eb' : '#64748b' }}>
                  <FaGamepad size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: isSudahScanIn ? '#111827' : '#475569' }}>
                    {kuisHariIni.mapel} - {kuisHariIni.bab || "Pre-Test"}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Jumlah Soal: {kuisHariIni.jumlahSoal || 0} Butir
                  </span>
                </div>
              </div>
            </div>
            
            {isSudahScanIn ? (
              <button style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
                Kerjakan Sekarang <FaCirclePlay size={12} />
              </button>
            ) : (
              <button disabled style={{ backgroundColor: '#e2e8f0', color: '#94a3b8', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%' }}>
                <FaLock size={12} /> Scan Masuk Dulu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

QuizHariIni.displayName = "QuizHariIni";
export default QuizHariIni;