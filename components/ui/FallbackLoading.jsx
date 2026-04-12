"use client";

import { FaBolt } from "react-icons/fa6";
// 🚀 IMPORT MODULE CSS YANG BARU DIBUAT
import styles from "./FallbackLoading.module.css"; 

export default function FallbackLoading({ teks = "MEMUAT..." }) {
  return (
    <div className={styles.loadingWrapper}>
      <div className={styles.loadingBox}>
        <FaBolt color="#ef4444" size={24} className={styles.iconBounce} />
        <span>{teks}</span>
      </div>
    </div>
  );
}