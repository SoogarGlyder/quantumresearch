"use client";

import { memo } from "react";
import { FaChalkboardUser, FaCheckDouble } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import classStyles from "@/components/student/class/Class.module.css";

const TabSelector = memo(({ activeTab, setActiveTab }) => (
  <div className={`${styles.tabScanContainer} ${classStyles.tabWrapper}`}>
    <div className={styles.wrapperRow}>
      <button
        onClick={() => setActiveTab("KELAS")}
        className={`${styles.tabScanButton} ${activeTab === "KELAS" ? styles.tabScanButtonActive : ""}`}
        aria-current={activeTab === "KELAS" ? "page" : undefined}
      >
        <FaChalkboardUser /> KELAS
      </button>
      <button
        onClick={() => setActiveTab("KUIS")}
        className={`${styles.tabScanButton} ${activeTab === "KUIS" ? styles.tabScanButtonActive : ""}`}
        aria-current={activeTab === "KUIS" ? "page" : undefined}
      >
        <FaCheckDouble /> QUIZ
      </button>
    </div>
  </div>
));

TabSelector.displayName = "TabSelector";
export default TabSelector;