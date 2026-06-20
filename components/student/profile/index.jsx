"use client";

import styles from "@/components/App.module.css";
import HeaderProfil  from "./HeaderProfil";
import ProfilCard    from "./ProfilCard";
import LogoutSection from "./LogoutSection";

export default function TabProfilSiswa({ siswa, klikLogout, isDemoMode = false }) {
  return (
    <div className={styles.contentArea}>
      <HeaderProfil />
      <div className={styles.contentContainer}>
        <ProfilCard siswa={siswa} isDemoMode={isDemoMode} />
        <LogoutSection klikLogout={klikLogout} />
      </div>
    </div>
  );
}