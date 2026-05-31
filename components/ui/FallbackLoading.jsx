"use client";

import { FaBolt } from "react-icons/fa6";
import styles from "./FallbackLoading.module.css";

/**
 * @param {{ teks?: string }} props
 */
export default function FallbackLoading({ teks = "MEMUAT..." }) {
  return (
    <div className={styles.loadingWrapper}>
      <div className={styles.loadingBox}>
        <FaBolt className={styles.ikonBolt} aria-hidden="true" />
        <span>{teks}</span>
      </div>
    </div>
  );
}