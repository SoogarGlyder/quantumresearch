"use client";

import { memo } from "react";
import { FaChalkboard, FaCalendarDay, FaCirclePlay } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/teacher/home/Home.module.css";

const AgendaHariIni = memo(({ jadwalHariIni, onPilihJadwal }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>
      <FaChalkboard className={homeStyles.ikonBiru} /> Agenda Hari Ini
    </h3>

    {jadwalHariIni.length === 0 ? (
      <p className={homeStyles.emptySchedule}>
        Tidak ada jadwal kelas hari ini. Ayo ajak siswa konsul!
      </p>
    ) : (
      <div className={homeStyles.scheduleList}>
        {jadwalHariIni.map((j) => (
          <div
            key={j._id}
            onClick={() => onPilihJadwal(j)}
            className={`${homeStyles.scheduleCard} ${homeStyles.scheduleCardHariIni}`}
          >
            <div className={homeStyles.scheduleCardRow}>
              <div className={`${homeStyles.scheduleDate} ${homeStyles.scheduleDateHariIni}`}>
                <FaCalendarDay /> HARI INI
              </div>
              <div className={`${homeStyles.scheduleTime} ${homeStyles.scheduleTimeTebal}`}>
                {j.jamMulai} - {j.jamSelesai}
              </div>
            </div>

            <div className={homeStyles.scheduleCardRow}>
              <p className={homeStyles.scheduleSubject}>{j.mapel}</p>
            </div>

            <div className={homeStyles.scheduleCardRow}>
              <div className={homeStyles.tombolMulaiKelas}>
                <FaCirclePlay /> MULAI KELAS
              </div>
              <div className={homeStyles.scheduleCount}>{j.kelasTarget}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

AgendaHariIni.displayName = "AgendaHariIni";
export default AgendaHariIni;