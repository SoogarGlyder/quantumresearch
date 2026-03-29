"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { FaHouse, FaQrcode, FaUserAstronaut, FaBolt } from "react-icons/fa6";

import styles from "./App.module.css";

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

// 🚀 Loading state bergaya Neo-Brutalism
const FallbackLoading = ({ teks }) => (
  <div style={{ padding: "80px 24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
    <div className={styles.messageLoading} style={{
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
export default function TeacherApp({ dataUser, jadwal, absensi, onLogout }) { 
  const [tab, setTab] = useState("home");

  // 🚀 LOGIKA: Cari absen yang sedang aktif (Masuk ada, Keluar belum ada)
  const absenAktif = useMemo(() => {
    if (!absensi || !Array.isArray(absensi)) return null;
    
    // Mencari data absensi yang sudah Clock-In tapi belum Clock-Out
    return absensi.find(a => a.waktuMasuk && !a.waktuKeluar);
  }, [absensi]);

  const kontenTab = useMemo(() => {
    switch (tab) {
      case "home":
        return <TabBerandaPengajar dataUser={dataUser} jadwal={jadwal} absenAktif={absenAktif} />;
      case "scan":
        return (
          <TabScanPengajar 
            // 🛑 PERUBAHAN: Key dihapus agar komponen TIDAK me-reset state internalnya
            // saat absenAktif berubah dari null menjadi data.
            absenAktif={absenAktif} 
          />
        );
      case "profil":
        return <TabProfilPengajar dataUser={dataUser} onLogout={onLogout} />;
      default:
        return null;
    }
  }, [tab, dataUser, jadwal, onLogout, absenAktif]); 

  return (
    <div className={styles.mainContainer}>
      <main>
        {kontenTab}
      </main>

      {/* NAVIGASI BAWAH NEO-BRUTALISM */}
      <nav className={styles.navMenu}>
        <button 
          onClick={() => setTab("home")} 
          className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`} 
          aria-label="Beranda"
        >
          <FaHouse className={styles.navIcon} />
          <span className={styles.teksNav}>Beranda</span>
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
          onClick={() => setTab("profil")} 
          className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`} 
          aria-label="Profil"
        >
          <FaUserAstronaut className={styles.navIcon} />
          <span className={styles.teksNav}>Profil</span>
        </button>
      </nav>
    </div>
  );
}