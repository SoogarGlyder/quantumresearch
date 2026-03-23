"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { FaHouse, FaQrcode, FaUserAstronaut, FaBolt } from "react-icons/fa6";

import styles from "./TeacherApp.module.css";

// ============================================================================
// 1. DYNAMIC IMPORTS (Lazy Loading)
// ============================================================================
const TabBerandaPengajar = dynamic(() => import("./teacher/TabBerandaPengajar"), {
  loading: () => <FallbackLoading teks="MEMUAT JADWAL..." />,
});
const TabScanPengajar = dynamic(() => import("./teacher/TabScanPengajar"), {
  loading: () => <FallbackLoading teks="MENYIAPKAN KAMERA..." />,
});
const TabProfilPengajar = dynamic(() => import("./teacher/TabProfilPengajar"), {
  loading: () => <FallbackLoading teks="MEMUAT PROFIL..." />,
});

// 🚀 DI-UPGRADE: Loading state bergaya Neo-Brutalism
const FallbackLoading = ({ teks }) => (
  <div style={{ padding: "80px 24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
    <div className={styles.kotakPesanLoading} style={{
      padding: "24px 32px",
      backgroundColor: "#fef08a",
      border: "4px solid #111827",
      boxShadow: "8px 8px 0 #111827",
      borderRadius: "16px",
      fontWeight: "900",
      color: "#111827",
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontSize: "18px"
    }}>
      <FaBolt color="#ef4444" size={24} /> {teks}
    </div>
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

      {/* NAVIGASI BAWAH NEO-BRUTALISM */}
      <nav className={styles.menuBawah}>
        <button onClick={() => setTab("home")} className={`${styles.tombolNav} ${tab === "home" ? styles.tombolNavAktif : ""}`} aria-label="Beranda">
          <FaHouse className={styles.ikonNav} />
          <span className={styles.teksNav}>Beranda</span>
        </button>
        
        <div className={styles.wadahTombolTengah}>
          <button onClick={() => setTab("scan")} className={`${styles.tombolKamera} ${tab === "scan" ? styles.tombolKameraAktif : styles.tombolKameraMati}`} aria-label="Scanner Kehadiran">
            <FaQrcode size={32} />
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