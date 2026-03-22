import React from "react";
import styles from "./StatusBadge.module.css";
import { STATUS_SESI, LABEL_SISTEM } from "@/utils/constants";

/**
 * StatusBadge - Komponen UI Global (CSS Modules Version)
 * Tersinkronisasi dengan utils/constants.js
 */
const StatusBadge = ({ status }) => {
  // 1. Normalisasi status dari database
  const statusClean = status?.toLowerCase().trim();

  // 2. Cari konfigurasi status di constants
  const config = Object.values(STATUS_SESI).find(
    (item) => item.id === statusClean
  );

  // 3. Handle jika status kosong atau "Belum Absen"
  if (!status || status === LABEL_SISTEM.BELUM_ABSEN) {
    return (
      <span className={`${styles.badge} ${styles.default}`}>
        {LABEL_SISTEM.BELUM_ABSEN}
      </span>
    );
  }

  // 4. Mapping ID status ke nama class CSS
  // Karena ID 'tidak hadir' mengandung spasi, kita ubah jadi underscore
  // agar cocok dengan selector CSS (.tidak_hadir)
  const classKey = config?.id.replace(/\s+/g, '_') || 'default';

  return (
    <span className={`${styles.badge} ${styles[classKey]}`}>
      {config?.label || status}
    </span>
  );
};

export default StatusBadge;