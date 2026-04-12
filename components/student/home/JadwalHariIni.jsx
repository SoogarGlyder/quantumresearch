"use client";

import { memo } from "react";
import { FaCalendarDays, FaUserTie } from "react-icons/fa6";
import { formatYYYYMMDD } from "@/utils/formatHelper";
import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";

const JadwalHariIni = memo(({ jadwalAktif, setTab, setModeScan, resetScanner }) => {
  const tglHariIni = formatYYYYMMDD(new Date());
  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}><FaCalendarDays color="#2563eb" /> Pengingat Kelas</h3>
      {jadwalAktif.length === 0 ? (
        <p className={styles.emptySchedule}>Yeay! Tidak ada jadwal kelas untukmu hari ini. Ayo Konsul!</p>
      ) : (
        <div className={styles.scheduleList}>
          {jadwalAktif.map(({ item: j }) => {
            const isHariIni = j.tanggal === tglHariIni;
            return (
              <div key={j._id} className={styles.scheduleCard} onClick={isHariIni ? () => { setTab("scan"); setModeScan("kelas"); resetScanner(); } : undefined} style={isHariIni ? { backgroundColor: '#ffebcd', cursor: 'pointer' } : { cursor: 'default', opacity: 0.8, pointerEvents: 'none' }}>
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleDate}>{new Date(j.tanggal).toLocaleDateString('id-ID',{ timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}</div>
                  <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
                </div>
                <div className={styles.scheduleCardRow}><p className={styles.scheduleSubject}>{j.mapel}</p></div>
                <div className={styles.scheduleCardRow}>
                  {j.kodePengajar && (<div className={styles.scheduleTeacher}><FaUserTie color="#2563eb" size={14} /> <span>Pengajar: <span className={styles.teacherName}>{j.kodePengajar}</span></span></div>)}
                  <div className={styles.scheduleCount}><span>P-{j.pertemuan}</span></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
});

JadwalHariIni.displayName = "JadwalHariIni";
export default JadwalHariIni;