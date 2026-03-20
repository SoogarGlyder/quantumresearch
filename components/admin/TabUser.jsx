"use client";

import { useState } from "react";
import TabSiswa from "./TabSiswa";
import TabGuru from "./TabGuru";

import styles from "../../app/admin/AdminPage.module.css";
import { FaUserGraduation, FaChalkboardUser } from "react-icons/fa6";

export default function TabUser({ dataSiswa, dataGuru, muatData }) {
  // --- STATE DONGLE ---
  const [subView, setSubView] = useState("siswa"); // "siswa" atau "guru"

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
          onClick={() => setSubView("siswa")}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === "siswa" ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === "siswa" ? '#facc15' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === "siswa" ? '4px 4px 0 #111827' : 'none',
            transform: subView === "siswa" ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaChalkboardUser size={20} /> DATABASE SISWA
        </button>

        <button 
          onClick={() => setSubView("guru")}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === "guru" ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === "guru" ? '#2563eb' : 'transparent', // Biru untuk Guru
            color: subView === "guru" ? 'white' : '#111827',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === "guru" ? '4px 4px 0 #111827' : 'none',
            transform: subView === "guru" ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaChalkboardUser size={20} /> DATABASE GURU
        </button>
      </div>

      {/* 📦 AREA KONTEN (Animasi Fade In) */}
      <div key={subView} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {subView === "siswa" ? (
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