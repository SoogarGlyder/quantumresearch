"use client";

import { memo } from "react";
import { FaChalkboard, FaCalendarDay, FaCirclePlay } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const AgendaHariIni = memo(({ jadwalHariIni, onPilihJadwal }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaChalkboard color="#2563eb" /> Agenda Hari Ini</h3>
    
    {jadwalHariIni.length === 0 ? (
      <p className={styles.emptySchedule}>Tidak ada jadwal kelas untukmu hari ini. Ayo ajak adek-adeknya konsul!</p>
    ) : (
      <div className={styles.scheduleList}>
        {jadwalHariIni.map((j) => (
          <div 
            key={j._id} 
            onClick={() => onPilihJadwal(j)} 
            className={styles.scheduleCard} 
            style={{ backgroundColor: '#ffffff', border: '3px solid #111827', cursor: 'pointer', boxShadow: '4px 4px 0 #111827' }}
          >
            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleDate} style={{ color: '#2563eb', fontWeight: '900' }}>
                <FaCalendarDay /> HARI INI
              </div>
              <div className={styles.scheduleTime} style={{ fontWeight: '900' }}>{j.jamMulai} - {j.jamSelesai}</div>
            </div>
            <div className={styles.scheduleCardRow}>
              <p className={styles.scheduleSubject} style={{ fontSize: '18px' }}>{j.mapel}</p>
            </div>
            <div className={styles.scheduleCardRow}>
              <div style={{ backgroundColor: '#fef08a', color: '#111827', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', border: '2px solid #111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCirclePlay /> MULAI KELAS
              </div>
              <div className={styles.scheduleCount} style={{ fontWeight: '900' }}>{j.kelasTarget}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

AgendaHariIni.displayName = "AgendaHariIni";
export default AgendaHariIni;