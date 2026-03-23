"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { FaHouse, FaQrcode, FaUserAstronaut } from "react-icons/fa6";

import styles from "./TeacherApp.module.css";

// ============================================================================
// 1. DYNAMIC IMPORTS (Lazy Loading)
// ============================================================================
const TabBerandaPengajar = dynamic(() => import("./teacher/TabBerandaPengajar"), {
  loading: () => <FallbackLoading teks="Memuat Jadwal..." />,
});
const TabScanPengajar = dynamic(() => import("./teacher/TabScanPengajar"), {
  loading: () => <FallbackLoading teks="Menyiapkan Kamera..." />,
});
const TabProfilPengajar = dynamic(() => import("./teacher/TabProfilPengajar"), {
  loading: () => <FallbackLoading teks="Memuat Profil..." />,
});

const FallbackLoading = ({ teks }) => (
  <div style={{ padding: "40px", textAlign: "center", fontWeight: "900", color: "#2563eb", animation: "pulse 1.5s infinite" }}>
    {teks}
  </div>
);

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================
export default function TeacherApp({ dataUser, jadwal, onLogout }) {
  const [tab, setTab] = useState("home");

  const kontenTab = useMemo(() => {
    switch (tab) {
      case "home":
        return <TabBerandaPengajar dataUser={dataUser} jadwal={jadwal} />;
      case "scan":
        return <TabScanPengajar />;
      case "profil":
        return <TabProfilPengajar dataUser={dataUser} onLogout={onLogout} />;
      default:
        return null;
    }
  }, [tab, dataUser, jadwal, onLogout]);

  return (
    <div className={styles.wadahUtama}>
      <main style={{ paddingBottom: "110px", minHeight: "100vh" }}>
        {kontenTab}
      </main>

      <nav className={styles.menuBawah}>
        <button onClick={() => setTab("home")} className={`${styles.tombolNav} ${tab === "home" ? styles.tombolNavAktif : ""}`} aria-label="Beranda">
          <FaHouse className={styles.ikonNav} />
          <span className={styles.teksNav}>Beranda</span>
        </button>
        
        <div className={styles.wadahTombolTengah}>
          <button onClick={() => setTab("scan")} className={`${styles.tombolKamera} ${tab === "scan" ? styles.tombolKameraAktif : styles.tombolKameraMati}`} aria-label="Scanner Kehadiran">
            <FaQrcode className={styles.ikonKamera} />
          </button>
        </div>
        
        <button onClick={() => setTab("profil")} className={`${styles.tombolNav} ${tab === "profil" ? styles.tombolNavAktif : ""}`} aria-label="Profil">
          <FaUserAstronaut className={styles.ikonNav} />
          <span className={styles.teksNav}>Profil</span>
        </button>
      </nav>
    </div>
  );
}