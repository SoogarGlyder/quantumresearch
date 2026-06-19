"use client";

import { memo } from "react";
import { FaBullseye, FaStar, FaFire, FaCircleCheck } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/student/home/Home.module.css";

const ArenaMisiBulanan = memo(({
  targetKonsul, persenMisiKonsul, statsBulanIni,
  targetStreak, persenMisiStreak, streakKonsul,
}) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>
      <FaBullseye color="#ef4444" /> Target Berikutnya
    </h3>
    <div className={homeStyles.missionList}>
      <div className={homeStyles.missionCard}>
        <div className={homeStyles.missionCardHeader}>
          <span className={homeStyles.missionCardTitle}>
            <FaStar color="#facc15" /> Kejar {targetKonsul} Jam!
          </span>
          {persenMisiKonsul >= 100 ? (
            <FaCircleCheck color="#22c55e" size={20} />
          ) : (
            <span className={homeStyles.missionCardProgress}>
              {Math.min(statsBulanIni.jamKonsul, targetKonsul)}/{targetKonsul} Jam
            </span>
          )}
        </div>
        <div className={homeStyles.progressTrackContainer}>
          {/* Dynamic width legitimate — dikontrol data, bukan styling preferensi */}
          <div
            className={homeStyles.progressTrackValue}
            style={{
              width:           `${persenMisiKonsul}%`,
              backgroundColor: persenMisiKonsul >= 100 ? "#4ade80" : "#facc15",
            }}
          />
        </div>
      </div>

      <div className={homeStyles.missionCard}>
        <div className={homeStyles.missionCardHeader}>
          <span className={homeStyles.missionCardTitle}>
            <FaFire color="#ef4444" /> Streak {targetStreak} Hari!
          </span>
          {persenMisiStreak >= 100 ? (
            <FaCircleCheck color="#22c55e" size={20} />
          ) : (
            <span className={homeStyles.missionCardProgress}>
              {Math.min(streakKonsul, targetStreak)}/{targetStreak} Hari
            </span>
          )}
        </div>
        <div className={homeStyles.progressTrackContainer}>
          <div
            className={homeStyles.progressTrackValue}
            style={{
              width:           `${persenMisiStreak}%`,
              backgroundColor: persenMisiStreak >= 100 ? "#4ade80" : "#f87171",
            }}
          />
        </div>
      </div>
    </div>
  </div>
));

ArenaMisiBulanan.displayName = "ArenaMisiBulanan";
export default ArenaMisiBulanan;