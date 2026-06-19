"use client";

import { memo } from "react";
import { FaCalendarDays, FaUserTie } from "react-icons/fa6";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/student/home/Home.module.css";

const JadwalHariIni = memo(({ jadwalAktif, setTab, setModeScan, resetScanner }) => {
  const tglHariIni = timeHelper.getTglJakarta();

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaCalendarDays className={homeStyles.ikonBiru} /> Pengingat Kelas
      </h3>

      {jadwalAktif.length === 0 ? (
        <p className={homeStyles.emptySchedule}>
          Yeay! Tidak ada jadwal kelas untukmu hari ini. Ayo Konsul!
        </p>
      ) : (
        <div className={homeStyles.scheduleList}>
          {jadwalAktif.map(({ item: j }) => {
            // ✅ FIX: timeHelper.getTglJakarta — bukan perbandingan langsung dengan ISO string
            const isHariIni = timeHelper.getTglJakarta(j.tanggal) === tglHariIni;

            return (
              <div
                key={j._id}
                className={`${homeStyles.scheduleCard} ${isHariIni ? homeStyles.kartuJadwalHariIni : homeStyles.kartuJadwalMendatang}`}
                onClick={isHariIni ? () => { setTab("scan"); setModeScan("kelas"); resetScanner(); } : undefined}
              >
                <div className={homeStyles.scheduleCardRow}>
                  {/* ✅ timeHelper.formatTanggalLengkap — timezone-safe */}
                  <div className={homeStyles.scheduleDate}>
                    {timeHelper.formatTanggalLengkap(j.tanggal)}
                  </div>
                  <div className={homeStyles.scheduleTime}>
                    {j.jamMulai} - {j.jamSelesai}
                  </div>
                </div>

                <div className={homeStyles.scheduleCardRow}>
                  <p className={homeStyles.scheduleSubject}>{j.mapel}</p>
                </div>

                <div className={homeStyles.scheduleCardRow}>
                  {j.kodePengajar && (
                    <div className={homeStyles.scheduleTeacher}>
                      <FaUserTie className={homeStyles.ikonBiru} size={14} />
                      <span>
                        Pengajar: <span className={homeStyles.teacherName}>{j.kodePengajar}</span>
                      </span>
                    </div>
                  )}
                  <div className={homeStyles.scheduleCount}>P-{j.pertemuan}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

JadwalHariIni.displayName = "JadwalHariIni";
export default JadwalHariIni;