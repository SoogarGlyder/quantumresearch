"use client";

import { memo } from "react";
import { FaHouse, FaQrcode, FaUserAstronaut, FaBookOpen, FaBookBookmark } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const TeacherBottomNav = memo(({ tab, setTab }) => {
  return (
    <nav className={styles.navMenu}>
      <button 
        onClick={() => setTab("home")} 
        className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`} 
      >
        <FaHouse className={styles.navIcon} />
        <span className={styles.teksNav}>Beranda</span>
      </button>

      <button 
        onClick={() => setTab("jurnal")} 
        className={`${styles.navButton} ${tab === "jurnal" ? styles.navButtonActive : ""}`} 
      >
        <FaBookBookmark className={styles.navIcon} />
        <span className={styles.teksNav}>Jurnal</span>
      </button>
      
      <div className={styles.navButtonMid}>
        <button 
          onClick={() => setTab("scan")} 
          className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}
          aria-label="Scan QR"
        >
          <FaQrcode className={styles.scanIcon} />
        </button>
      </div>

      <button 
        onClick={() => setTab("tugas")} 
        className={`${styles.navButton} ${tab === "tugas" ? styles.navButtonActive : ""}`} 
      >
        <FaBookOpen className={styles.navIcon} />
        <span className={styles.teksNav}>Tugas</span>
      </button>
      
      <button 
        onClick={() => setTab("profil")} 
        className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`} 
      >
        <FaUserAstronaut className={styles.navIcon} />
        <span className={styles.teksNav}>Profil</span>
      </button>
    </nav>
  );
});

TeacherBottomNav.displayName = "TeacherBottomNav";
export default TeacherBottomNav;