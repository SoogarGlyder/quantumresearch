"use client";

import { memo } from "react";
import { FaBookOpen, FaPen, FaUserTie } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const LatihanHariIni = memo(({ latihanHariIni = [], setUrlMitra }) => {
  // Pastikan latihanHariIni selalu berupa array. Jika backend mengirim null/undefined, jadikan array kosong []
  const daftarLatihan = Array.isArray(latihanHariIni) ? latihanHariIni : (latihanHariIni ? [latihanHariIni] : []);

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaBookOpen color="#2563eb" /> Bahan Belajar Hari Ini
      </h3>
      
      <div className={styles.missionList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {daftarLatihan.length > 0 ? (
          daftarLatihan.map((latihan, index) => (
            <div 
              key={latihan._id || index} 
              className={styles.missionCard} 
              style={{ 
                cursor: 'pointer', 
                padding: '0', 
                overflow: 'hidden',
                border: '3px solid #111827', // 🚀 Sentuhan garis tegas
                boxShadow: '4px 4px 0 #111827', // 🚀 Sentuhan hard-shadow
                borderRadius: '12px'
              }} 
              onClick={() => setUrlMitra(latihan.url)}
            >
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb', border: '2px solid #2563eb' }}>
                      <FaPen size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                        {latihan.judul}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                        <FaUserTie size={12} color="#475569" /> {latihan.namaPembuat || "Admin Quantum"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.emptySchedule} style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', color: '#64748b' }}>
            Yeay! Tidak ada bahan belajar tambahan untuk hari ini. Ayo Konsul!
          </p>
        )}
      </div>
    </div>
  );
});

LatihanHariIni.displayName = "LatihanHariIni";
export default LatihanHariIni;