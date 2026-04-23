// File: components/student/StudentBottomNav.jsx
"use client";

import { memo } from "react";
import { FaHouse, FaQrcode, FaClockRotateLeft, FaCalendarCheck, FaUserAstronaut } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const StudentBottomNav = memo(({ tab, setTab }) => (
  <nav className={styles.navMenu}>
    <button onClick={() => setTab("home")} className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`}>
      <FaHouse className={styles.navIcon} />
      <span className={styles.teksNav}>Home</span>
    </button>
    
    <button onClick={() => setTab("kelas")} className={`${styles.navButton} ${tab === "kelas" ? styles.navButtonActive : ""}`}>
      <FaCalendarCheck className={styles.navIcon} />
      <span className={styles.teksNav}>Kelas</span>
    </button>
    
    <div className={styles.navButtonMid}>
      <button onClick={() => setTab("scan")} className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}>
        <FaQrcode className={styles.scanIcon} />
      </button>
    </div>
    
    <button onClick={() => setTab("riwayat")} className={`${styles.navButton} ${tab === "riwayat" ? styles.navButtonActive : ""}`}>
      <FaClockRotateLeft className={styles.navIcon} />
      <span className={styles.teksNav}>Konsul</span>
    </button>

    <button onClick={() => setTab("profil")} className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`}>
      <FaUserAstronaut className={styles.navIcon} />
      <span className={styles.teksNav}>Profil</span>
    </button>
  </nav>
));

StudentBottomNav.displayName = "StudentBottomNav";
export default StudentBottomNav;