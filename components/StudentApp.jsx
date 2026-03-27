"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { prosesHasilScan } from "../actions/scanAction";
import { prosesLogout } from "../actions/authAction";

import { MODE_SCAN, PREFIX_BARCODE, TIPE_SESI, STATUS_SESI, KONFIGURASI_SISTEM } from "../utils/constants";
import { cekPesanErrorScanner } from "../utils/formatHelper";

import TabBerandaSiswa from "./student/TabBerandaSiswa";
import TabRiwayatSiswa from "./student/TabRiwayatSiswa";
import TabKelasSiswa from "./student/TabKelasSiswa";
import TabProfilSiswa from "./student/TabProfilSiswa"; 

import styles from "./StudentApp.module.css";
import { FaHouse, FaQrcode, FaClockRotateLeft, FaCalendarCheck, FaUserAstronaut } from "react-icons/fa6";

// ============================================================================
// 2. DYNAMIC IMPORTS (Lazy Loading)
// ============================================================================
const TabScanSiswa = dynamic(() => import("./student/TabScanSiswa"), { 
  ssr: false, 
  loading: () => (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px', color: '#2563eb' }}>
      <div className={styles.scanIcon} style={{ animation: 'pulse 1.5s infinite' }}>📷</div>
      <p style={{ fontWeight: '900', textTransform: 'uppercase' }}>Menyiapkan Kamera...</p>
    </div>
  ) 
});

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================
export default function StudentApp({ siswa, riwayat, jadwal, statistik }) {
  const router = useRouter();

  const [tab, setTab] = useState("home"); 
  const [modeScan, setModeScan] = useState(MODE_SCAN.KELAS);
  const [hasilScan, setHasilScan] = useState("");
  const [pesanSistem, setPesanSistem] = useState("");
  const [sedangLoading, setSedangLoading] = useState(false);
  const [mapelPilihan, setMapelPilihan] = useState("");

  const apakahError = cekPesanErrorScanner(pesanSistem);
  
  // 🛡️ ZERO HARDCODE: Deteksi Sesi Konsul Aktif menggunakan Konstanta
  const adaKonsulAktif = riwayat?.some(
    r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id
  );

  const resetScanner = () => { 
    setHasilScan(""); 
    setPesanSistem(""); 
  };

  const klikLogout = async () => { 
    await prosesLogout(); 
    router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
  };

  async function saatBarcodeTerbaca(teksDariKamera) {
    if (sedangLoading) return;

    if (modeScan === MODE_SCAN.KELAS && !teksDariKamera.startsWith(PREFIX_BARCODE.KELAS)) { 
      setPesanSistem("Ups! Ini bukan barcode Kelas."); 
      return; 
    }
    
    if (modeScan === MODE_SCAN.KONSUL && teksDariKamera !== PREFIX_BARCODE.KONSUL) { 
      setPesanSistem("Ups! Arahkan ke barcode Konsul."); 
      return; 
    }
    
    if (modeScan === MODE_SCAN.KONSUL && (!mapelPilihan || mapelPilihan.trim() === "") && !adaKonsulAktif) { 
      setPesanSistem("Oops! Silakan pilih mapel terlebih dahulu."); 
      return; 
    }

    setSedangLoading(true);
    setHasilScan(teksDariKamera);
    setPesanSistem("Mengirim data ke pusat...");

    try {
      const laporan = await prosesHasilScan(teksDariKamera, mapelPilihan);
      setPesanSistem(laporan.pesan);
      
      if (laporan.sukses) { 
        router.refresh();
        setMapelPilihan("");
      }
    } catch (error) {
      console.error("[ERROR Scanner]:", error);
      setPesanSistem("Gagal menghubungi server. Periksa koneksi.");
    } finally {
      setSedangLoading(false);
    }
  }

  const renderIsiTab = () => {
    switch (tab) {
      case "home":
        return <TabBerandaSiswa siswa={siswa} jadwal={jadwal} riwayat={riwayat} setTab={setTab} setModeScan={setModeScan} resetScanner={resetScanner} />;
      case "scan":
        return <TabScanSiswa modeScan={modeScan} setModeScan={setModeScan} hasilScan={hasilScan} pesanSistem={pesanSistem} sedangLoading={sedangLoading} mapelPilihan={mapelPilihan} setMapelPilihan={setMapelPilihan} saatBarcodeTerbaca={saatBarcodeTerbaca} resetScanner={resetScanner} apakahError={apakahError} adaKonsulAktif={adaKonsulAktif} />;
      case "riwayat":
        return <TabRiwayatSiswa riwayat={riwayat} />;
      case "kelas":
        return <TabKelasSiswa jadwal={jadwal} riwayat={riwayat} />;
      case "profil":
        return <TabProfilSiswa siswa={siswa} klikLogout={klikLogout} />;
      default:
        return null;
    }
  };

  // ============================================================================
  // 4. MAIN JSX RENDER
  // ============================================================================
  return (
    <div className={styles.mainContainer}>
      
      {/* KONTEN TAB DINAMIS */}
      {renderIsiTab()}

      {/* NAVIGASI BAWAH (5 MENU) */}
      <div className={styles.navMenu}>
        
        {/* Menu 1: Beranda */}
        <button onClick={() => setTab("home")} className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`}>
          <FaHouse className={styles.navIcon} />
          <span className={styles.teksNav}>Beranda</span>
        </button>
        
        {/* Menu 2: Kelas */}
        <button onClick={() => setTab("kelas")} className={`${styles.navButton} ${tab === "kelas" ? styles.navButtonActive : ""}`}>
          <FaCalendarCheck className={styles.navIcon} />
          <span className={styles.teksNav}>Kelas</span>
        </button>
        
        {/* Menu 3: Tombol Kamera (Tengah) */}
        <div className={styles.navButtonMid}>
          <button onClick={() => setTab("scan")} className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}>
            <FaQrcode className={styles.scanIcon} />
          </button>
        </div>
        
        {/* Menu 4: Riwayat/Record */}
        <button onClick={() => setTab("riwayat")} className={`${styles.navButton} ${tab === "riwayat" ? styles.navButtonActive : ""}`}>
          <FaClockRotateLeft className={styles.navIcon} />
          <span className={styles.teksNav}>Record</span>
        </button>

        {/* Menu 5: Profil */}
        <button onClick={() => setTab("profil")} className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`}>
          <FaUserAstronaut className={styles.navIcon} />
          <span className={styles.teksNav}>Profil</span>
        </button>

      </div>
    </div>
  );
}