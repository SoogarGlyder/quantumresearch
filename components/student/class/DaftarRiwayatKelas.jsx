"use client";

import { memo } from "react";
import { FaUserTie } from "react-icons/fa6";
import { PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";

import BadgeKehadiran from "./BadgeKehadiran";
import PaginationBar from "@/components/ui/PaginationBar"; // 🚀 Import Pagination

const DaftarRiwayatKelas = memo(({ dataHalIni, totalPage, onBukaCatatan }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>Klik untuk melihat foto papan</h3>

    {dataHalIni.length === 0 ? (
      <p className={styles.emptySchedule}>Belum ada riwayat kelas pada periode ini.</p>
    ) : (
      <>
        <div className={styles.scheduleList}>
          {dataHalIni.map(({ item: j, sesiTerkait }) => (
            <div key={j._id} className={styles.scheduleCard} onClick={() => onBukaCatatan(j)} style={{ cursor: 'pointer', position: 'relative' }}>   
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleDate}>
                  {new Date(j.tanggal).toLocaleDateString('id-ID', { timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
              </div>
                
              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject}>{j.mapel}</p>
              </div>

              <div className={styles.scheduleCardRow}>
                {j.kodePengajar && (
                  <div className={styles.scheduleTeacher}>
                    <FaUserTie color="#2563eb" size={14} /> 
                    <span>Pengajar: <span className={styles.teacherName}>{j.kodePengajar}</span></span>
                  </div>
                )}
                {j.pertemuan && <div className={styles.scheduleCount}>P-{j.pertemuan}</div>}
              </div>

              <div className={styles.presenceArea} style={{ marginTop: '2px' }}>
                <div className={styles.badgesContainer}>
                  <BadgeKehadiran sesiTerkait={sesiTerkait} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🚀 PAGINATION RENDERED HERE */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <PaginationBar totalPages={totalPage} style={{ justifyContent: 'space-evenly', width: '100%', margin: '0 16px'}} />
        </div>
      </>
    )}
  </div>
));

DaftarRiwayatKelas.displayName = "DaftarRiwayatKelas";
export default DaftarRiwayatKelas;