"use client";

import { memo } from "react";
import { FaChalkboardUser, FaCheckDouble } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const TabSelector = memo(({ activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabScanContainer} style={{margin: '24px 16px 0'}}>
      <div className={styles.wrapperRow}>
        <button 
          onClick={() => setActiveTab("KELAS")}
          className={`${styles.tabScanButton} ${activeTab === "KELAS" ? styles.tabScanButtonActive : ""}`}
        >
          <FaChalkboardUser /> KELAS
        </button>
        
        <button 
          onClick={() => setActiveTab("KUIS")}
          className={`${styles.tabScanButton} ${activeTab === "KUIS" ? styles.tabScanButtonActive : ""}`}
        >
          <FaCheckDouble /> QUIZ
        </button>
      </div>
    </div>
  );
});

TabSelector.displayName = "TabSelector";
export default TabSelector;