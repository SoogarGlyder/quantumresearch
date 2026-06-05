"use client";

import { memo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaHouse, FaQrcode, FaUserAstronaut,
  FaBookOpen, FaBookBookmark, FaRotate,
} from "react-icons/fa6";
import styles from "@/components/teacher/TeacherBottomNav.module.css";

const REFRESH_COOLDOWN_MS = 1500;

const TeacherBottomNav = memo(({ tab, setTab }) => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTabClick = useCallback(
    (targetTab) => {
      if (tab !== targetTab) { setTab(targetTab); return; }
      if (!isRefreshing) {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), REFRESH_COOLDOWN_MS);
      }
    },
    [tab, setTab, router, isRefreshing]
  );

  const renderIkon = (targetTab, IkonNormal) => {
    if (tab === targetTab && isRefreshing)
      return <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} />;
    return <IkonNormal className={styles.navIcon} />;
  };

  const navItems = [
    { key: "home",   label: "Home",   ikon: FaHouse,         aria: "Beranda Pengajar" },
    { key: "jurnal", label: "Jurnal", ikon: FaBookBookmark,  aria: "Jurnal Pengajar"  },
    { key: "tugas",  label: "Tugas",  ikon: FaBookOpen,      aria: "Tugas Pengajar"   },
    { key: "profil", label: "Profil", ikon: FaUserAstronaut, aria: "Profil Pengajar"  },
  ];

  return (
    <nav className={styles.navMenu} aria-label="Navigasi utama pengajar">
      {navItems.slice(0, 2).map(({ key, label, ikon: Ikon, aria }) => (
        <button key={key} onClick={() => handleTabClick(key)}
          className={`${styles.navButton} ${tab === key ? styles.navButtonActive : ""}`}
          aria-label={aria} aria-current={tab === key ? "page" : undefined}>
          {renderIkon(key, Ikon)}
          <span className={styles.teksNav}>{label}</span>
        </button>
      ))}

      <div className={styles.navButtonMid}>
        <button onClick={() => handleTabClick("scan")}
          className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}
          aria-label="Scan QR Pengajar" aria-current={tab === "scan" ? "page" : undefined}>
          <FaQrcode className={styles.scanIcon} />
        </button>
      </div>

      {navItems.slice(2).map(({ key, label, ikon: Ikon, aria }) => (
        <button key={key} onClick={() => handleTabClick(key)}
          className={`${styles.navButton} ${tab === key ? styles.navButtonActive : ""}`}
          aria-label={aria} aria-current={tab === key ? "page" : undefined}>
          {renderIkon(key, Ikon)}
          <span className={styles.teksNav}>{label}</span>
        </button>
      ))}
    </nav>
  );
});

TeacherBottomNav.displayName = "TeacherBottomNav";
export default TeacherBottomNav;