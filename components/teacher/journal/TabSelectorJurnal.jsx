"use client";

import { memo } from "react";
import { FaBookBookmark, FaUsers } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import journalStyles from "@/components/teacher/journal/Journal.module.css";

const TabSelectorJurnal = memo(({ activeTab, setActiveTab }) => (
  <div className={`${styles.tabScanContainer} ${journalStyles.tabSelectorWrapper}`}>
    <div className={styles.wrapperRow}>
      <button
        onClick={() => setActiveTab("KELAS")}
        className={`${styles.tabScanButton} ${activeTab === "KELAS" ? styles.tabScanButtonActive : ""}`}
        aria-current={activeTab === "KELAS" ? "page" : undefined}
      >
        <FaBookBookmark /> Jurnal Kelas
      </button>

      <button
        onClick={() => setActiveTab("KONSUL")}
        className={`${styles.tabScanButton} ${activeTab === "KONSUL" ? styles.tabScanButtonActive : ""}`}
        aria-current={activeTab === "KONSUL" ? "page" : undefined}
      >
        <FaUsers /> Riwayat Konsul
      </button>
    </div>
  </div>
));

TabSelectorJurnal.displayName = "TabSelectorJurnal";
export default TabSelectorJurnal;