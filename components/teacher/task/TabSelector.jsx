"use client";

import { memo } from "react";
import { FaBookOpen, FaBrain } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import taskStyles from "@/components/teacher/task/Task.module.css";

const TabSelector = memo(({ activeTab, setActiveTab }) => (
  <div className={`${styles.tabScanContainer} ${taskStyles.tabWrapper}`}>
    <div className={styles.wrapperRow}>
      <button
        onClick={() => setActiveTab("TUGAS")}
        className={`${styles.tabScanButton} ${activeTab === "TUGAS" ? styles.tabScanButtonActive : ""}`}
        aria-current={activeTab === "TUGAS" ? "page" : undefined}
      >
        <FaBookOpen /> Tugas & Materi
      </button>

      <button
        onClick={() => setActiveTab("BANK_SOAL")}
        className={`${styles.tabScanButton} ${activeTab === "BANK_SOAL" ? styles.tabScanButtonActive : ""}`}
        aria-current={activeTab === "BANK_SOAL" ? "page" : undefined}
      >
        <FaBrain /> Bank Soal CBT
      </button>
    </div>
  </div>
));

TabSelector.displayName = "TabSelector";
export default TabSelector;