"use client";

import { memo } from "react";
import { FaCalendarDays, FaClock } from "react-icons/fa6";

// 🚀 PATH ABSOLUTE
import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";

const JadwalMendatang = memo(({ jadwalMendatang }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle} style={{ color: '#4b5563' }}>
      <FaCalendarDays color="#64748b" /> Jadwal Mendatang
    </h3>
    
    {jadwalMendatang.length === 0 ? (
      <p className={styles.emptySchedule} style={{ backgroundColor: 'transparent', border: '2px dashed #cbd5e1' }}>
        Belum ada jadwal kelas untuk hari-hari berikutnya.
      </p>
    ) : (
      <div className={styles.scheduleList}>
        {jadwalMendatang.map((j) => (
          <div 
            key={j._id} 
            className={styles.scheduleCard} 
            style={{ 
              backgroundColor: '#f8fafc', 
              border: '2px solid #cbd5e1', 
              boxShadow: 'none', 
              opacity: 0.85 
            }}
          >
            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleDate} style={{ backgroundColor: '#e2e8f0', color: '#4b5563', border: '2px solid #cbd5e1' }}>
                {new Date(j.tanggal).toLocaleDateString('id-ID', { timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <div className={styles.scheduleTime} style={{ color: '#64748b', borderColor: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaClock /> {j.jamMulai} - {j.jamSelesai}
              </div>
            </div>

            <div className={styles.scheduleCardRow}>
              <p className={styles.scheduleSubject} style={{ fontSize: '16px', color: '#334155' }}>{j.mapel}</p>
            </div>

            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleCount} style={{ backgroundColor: '#94a3b8', border: '2px solid #64748b', fontSize: '12px' }}>
                {j.kelasTarget}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

JadwalMendatang.displayName = "JadwalMendatang";
export default JadwalMendatang;