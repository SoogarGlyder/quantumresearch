"use client";

import { memo } from "react";
import { FaBookOpen, FaPen, FaUserTie, FaLink } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const LatihanHariIni = memo(({ latihanHariIni, setUrlMitra }) => {
  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}><FaBookOpen color="#2563eb" /> Latihan Soal Hari Ini</h3>
      <div className={styles.missionList}>
      {latihanHariIni ? (  
        <div className={styles.missionCard} style={{ cursor: 'pointer', padding: '0', overflow: 'hidden' }} onClick={() => setUrlMitra(latihanHariIni.url)}>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb' }}><FaPen size={18} /></div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>{latihanHariIni.judul}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaUserTie size={10} /> {latihanHariIni.namaPembuat || "Admin Quantum"}
                  </span>
                </div>
              </div>
            </div>
            <button style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
              Kerjakan Sekarang <FaLink size={12} />
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.emptySchedule}>Yeay! Tidak ada latihan soal untuk hari ini. Ayo Konsul!</p>
      )}
      </div>
    </div>
  );
});

LatihanHariIni.displayName = "LatihanHariIni";
export default LatihanHariIni;