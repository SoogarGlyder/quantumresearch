"use client";

import { memo } from "react";
import { FaChevronDown, FaChevronUp, FaSkullCrossbones } from "react-icons/fa6";
import { STATUS_SESI } from "@/utils/constants";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import consulStyles from "@/components/student/consul/Consul.module.css";

const RecordCard = memo(({ sesi, isOpen, onToggle }) => {
  const isSelesai  = sesi.status === STATUS_SESI.SELESAI.id;
  const isPinalti  = sesi.status === STATUS_SESI.PINALTI?.id;
  const isBerjalan = sesi.status === STATUS_SESI.BERJALAN.id;

  // ✅ FIX: formatTanggalTanpaTahun dihapus — timeHelper.formatTanggalLengkap sudah ada
  // ✅ FIX: import { hitungDurasiMenit, formatJam } dari formatHelper dihapus (dead import)
  //         Keduanya sudah di timeHelper dan sudah dipakai via timeHelper.xxx di bawah

  let labelPendamping = "Belajar Mandiri";
  if (sesi.pengajarPendamping) {
    labelPendamping =
      typeof sesi.pengajarPendamping === "object"
        ? sesi.pengajarPendamping.kodePengajar || sesi.pengajarPendamping.nama || "Guru"
        : `ID: ${sesi.pengajarPendamping.substring(0, 4)}...`;
  }

  // Tentukan class baris Selesai/Pinalti/Berjalan secara deklaratif
  const rowSelesaiClass = isSelesai
    ? consulStyles.rowSelesai
    : isPinalti
    ? consulStyles.rowPinalti
    : consulStyles.rowBerjalan;

  return (
    <div
      className={`${styles.recordCard} ${styles.recordCardClickable}`}
      onClick={() => onToggle(sesi._id)}
    >
      {/* Baris atas: tanggal + badge status */}
      <div className={styles.recordCardRow}>
        <p className={styles.recordDate}>
          {timeHelper.formatTanggalLengkap(sesi.waktuMulai)}
        </p>

        {isPinalti ? (
          <span className={`${styles.recordDuration} ${consulStyles.badgePinalti}`}>
            <FaSkullCrossbones /> PINALTI
          </span>
        ) : !isSelesai ? (
          <span className={`${styles.recordDuration} ${consulStyles.badgeBerjalan}`}>
            {isBerjalan
              ? "Sedang Berjalan"
              : sesi.status.charAt(0).toUpperCase() + sesi.status.slice(1)}
          </span>
        ) : null}

        {isSelesai && (
          <span className={styles.recordDuration}>
            {timeHelper.hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)} menit
          </span>
        )}
      </div>

      {/* Baris tengah: nama mapel + chevron */}
      <div className={styles.recordCardRow}>
        <h3 className={styles.recordTitle}>{sesi.namaMapel || "Umum"}</h3>
        <div className={consulStyles.chevronWrapper}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {/* Detail yang muncul saat kartu dibuka */}
      {isOpen && (
        <div className={styles.recordDetail}>
          <div className={`${styles.recordDetailRow} ${consulStyles.rowPendamping}`}>
            <span>Pendamping</span>
            <span className={sesi.pengajarPendamping ? consulStyles.nilaiPendampingAda : consulStyles.nilaiPendampingTdk}>
              {labelPendamping}
            </span>
          </div>

          <div className={`${styles.recordDetailRow} ${consulStyles.rowMulai}`}>
            <span>Mulai</span>
            <span>{timeHelper.formatJam(sesi.waktuMulai)} WIB</span>
          </div>

          <div className={`${styles.recordDetailRow} ${rowSelesaiClass}`}>
            <span>Selesai</span>
            <span>
              {isSelesai || isPinalti
                ? `${timeHelper.formatJam(sesi.waktuSelesai)} WIB`
                : "Sedang Berjalan..."}
            </span>
          </div>

          {isPinalti && (
            <div className={consulStyles.notaPinalti}>
              Sesi dihentikan karena kamu lupa Scan Out! (0 Menit)
            </div>
          )}
        </div>
      )}
    </div>
  );
});

RecordCard.displayName = "RecordCard";
export default RecordCard;