"use client";

import { memo } from "react";
import { FaXmark, FaCheck, FaTriangleExclamation, FaStopwatch, FaArrowsRotate } from "react-icons/fa6";
import { STATUS_SESI } from "@/utils/constants";
import styles from "@/components/App.module.css";

const BadgeKehadiran = memo(({ sesiTerkait }) => {
  if (!sesiTerkait) {
    return <span className={`${styles.presenceBadge} ${styles.alphaBadge}`}><FaXmark />&nbsp;{STATUS_SESI.ALPA.label}</span>;
  }

  // 🚀 PERBAIKAN: Ambil status dasar (Buang teks catatan di dalam kurung untuk pengecekan)
  let baseStatus = sesiTerkait.status || "";
  if (baseStatus.includes("(")) {
    baseStatus = baseStatus.split("(")[0].trim();
  }

  // 🚀 Gunakan baseStatus untuk mengecek kondisi
  if ([STATUS_SESI.TIDAK_HADIR.id, STATUS_SESI.ALPA.id, STATUS_SESI.SAKIT.id, STATUS_SESI.IZIN.id].includes(baseStatus)) {
    // 🚀 Tapi tetap tampilkan teks aslinya (agar catatannya tetap terbaca oleh siswa)
    return (
      <span className={`${styles.presenceBadge} ${styles.alphaBadge}`} style={{ textTransform: 'capitalize' }}>
        <FaXmark />&nbsp;{sesiTerkait.status}
      </span>
    );
  }

  if (baseStatus === STATUS_SESI.SELESAI.id) {
    return (
      <>
        <span className={`${styles.presenceBadge} ${styles.attendBadge}`}><FaCheck />&nbsp;Hadir</span>
        {sesiTerkait.terlambatMenit > 0 && (
          <span className={`${styles.presenceBadge} ${styles.lateBadge}`}><FaTriangleExclamation />&nbsp;Telat {sesiTerkait.terlambatMenit}m</span>
        )}
        {sesiTerkait.konsulExtraMenit > 0 && (
          <span className={`${styles.presenceBadge} ${styles.extraBadge}`}><FaStopwatch />&nbsp;+{sesiTerkait.konsulExtraMenit}m Extra</span>
        )}
      </>
    );
  }

  return <span className={`${styles.presenceBadge} ${styles.ongoingBadge}`}><FaArrowsRotate />&nbsp;Sedang Kelas</span>;
});

BadgeKehadiran.displayName = "BadgeKehadiran";
export default BadgeKehadiran;