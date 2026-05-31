import React from "react";
import styles from "./StatusBadge.module.css";
import { STATUS_SESI, LABEL_SISTEM } from "@/utils/constants";

/**
 * @param {{ status: string | null | undefined }} props
 */
const StatusBadge = ({ status }) => {
  const statusClean = status?.toLowerCase().trim();

  const config = Object.values(STATUS_SESI).find(
    (item) => item.id === statusClean
  );

  if (!status || status === LABEL_SISTEM.BELUM_ABSEN) {
    return (
      <span className={`${styles.badge} ${styles.default}`}>
        {LABEL_SISTEM.BELUM_ABSEN}
      </span>
    );
  }

  const classKey = config?.id.replace(/\s+/g, "_") ?? "default";

  return (
    <span className={`${styles.badge} ${styles[classKey] ?? styles.default}`}>
      {config?.label ?? status}
    </span>
  );
};

export default StatusBadge;