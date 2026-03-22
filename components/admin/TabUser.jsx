"use client";

import { useState } from "react";
import TabSiswa from "./TabSiswa";
import TabGuru from "./TabGuru";

// 👈 Import Konstanta Peran
import { PERAN } from "../../utils/constants";

import styles from "../../app/admin/AdminPage.module.css";
import { FaUserGraduate, FaChalkboardUser } from "react-icons/fa6";

export default function TabUser({ dataSiswa, dataGuru, muatData }) {
  // --- STATE DONGLE (Zero Hardcode menggunakan PERAN) ---
  const [subView, setSubView] = useState(PERAN.SISWA.id); 

  return (
    <div className={styles.isiTab} style={{ padding: '24px' }}>
      
      {/* 🎚️ DONGLE USER SWITCHER (Neo-Brutalism Style) */}
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
          onClick={() => setSubView(PERAN.SISWA.id)}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === PERAN.SISWA.id ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === PERAN.SISWA.id ? '#facc15' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === PERAN.SISWA.id ? '4px 4px 0 #111827' : 'none',
            transform: subView === PERAN.SISWA.id ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaUserGraduate size={20} /> DATABASE {PERAN.SISWA.label.toUpperCase()}
        </button>

        <button 
          onClick={() => setSubView(PERAN.PENGAJAR.id)}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === PERAN.PENGAJAR.id ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === PERAN.PENGAJAR.id ? '#2563eb' : 'transparent',
            color: subView === PERAN.PENGAJAR.id ? 'white' : '#111827',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === PERAN.PENGAJAR.id ? '4px 4px 0 #111827' : 'none',
            transform: subView === PERAN.PENGAJAR.id ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaChalkboardUser size={20} /> DATABASE {PERAN.PENGAJAR.label.toUpperCase()}
        </button>
      </div>

      {/* 📦 AREA KONTEN (Animasi Fade In) */}
      <div key={subView} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {subView === PERAN.SISWA.id ? (
          <TabSiswa 
            dataSiswa={dataSiswa} 
            muatData={muatData} 
          />
        ) : (
          <TabGuru 
            dataGuru={dataGuru} 
            muatData={muatData} 
          />
        )}
      </div>

    </div>
  );
}