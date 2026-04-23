"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHouse, FaQrcode, FaClockRotateLeft, FaCalendarCheck, FaUserAstronaut } from "react-icons/fa6";
import { FaRotate } from "react-icons/fa6"; // Ikon loading
import styles from "@/components/App.module.css";

const StudentBottomNav = memo(({ tab, setTab }) => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🚀 FUNGSI KETUK TAB CERDAS (SMART REFRESH)
  const handleTabClick = (targetTab) => {
    // Jika pindah tab biasa
    if (tab !== targetTab) {
      setTab(targetTab);
      return;
    }

    // Jika mengetuk tab yang sama & sistem tidak sedang loading
    if (tab === targetTab && !isRefreshing) {
      setIsRefreshing(true);
      router.refresh(); // Minta data terbaru dari server tanpa kedip
      
      // Cooldown & Matikan animasi loading setelah 1.5 detik
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
    }
  };

  return (
    <nav className={styles.navMenu}>
      <button onClick={() => handleTabClick("home")} className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`}>
        {tab === "home" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaHouse className={styles.navIcon} />}
        <span className={styles.teksNav}>Home</span>
      </button>
      
      <button onClick={() => handleTabClick("kelas")} className={`${styles.navButton} ${tab === "kelas" ? styles.navButtonActive : ""}`}>
        {tab === "kelas" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaCalendarCheck className={styles.navIcon} />}
        <span className={styles.teksNav}>Kelas</span>
      </button>
      
      <div className={styles.navButtonMid}>
        <button onClick={() => handleTabClick("scan")} className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}>
          <FaQrcode className={styles.scanIcon} />
        </button>
      </div>
      
      <button onClick={() => handleTabClick("riwayat")} className={`${styles.navButton} ${tab === "riwayat" ? styles.navButtonActive : ""}`}>
        {tab === "riwayat" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaClockRotateLeft className={styles.navIcon} />}
        <span className={styles.teksNav}>Konsul</span>
      </button>

      <button onClick={() => handleTabClick("profil")} className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`}>
        {tab === "profil" && isRefreshing ? <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} /> : <FaUserAstronaut className={styles.navIcon} />}
        <span className={styles.teksNav}>Profil</span>
      </button>
    </nav>
  );
});

StudentBottomNav.displayName = "StudentBottomNav";
export default StudentBottomNav;