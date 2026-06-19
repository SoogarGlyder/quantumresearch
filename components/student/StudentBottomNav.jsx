"use client";

import { memo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaHouse, FaQrcode, FaClockRotateLeft,
  FaCalendarCheck, FaUserAstronaut, FaRotate,
} from "react-icons/fa6";
import styles from "@/components/student/StudentBottomNav.module.css";

const REFRESH_COOLDOWN_MS = 1500;

/**
 * StudentBottomNav — Navigasi tab bawah untuk portal siswa.
 *
 * Fitur Smart Refresh:
 *   Mengetuk tab yang sedang aktif memanggil window.location.reload()
 *   untuk memuat ulang data dari server tanpa full navigation.
 *   Ikon berputar selama cooldown mencegah spam refresh.
 */
const StudentBottomNav = memo(({ tab, setTab }) => {
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
    if (tab === targetTab && isRefreshing) {
      return <FaRotate className={`${styles.navIcon} ${styles.spinAnimation}`} />;
    }
    return <IkonNormal className={styles.navIcon} />;
  };

  const navItems = [
    { key: "home",    label: "Home",   ikon: FaHouse,           aria: "Beranda Siswa"  },
    { key: "kelas",   label: "Kelas",  ikon: FaCalendarCheck,   aria: "Riwayat Kelas"  },
    { key: "riwayat", label: "Konsul", ikon: FaClockRotateLeft, aria: "Riwayat Konsul" },
    { key: "profil",  label: "Profil", ikon: FaUserAstronaut,   aria: "Profil Siswa"   },
  ];

  return (
    <nav className={styles.navMenu} aria-label="Navigasi utama siswa">

      {/* Tombol Kiri: Home & Kelas */}
      {navItems.slice(0, 2).map(({ key, label, ikon: Ikon, aria }) => (
        <button
          key={key}
          onClick={() => handleTabClick(key)}
          className={`${styles.navButton} ${tab === key ? styles.navButtonActive : ""}`}
          aria-label={aria}
          aria-current={tab === key ? "page" : undefined}
        >
          {renderIkon(key, Ikon)}
          <span className={styles.teksNav}>{label}</span>
        </button>
      ))}

      {/* Tombol Scan Tengah (elevated) */}
      <div className={styles.navButtonMid}>
        <button
          onClick={() => handleTabClick("scan")}
          className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}
          aria-label="Scan QR"
          aria-current={tab === "scan" ? "page" : undefined}
        >
          <FaQrcode className={styles.scanIcon} />
        </button>
      </div>

      {/* Tombol Kanan: Konsul & Profil */}
      {navItems.slice(2).map(({ key, label, ikon: Ikon, aria }) => (
        <button
          key={key}
          onClick={() => handleTabClick(key)}
          className={`${styles.navButton} ${tab === key ? styles.navButtonActive : ""}`}
          aria-label={aria}
          aria-current={tab === key ? "page" : undefined}
        >
          {renderIkon(key, Ikon)}
          <span className={styles.teksNav}>{label}</span>
        </button>
      ))}

    </nav>
  );
});

StudentBottomNav.displayName = "StudentBottomNav";
export default StudentBottomNav;