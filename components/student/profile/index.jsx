"use client";

import styles from "@/components/App.module.css";

// 🚀 IMPORT TETANGGA (LOKAL)
import HeaderProfil from "./HeaderProfil";
import ProfilCard from "./ProfilCard";
import LogoutSection from "./LogoutSection";

export default function TabProfilSiswa({ siswa, klikLogout }) {
  return (
    <div className={styles.contentArea}>
      <HeaderProfil />

      <div className={styles.contentContainer}>
        <ProfilCard siswa={siswa} />
        <LogoutSection klikLogout={klikLogout} />
      </div>
    </div>
  );
}