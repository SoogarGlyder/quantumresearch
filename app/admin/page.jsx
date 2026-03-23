"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// 🛡️ Bersih: Hanya import fungsi yang dibutuhkan untuk operasional
import { ambilDataDashboard, ambilSemuaJadwal } from "../../actions/adminAction";
import { ambilSemuaPengajar } from "../../actions/teacherAction";
import { prosesLogout } from "../../actions/authAction";

import { KONFIGURASI_SISTEM } from "../../utils/constants";

import styles from "./AdminPage.module.css";
import { FaArrowRightFromBracket, FaQrcode } from "react-icons/fa6"; 

// Impor Komponen Tab & Modal
import TabMonitoring from "../../components/admin/TabMonitoring";
import TabUser from "../../components/admin/TabUser";
import TabJurnal from "../../components/admin/TabJurnal"; 
import TabJadwal from "../../components/admin/TabJadwal";
import ModalQr from "../../components/admin/ModalQr"; 
import ErrorBoundary from "../../components/ui/ErrorBoundary";

// ============================================================================
// 2. MAIN COMPONENT (SUPER DASHBOARD)
// ============================================================================
export default function SuperDashboardAdmin() {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [tab, setTab] = useState("monitoring"); 
  const [isModalQrOpen, setIsModalQrOpen] = useState(false); 
  
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataPengajar, setDataPengajar] = useState([]); 
  const [dataJadwal, setDataJadwal] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // --- HANDLERS ---
  const muatData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [hasilDashboard, hasilJadwal, hasilPengajar] = await Promise.all([
        ambilDataDashboard(),
        ambilSemuaJadwal(),
        ambilSemuaPengajar()
      ]);

      // 🛡️ Data Akses via .data (Standar ResponseHelper)
      if (hasilDashboard.sukses && hasilDashboard.data) { 
        setDataRiwayat(hasilDashboard.data.riwayat || []); 
        setDataSiswa(hasilDashboard.data.siswa || []); 
      } else { 
        router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
        return; 
      }

      if (hasilJadwal.sukses) setDataJadwal(hasilJadwal.data || []);
      if (hasilPengajar.sukses) setDataPengajar(hasilPengajar.data || []);

    } catch (error) {
      console.error("[ERROR muatData Admin]:", error);
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  // 🛠️ VERSI BERSIH: Hanya memanggil muatData saat halaman dibuka
  useEffect(() => { 
    muatData(); 
  }, [muatData]);

  const klikLogout = async () => { 
    await prosesLogout(); 
    router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
  };

  // --- RENDER HELPERS (Switch Tab) ---
  const renderIsiTab = () => {
    switch (tab) {
      case "monitoring": 
        return <TabMonitoring dataRiwayat={dataRiwayat} dataJadwal={dataJadwal} dataSiswa={dataSiswa} muatData={muatData} />;
      case "jurnal": 
        return <TabJurnal dataJadwal={dataJadwal} muatData={muatData} />;
      case "jadwal": 
        return <TabJadwal dataJadwal={dataJadwal} muatData={muatData} />;
      case "user":    
        return <TabUser dataSiswa={dataSiswa} dataPengajar={dataPengajar} muatData={muatData} />;
      default:       
        return null;
    }
  };

  if (loadingData) {
    return (
      <div className={styles.layarLoadingPenuh}>
        <div className={styles.kotakLoadingBrutal}>
          <h2 className={styles.judulLoading}>MEMUAT SISTEM...</h2>
          <div className={styles.pitaLoadingKecil}></div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. MAIN JSX RENDER
  // ============================================================================
  return (
    <div className={styles.wadahUtama}>
      <div className={styles.wadahKonten}>

        {/* HEADER ADMIN */}
        <div className={`${styles.headerAdmin} ${styles.SembunyiPrint}`}>
          <div>
            <h1 className={styles.judulHeader}>Super Admin</h1>
            <p className={styles.subJudulHeader}>Pusat Kendali Quantum Research</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsModalQrOpen(true)} 
              className={styles.tombolKeluar}
              style={{ backgroundColor: '#facc15', color: '#111827' }} 
            >
              <FaQrcode /> CETAK QR
            </button>

            <button onClick={klikLogout} className={styles.tombolKeluar}>
              <FaArrowRightFromBracket /> KELUAR
            </button>
          </div>
        </div>

        {/* NAVIGASI TAB */}
        <div className={`${styles.wadahTabs} ${styles.SembunyiPrint}`} role="tablist">
          <button 
            onClick={() => setTab("monitoring")} 
            className={`${styles.tombolTab} ${tab === "monitoring" ? styles.tombolTabAktif : ""}`}
          >
            📟 MONITORING
          </button>
          
          <button 
            onClick={() => setTab("jurnal")} 
            className={`${styles.tombolTab} ${tab === "jurnal" ? styles.tombolTabAktif : ""}`}
          >
            📓 JURNAL
          </button>
          
          <button 
            onClick={() => setTab("jadwal")} 
            className={`${styles.tombolTab} ${tab === "jadwal" ? styles.tombolTabAktif : ""}`}
          >
            📅 JADWAL
          </button>
          
          <button 
            onClick={() => setTab("user")} 
            className={`${styles.tombolTab} ${tab === "user" ? styles.tombolTabAktif : ""}`}
          >
            👥 USER
          </button>
        </div>

        {/* KONTEN AKTIF */}
        <div className={styles.areaKontenTab} role="tabpanel">
          <ErrorBoundary>
            {renderIsiTab()}
          </ErrorBoundary>
        </div>

        {/* MODAL QR */}
        <ModalQr 
          isOpen={isModalQrOpen} 
          onClose={() => setIsModalQrOpen(false)} 
        />

      </div>
    </div>
  );
}