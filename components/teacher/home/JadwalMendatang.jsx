"use client";

import { memo } from "react";
import { FaCalendarDays, FaClock } from "react-icons/fa6";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/teacher/home/Home.module.css";

const JadwalMendatang = memo(({ jadwalMendatang, onPilihJadwal }) => (
  <div className={styles.contentContainer}>
    <h3 className={`${styles.contentTitle} ${homeStyles.contentTitleMendatang}`}>
      <FaCalendarDays className={homeStyles.ikonAbu} /> Jadwal Mendatang
    </h3>

    {jadwalMendatang.length === 0 ? (
      <p className={`${homeStyles.emptySchedule} ${homeStyles.emptyScheduleMendatang}`}>
        Belum ada jadwal kelas untuk hari-hari berikutnya.
      </p>
    ) : (
      <div className={homeStyles.scheduleList}>
        {jadwalMendatang.map((j) => (
          <div
            key={j._id}
            onClick={() => onPilihJadwal(j)}
            className={`${homeStyles.scheduleCard} ${homeStyles.scheduleCardMendatang}`}
          >
            <div className={homeStyles.scheduleCardRow}>
              <div className={`${homeStyles.scheduleDate} ${homeStyles.scheduleDateMendatang}`}>
                {timeHelper.formatTanggalLengkap(j.tanggal)}
              </div>
              <div className={`${homeStyles.scheduleTime} ${homeStyles.scheduleTimeMendatang}`}>
                <FaClock /> {j.jamMulai} - {j.jamSelesai}
              </div>
            </div>

            <div className={homeStyles.scheduleCardRow}>
              <p className={`${homeStyles.scheduleSubject} ${homeStyles.scheduleSubjectMendatang}`}>
                {j.mapel}
              </p>
            </div>

            <div className={homeStyles.scheduleCardRow}>
              <div className={`${homeStyles.scheduleCount} ${homeStyles.scheduleCountMendatang}`}>
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