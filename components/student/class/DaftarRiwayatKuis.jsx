"use client";

import { memo } from "react";
import { FaCheckDouble, FaAward } from "react-icons/fa6";
import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";

const DaftarRiwayatKuis = memo(({ dataRiwayatKuis, onBukaPembahasan }) => {
  if (!dataRiwayatKuis || dataRiwayatKuis.length === 0) return null;

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaCheckDouble color="#22c55e" /> Riwayat Pre-Test
      </h3>
      
      <div className={styles.scheduleList}>
        {dataRiwayatKuis.map((kuis) => (
          <div 
            key={kuis._id} 
            className={styles.scheduleCard} 
            onClick={() => onBukaPembahasan(kuis.jadwalId)}
            style={{ 
              cursor: 'pointer', 
              border: '3px solid #22c55e', 
              backgroundColor: '#f0fdf4',
              boxShadow: '4px 4px 0 #86efac' 
            }}
          >
            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleDate} style={{ backgroundColor: '#dcfce3', color: '#166534', border: 'none' }}>
                {new Date(kuis.tanggal).toLocaleDateString('id-ID', { timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <div className={styles.scheduleTime} style={{ color: '#15803d', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaCheckDouble /> Selesai
              </div>
            </div>

            <div className={styles.scheduleCardRow}>
              <p className={styles.scheduleSubject} style={{ color: '#166534', fontWeight: '900', fontSize: '18px' }}>
                {kuis.mapel} - {kuis.bab}
              </p>
            </div>

            <div className={styles.scheduleCardRow}>
               <div style={{ backgroundColor: 'white', color: '#166534', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 LIHAT PEMBAHASAN
               </div>
               <div className={styles.scheduleCount} style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <FaAward size={14} color="#facc15" /> Skor: {kuis.skor}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

DaftarRiwayatKuis.displayName = "DaftarRiwayatKuis";
export default DaftarRiwayatKuis;