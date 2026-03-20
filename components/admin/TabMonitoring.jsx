"use client";

import { useState } from "react";
// 👇 Kita panggil kembali komponen aslinya
import TabKelas from "./TabKelas";
import TabKonsul from "./TabKonsul";

import styles from "../../app/admin/AdminPage.module.css";
import { FaChalkboardUser, FaLightbulb } from "react-icons/fa6";

export default function TabMonitoring({ dataRiwayat, dataJadwal, dataSiswa, muatData }) {
  // --- STATE DONGLE ---
  const [subView, setSubView] = useState("kelas"); // "kelas" atau "konsul"

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
          onClick={() => setSubView("kelas")}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === "kelas" ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === "kelas" ? '#facc15' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === "kelas" ? '4px 4px 0 #111827' : 'none',
            transform: subView === "kelas" ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaChalkboardUser size={20} /> ABSENSI KELAS
        </button>

        <button 
          onClick={() => setSubView("konsul")}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === "konsul" ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === "konsul" ? '#4ade80' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === "konsul" ? '4px 4px 0 #111827' : 'none',
            transform: subView === "konsul" ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaLightbulb size={20} /> KONSUL SISWA
        </button>
      </div>

      {/* 📦 AREA TAMPILAN (Animasi Fade In) */}
      <div key={subView} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {subView === "kelas" ? (
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