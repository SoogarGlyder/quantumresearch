"use client";

import { memo } from "react";
import { FaBookBookmark, FaUsers } from "react-icons/fa6"; // Ikon yang relevan
import styles from "@/components/App.module.css";

const TabSelectorJurnal = memo(({ activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabScanContainer} style={{ margin: '16px 16px 0' }}>
      <div className={styles.wrapperRow}>
        <button 
          onClick={() => setActiveTab("KELAS")}
          className={`${styles.tabScanButton} ${activeTab === "KELAS" ? styles.tabScanButtonActive : ""}`}
        >
          <FaBookBookmark /> Jurnal Kelas
        </button>
        
        <button 
          onClick={() => setActiveTab("KONSUL")}
          className={`${styles.tabScanButton} ${activeTab === "KONSUL" ? styles.tabScanButtonActive : ""}`}
        >
          <FaUsers /> Riwayat Konsul
        </button>
      </div>
    </div>
  );
});

TabSelectorJurnal.displayName = "TabSelectorJurnal";
export default TabSelectorJurnal;