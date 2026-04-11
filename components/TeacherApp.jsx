"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
// 🚀 FIX 1: Tambahkan FaBookBookmark untuk Tab Jurnal
import { 
  FaHouse, FaQrcode, FaUserAstronaut, 
  FaBolt, FaBookOpen, FaBookBookmark 
} from "react-icons/fa6";

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
const TabTugasPengajar = dynamic(() => import("./teacher/TabTugasPengajar"), {
  loading: () => <FallbackLoading teks="MEMUAT TUGAS..." />,
});
// 🚀 FIX 2: Import Tab Jurnal Kelas secara dinamis
const TabJurnalKelas = dynamic(() => import("./teacher/TabJurnalKelas"), {
  loading: () => <FallbackLoading teks="MEMUAT JURNAL..." />,
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

  const absenAktif = useMemo(() => {
    if (!absensi || !Array.isArray(absensi)) return null;
    return absensi.find(a => a.waktuMasuk && !a.waktuKeluar);
  }, [absensi]);

  const kontenTab = useMemo(() => {
    switch (tab) {
      case "home":
        return <TabBerandaPengajar dataUser={dataUser} jadwal={jadwal} absensi={absensi} absenAktif={absenAktif} />;
      case "jurnal":
        // 🚀 FIX 3: Masukkan Tab Jurnal ke logika render
        return <TabJurnalKelas dataUser={dataUser} jadwal={jadwal} />;
      case "scan":
        return <TabScanPengajar absenAktif={absenAktif} />;
      case "tugas":
        return <TabTugasPengajar />;
      case "profil":
        return <TabProfilPengajar dataUser={dataUser} onLogout={onLogout} />;
      default:
        return null;
    }
  }, [tab, dataUser, jadwal, absensi, onLogout, absenAktif]); 

  return (
    <div className={styles.mainContainer}>
      <main>
        {kontenTab}
      </main>

      {/* 🚀 NAVIGASI BAWAH: URUTAN BARU (Beranda | Jurnal | Scan | Tugas | Profil) */}
      <nav className={styles.navMenu}>
        
        {/* 1. BERANDA */}
        <button 
          onClick={() => setTab("home")} 
          className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`} 
        >
          <FaHouse className={styles.navIcon} />
          <span className={styles.teksNav}>Beranda</span>
        </button>

        {/* 2. JURNAL */}
        <button 
          onClick={() => setTab("jurnal")} 
          className={`${styles.navButton} ${tab === "jurnal" ? styles.navButtonActive : ""}`} 
        >
          <FaBookBookmark className={styles.navIcon} />
          <span className={styles.teksNav}>Jurnal</span>
        </button>
        
        {/* 3. SCAN (CENTER) */}
        <div className={styles.navButtonMid}>
          <button 
            onClick={() => setTab("scan")} 
            className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}
            aria-label="Scan QR"
          >
            <FaQrcode className={styles.scanIcon} />
          </button>
        </div>

        {/* 4. TUGAS */}
        <button 
          onClick={() => setTab("tugas")} 
          className={`${styles.navButton} ${tab === "tugas" ? styles.navButtonActive : ""}`} 
        >
          <FaBookOpen className={styles.navIcon} />
          <span className={styles.teksNav}>Tugas</span>
        </button>
        
        {/* 5. PROFIL */}
        <button 
          onClick={() => setTab("profil")} 
          className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`} 
        >
          <FaUserAstronaut className={styles.navIcon} />
          <span className={styles.teksNav}>Profil</span>
        </button>
      </nav>
    </div>
  );
}