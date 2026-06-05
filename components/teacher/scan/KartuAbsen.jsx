"use client";

import { memo } from "react";
import { FaHourglassHalf, FaChevronUp, FaChevronDown } from "react-icons/fa6";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import scanStyles from "@/components/teacher/scan/Scan.module.css";

const KartuAbsen = memo(({ abs, isOpen, onToggle }) => {
  const isSelesai = !!abs.waktuKeluar;

  return (
    <div
      className={`${styles.recordCard} ${styles.recordCardClickable} ${scanStyles.kartuAbsenBorder}`}
      onClick={() => onToggle(abs._id)}
    >
      <div className={styles.recordCardRow}>
        <p className={styles.recordDate}>
          {timeHelper.formatTanggalLengkap(abs.waktuMasuk)}
        </p>

        {!isSelesai && (
          <span className={`${styles.recordDuration} ${scanStyles.badgeBertugas}`}>
            <FaHourglassHalf className={styles.spin} /> Bertugas
          </span>
        )}

        <div className={scanStyles.chevronWrapper}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className={styles.recordDetail}>
          <div className={`${styles.recordDetailRow} ${scanStyles.rowClockIn}`}>
            <span>Clock In</span>
            <span className={scanStyles.rowNilaiBold}>
              {timeHelper.formatJam(abs.waktuMasuk)} WIB
            </span>
          </div>

          <div
            className={`${styles.recordDetailRow} ${isSelesai ? scanStyles.rowClockOutSelesai : scanStyles.rowClockOutBerjalan}`}
          >
            <span>Clock Out</span>
            <span className={scanStyles.rowNilaiBold}>
              {isSelesai
                ? `${timeHelper.formatJam(abs.waktuKeluar)} WIB`
                : "Sedang Bertugas..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

KartuAbsen.displayName = "KartuAbsen";
export default KartuAbsen;