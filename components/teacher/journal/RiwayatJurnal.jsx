"use client";

import { memo } from "react";
import { FaCalendarCheck, FaCheckDouble, FaCircleExclamation } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const RiwayatJurnal = memo(({ jadwalArsip, onPilihJadwal }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>
      <FaCalendarCheck color="#10b981" /> Daftar Riwayat & Revisi
    </h3>
    
    {jadwalArsip.length === 0 ? (
      <div className={styles.emptySchedule} style={{ padding: '40px 20px' }}>
        <p style={{ fontSize: '30px', margin: 0 }}>📂</p>
        <p style={{ fontWeight: '800', marginTop: '12px' }}>BELUM ADA ARSIP JURNAL.</p>
        <p style={{ fontSize: '11px', color: '#64748b' }}>Selesaikan kelas di Beranda untuk memindahkannya ke sini.</p>
      </div>
    ) : (
      <div className={styles.scheduleList}>
        {jadwalArsip.map((j) => {
          const isTerisi = !!j.bab;
          return (
            <div 
              key={j._id} 
              className={styles.scheduleCard} 
              onClick={() => onPilihJadwal(j)}
              style={{ backgroundColor: isTerisi ? '#ffffff' : '#ffffe0', border: '3px solid #111827', cursor: 'pointer' }}
            >
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleDate} style={{ color: isTerisi ? '#15803d' : '#b45309' }}>
                  {isTerisi ? <FaCheckDouble /> : <FaCircleExclamation />} {new Date(j.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
              </div>

              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject}>{j.mapel}</p>
              </div>

              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleInfoBox} style={{ background: isTerisi ? '#15803d' : '#ef4444', border: '2px solid #111827', padding: '4px 10px' }}>
                  <span className={styles.scheduleInfo} style={{ color: 'white', fontSize: '10px', fontWeight: '900' }}>
                    {isTerisi ? 'JURNAL TERISI' : 'BELUM ISI JURNAL'}
                  </span>
                </div>
                <div className={styles.scheduleCount} style={{ fontWeight: '900' }}>
                  {j.kelasTarget}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
));

RiwayatJurnal.displayName = "RiwayatJurnal";
export default RiwayatJurnal;