"use client";

import { memo } from "react";
import { FaBookOpen, FaBrain } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const TabSelector = memo(({ activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabScanContainer} style={{margin: '24px 16px 0'}}>
      <div className={styles.wrapperRow}>
        <button 
          onClick={() => setActiveTab("TUGAS")}
          className={`${styles.tabScanButton} ${activeTab === "TUGAS" ? styles.tabScanButtonActive : ""}`}
        >
          <FaBookOpen /> Tugas & Materi
        </button>
        
        <button 
          onClick={() => setActiveTab("BANK_SOAL")}
          className={`${styles.tabScanButton} ${activeTab === "BANK_SOAL" ? styles.tabScanButtonActive : ""}`}
        >
          <FaBrain /> Bank Soal CBT
        </button>
      </div>
    </div>
  );
});

TabSelector.displayName = "TabSelector";
export default TabSelector;