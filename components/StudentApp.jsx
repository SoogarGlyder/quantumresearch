"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo, useEffect } from "react";
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

import styles from "./App.module.css";
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
// 🚀 FIX 1: Terima `latihanHariIni` dari app/page.tsx
export default function StudentApp({ siswa, riwayat, jadwal, statistik, latihanHariIni }) {
  const router = useRouter();

  const adaKonsulAktif = useMemo(() => riwayat?.some(
    r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id
  ), [riwayat]);

  const adaKelasAktif = useMemo(() => riwayat?.some(
    r => r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.BERJALAN.id
  ), [riwayat]);

  const [tab, setTab] = useState("home"); 
  const [modeScan, setModeScan] = useState(() => {
    if (adaKonsulAktif) return MODE_SCAN.KONSUL;
    return MODE_SCAN.KELAS;
  });

  const [hasilScan, setHasilScan] = useState("");
  const [pesanSistem, setPesanSistem] = useState("");
  const [sedangLoading, setSedangLoading] = useState(false);
  
  const [mapelPilihan, setMapelPilihan] = useState(() => {
    if (adaKonsulAktif) {
      const sesi = riwayat.find(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id);
      return sesi?.namaMapel || "";
    }
    return "";
  });

  const apakahError = cekPesanErrorScanner(pesanSistem);

  useEffect(() => {
    if (tab === "scan") {
      if (adaKonsulAktif) setModeScan(MODE_SCAN.KONSUL);
      if (adaKelasAktif) setModeScan(MODE_SCAN.KELAS);
    }
  }, [tab, adaKonsulAktif, adaKelasAktif]);

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

    let pesanErrorLokal = "";

    const isScanKonsul = teksDariKamera === PREFIX_BARCODE.KONSUL;
    const isScanKelas = teksDariKamera.startsWith(PREFIX_BARCODE.KELAS);

    if (adaKonsulAktif && isScanKonsul) {
      setModeScan(MODE_SCAN.KONSUL); 
    } 
    else if (adaKelasAktif && isScanKelas) {
      setModeScan(MODE_SCAN.KELAS); 
    }
    else {
      if (modeScan === MODE_SCAN.KELAS && !isScanKelas) { 
        pesanErrorLokal = "Ups! Ini bukan barcode Kelas."; 
      }
      else if (modeScan === MODE_SCAN.KONSUL && !isScanKonsul) { 
        pesanErrorLokal = "Ups! Arahkan ke barcode Konsul."; 
      }
      else if (modeScan === MODE_SCAN.KONSUL && (!mapelPilihan || mapelPilihan.trim() === "") && !adaKonsulAktif) { 
        pesanErrorLokal = "Oops! Silakan pilih mapel terlebih dahulu."; 
      }
    }

    if (pesanErrorLokal) {
      setHasilScan(teksDariKamera);
      setPesanSistem(pesanErrorLokal);
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
        if (!adaKelasAktif && !adaKonsulAktif) setMapelPilihan(""); 
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
        return (
          <TabBerandaSiswa 
            siswa={siswa} 
            jadwal={jadwal} 
            riwayat={riwayat} 
            setTab={setTab} 
            setModeScan={setModeScan} 
            resetScanner={resetScanner} 
            latihanHariIni={latihanHariIni} // 🚀 FIX 2: TERUSKAN KE BERANDA!
          />
        );
      case "scan":
        return (
          <TabScanSiswa 
            modeScan={modeScan} 
            setModeScan={setModeScan} 
            hasilScan={hasilScan} 
            pesanSistem={pesanSistem} 
            sedangLoading={sedangLoading} 
            mapelPilihan={mapelPilihan} 
            setMapelPilihan={setMapelPilihan} 
            saatBarcodeTerbaca={saatBarcodeTerbaca} 
            resetScanner={resetScanner} 
            apakahError={apakahError} 
            adaKonsulAktif={adaKonsulAktif}
            adaKelasAktif={adaKelasAktif}
          />
        );
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

  return (
    <div className={styles.mainContainer}>
      <main>
         {renderIsiTab()}
      </main>

      <nav className={styles.navMenu}>
        <button onClick={() => setTab("home")} className={`${styles.navButton} ${tab === "home" ? styles.navButtonActive : ""}`}>
          <FaHouse className={styles.navIcon} />
          <span className={styles.teksNav}>Beranda</span>
        </button>
        
        <button onClick={() => setTab("kelas")} className={`${styles.navButton} ${tab === "kelas" ? styles.navButtonActive : ""}`}>
          <FaCalendarCheck className={styles.navIcon} />
          <span className={styles.teksNav}>Kelas</span>
        </button>
        
        <div className={styles.navButtonMid}>
          <button onClick={() => setTab("scan")} className={`${styles.scanButton} ${tab === "scan" ? styles.scanButtonActive : ""}`}>
            <FaQrcode className={styles.scanIcon} />
          </button>
        </div>
        
        <button onClick={() => setTab("riwayat")} className={`${styles.navButton} ${tab === "riwayat" ? styles.navButtonActive : ""}`}>
          <FaClockRotateLeft className={styles.navIcon} />
          <span className={styles.teksNav}>Record</span>
        </button>

        <button onClick={() => setTab("profil")} className={`${styles.navButton} ${tab === "profil" ? styles.navButtonActive : ""}`}>
          <FaUserAstronaut className={styles.navIcon} />
          <span className={styles.teksNav}>Profil</span>
        </button>
      </nav>
    </div>
  );
}