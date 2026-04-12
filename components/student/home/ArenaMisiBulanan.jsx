"use client";

import { memo } from "react";
import { FaBullseye, FaStar, FaFire, FaCircleCheck } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const ArenaMisiBulanan = memo(({ targetKonsul, persenMisiKonsul, statsBulanIni, targetStreak, persenMisiStreak, streakKonsul }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaBullseye color="#ef4444" /> Target Berikutnya</h3>
    <div className={styles.missionList}>
      <div className={styles.missionCard}>
        <div className={styles.missionCardHeader}>
          <span className={styles.missionCardTitle}><FaStar color="#facc15" /> Kejar {targetKonsul} Jam!</span>
          {persenMisiKonsul >= 100 ? <FaCircleCheck color="#22c55e" size={20} /> : <span className={styles.missionCardProgress}>{Math.min(statsBulanIni.jamKonsul, targetKonsul)}/{targetKonsul} Jam</span>}
        </div>
        <div className={styles.progressTrackContainer}>
          <div className={styles.progressTrackValue} style={{ width: `${persenMisiKonsul}%`, backgroundColor: persenMisiKonsul >= 100 ? '#4ade80' : '#facc15' }}></div>
        </div>
      </div>
      <div className={styles.missionCard}>
        <div className={styles.missionCardHeader}>
          <span className={styles.missionCardTitle}><FaFire color="#ef4444" /> Streak {targetStreak} Hari!</span>
          {persenMisiStreak >= 100 ? <FaCircleCheck color="#22c55e" size={20} /> : <span className={styles.missionCardProgress}>{Math.min(streakKonsul, targetStreak)}/{targetStreak} Hari</span>}
        </div>
        <div className={styles.progressTrackContainer}>
          <div className={styles.progressTrackValue} style={{ width: `${persenMisiStreak}%`, backgroundColor: persenMisiStreak >= 100 ? '#4ade80' : '#f87171' }}></div>
        </div>
      </div>
    </div>
  </div>
));

ArenaMisiBulanan.displayName = "ArenaMisiBulanan";
export default ArenaMisiBulanan;