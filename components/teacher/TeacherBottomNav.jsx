"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHouse, FaQrcode, FaUserAstronaut, FaBookOpen, FaBookBookmark, FaRotate } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const TeacherBottomNav = memo(({ tab, setTab }) => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🚀 FUNGSI KETUK TAB CERDAS (SMART REFRESH)
  const handleTabClick = (targetTab) => {
    if (tab !== targetTab) {
      setTab(targetTab);
      return;
    }

    if (tab === targetTab && !isRefreshing) {
      setIsRefreshing(true);
      router.refresh(); 
      
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
    }
  };

  return (
    <nav className={styles.navMenu}>
      <button onClick={() => handleTabClick("home")} className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`} aria-label="Beranda Pengajar">
        {tab === "home" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaHouse className={styles.navIcon} />}
        <span className={styles.teksNav}>Home</span>
      </button>

      <button onClick={() => handleTabClick("jurnal")} className={`${styles.navButton} ${tab === "jurnal" ? styles.navButtonActive : ""}`} aria-label="Jurnal Pengajar">
        {tab === "jurnal" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaBookBookmark className={styles.navIcon} />}
        <span className={styles.teksNav}>Jurnal</span>
      </button>
      
      <div className={styles.navButtonMid}>
        <button onClick={() => handleTabClick("scan")} className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`} aria-label="Scan QR Pengajar">
          <FaQrcode className={styles.scanIcon} />
        </button>
      </div>

      <button onClick={() => handleTabClick("tugas")} className={`${styles.navButton} ${tab === "tugas" ? styles.navButtonActive : ""}`} aria-label="Tugas oleh Pengajar">
        {tab === "tugas" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaBookOpen className={styles.navIcon} />}
        <span className={styles.teksNav}>Tugas</span>
      </button>
      
      <button onClick={() => handleTabClick("profil")} className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`} aria-label="Profil Pengajar">
        {tab === "profil" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaUserAstronaut className={styles.navIcon} />}
        <span className={styles.teksNav}>Profil</span>
      </button>
    </nav>
  );
});

TeacherBottomNav.displayName = "TeacherBottomNav";
export default TeacherBottomNav;