"use client";

import { useState } from "react";
import TabKelas from "./TabKelas";
import TabKonsul from "./TabKonsul";

// 👈 Import Konstanta
import { TIPE_SESI } from "../../utils/constants";

import styles from "../../app/admin/AdminPage.module.css";
import { FaChalkboardUser, FaLightbulb } from "react-icons/fa6";

export default function TabMonitoring({ dataRiwayat, dataJadwal, dataSiswa, muatData }) {
  // --- STATE DONGLE (Zero Hardcode menggunakan TIPE_SESI) ---
  const [subView, setSubView] = useState(TIPE_SESI.KELAS); 

  return (
    <div className={styles.isiTab} style={{ padding: '24px' }}>
      
      {/* 🎚️ DONGLE SWITCHER (Neo-Brutalism Style) */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#e5e7eb', 
        padding: '8px', 
        borderRadius: '16px', 
        border: '4px solid #111827', 
        boxShadow: '4px 4px 0 #111827',
        width: 'fit-content',
        margin: '0 auto 32px auto',
        gap: '8px'
      }}>
        <button 
          onClick={() => setSubView(TIPE_SESI.KELAS)}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === TIPE_SESI.KELAS ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === TIPE_SESI.KELAS ? '#facc15' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === TIPE_SESI.KELAS ? '4px 4px 0 #111827' : 'none',
            transform: subView === TIPE_SESI.KELAS ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaChalkboardUser size={20} /> ABSENSI KELAS
        </button>

        <button 
          onClick={() => setSubView(TIPE_SESI.KONSUL)}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === TIPE_SESI.KONSUL ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === TIPE_SESI.KONSUL ? '#4ade80' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === TIPE_SESI.KONSUL ? '4px 4px 0 #111827' : 'none',
            transform: subView === TIPE_SESI.KONSUL ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaLightbulb size={20} /> KONSUL SISWA
        </button>
      </div>

      {/* 📦 AREA TAMPILAN (Animasi Fade In) */}
      <div key={subView} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {subView === TIPE_SESI.KELAS ? (
          <TabKelas 
            dataRiwayat={dataRiwayat} 
            dataJadwal={dataJadwal} 
            dataSiswa={dataSiswa} 
            muatData={muatData} 
          />
        ) : (
          <TabKonsul 
            dataRiwayat={dataRiwayat} 
          />
        )}
      </div>

    </div>
  );
}