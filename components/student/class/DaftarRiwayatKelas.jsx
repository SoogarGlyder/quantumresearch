"use client";

import { memo } from "react";
import { FaUserTie } from "react-icons/fa6";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import classStyles from "@/components/student/class/Class.module.css";
import BadgeKehadiran from "./BadgeKehadiran";
import PaginationBar from "@/components/ui/PaginationBar";

const DaftarRiwayatKelas = memo(({ dataHalIni, totalPage, currentPage, onPageChange, onBukaCatatan }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>Klik untuk melihat foto papan</h3>

    {dataHalIni.length === 0 ? (
      <p className={styles.emptySchedule}>Belum ada riwayat kelas pada periode ini.</p>
    ) : (
      <>
        <div className={styles.scheduleList}>
          {dataHalIni.map(({ item: j, sesiTerkait }) => (
            <div
              key={j._id}
              className={`${styles.scheduleCard} ${classStyles.kartuKelasKlik}`}
              onClick={() => onBukaCatatan(j)}
            >
              <div className={styles.scheduleCardRow}>
                {/* ✅ FIX: timeHelper.formatTanggalLengkap — timezone-safe */}
                <div className={styles.scheduleDate}>
                  {timeHelper.formatTanggalLengkap(j.tanggal)}
                </div>
                <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
              </div>

              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject}>{j.mapel}</p>
              </div>

              <div className={styles.scheduleCardRow}>
                {j.kodePengajar && (
                  <div className={styles.scheduleTeacher}>
                    {/* ✅ FIX: color prop → CSS class */}
                    <FaUserTie className={classStyles.ikonBiru} size={14} />
                    <span>Pengajar: <span className={styles.teacherName}>{j.kodePengajar}</span></span>
                  </div>
                )}
                {j.pertemuan && <div className={styles.scheduleCount}>P-{j.pertemuan}</div>}
              </div>

              <div className={`${styles.presenceArea} ${classStyles.presenceAreaMargin}`}>
                <div className={styles.badgesContainer}>
                  <BadgeKehadiran sesiTerkait={sesiTerkait} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={classStyles.paginasiWrapper}>
          <PaginationBar
            totalPages={totalPage}
            currentPage={currentPage}
            onPageChange={onPageChange}
            className={classStyles.paginasiInner}
          />
        </div>
      </>
    )}
  </div>
));

DaftarRiwayatKelas.displayName = "DaftarRiwayatKelas";
export default DaftarRiwayatKelas;