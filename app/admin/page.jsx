"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { ambilDataDashboard, ambilSemuaJadwal } from "../../actions/adminAction";
import { ambilSemuaGuru } from "../../actions/teacherAction";
import { prosesLogout } from "../../actions/authAction";

import styles from "./AdminPage.module.css";
import { FaArrowRightFromBracket, FaQrcode } from "react-icons/fa6"; 

// Impor Komponen Terpadu & Modal
import TabMonitoring from "../../components/admin/TabMonitoring";
import TabUser from "../../components/admin/TabUser";
import TabJurnal from "../../components/admin/TabJurnal"; 
import TabJadwal from "../../components/admin/TabJadwal";
import ModalQr from "../../components/admin/ModalQr"; // 👈 Utility Modal Baru
import ErrorBoundary from "../../components/ui/ErrorBoundary";

// ============================================================================
// 2. MAIN COMPONENT (SUPER DASHBOARD)
// ============================================================================
export default function SuperDashboardAdmin() {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [tab, setTab] = useState("monitoring"); 
  const [isModalQrOpen, setIsModalQrOpen] = useState(false); // 👈 State Modal QR
  
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataGuru, setDataGuru] = useState([]); 
  const [dataJadwal, setDataJadwal] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // --- HANDLERS ---
  const muatData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [hasilDashboard, hasilJadwal, hasilGuru] = await Promise.all([
        ambilDataDashboard(),
        ambilSemuaJadwal(),
        ambilSemuaGuru()
      ]);

      if (hasilDashboard.sukses) { 
        setDataRiwayat(hasilDashboard.riwayat); 
        setDataSiswa(hasilDashboard.siswa); 
      } else { 
        router.push("/login"); 
        return; 
      }

      if (hasilJadwal.sukses) setDataJadwal(hasilJadwal.data);
      if (hasilGuru.sukses) setDataGuru(hasilGuru.data);

    } catch (error) {
      console.error("[ERROR muatData Admin]:", error);
      alert("⚠️ Gagal terhubung ke server.");
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => { 
    muatData(); 
  }, [muatData]);

  const klikLogout = async () => { 
    await prosesLogout(); 
    router.push("/login"); 
  };

  // --- RENDER HELPERS ---
  const renderIsiTab = () => {
    switch (tab) {
      case "monitoring": 
        return <TabMonitoring dataRiwayat={dataRiwayat} dataJadwal={dataJadwal} dataSiswa={dataSiswa} muatData={muatData} />;
      case "jurnal": 
        return <TabJurnal dataJadwal={dataJadwal} muatData={muatData} />;
      case "jadwal": 
        return <TabJadwal dataJadwal={dataJadwal} muatData={muatData} />;
      case "user":    
        return <TabUser dataSiswa={dataSiswa} dataGuru={dataGuru} muatData={muatData} />;
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

        {/* HEADER ADMIN (Pusat Aksi & Utilitas) */}
        <div className={`${styles.headerAdmin} ${styles.SembunyiPrint}`}>
          <div>
            <h1 className={styles.judulHeader}>Super Admin</h1>
            <p className={styles.subJudulHeader}>Pusat Kendali Quantum Research</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* 👇 TOMBOL UTILITY QR (Kuning Quantum) */}
            <button 
              onClick={() => setIsModalQrOpen(true)} 
              className={styles.tombolKeluar}
              style={{ backgroundColor: 'var(--brutal-kuning)', color: 'var(--brutal-hitam)' }}
            >
              <FaQrcode /> CETAK QR
            </button>

            <button onClick={klikLogout} className={styles.tombolKeluar}>
              <FaArrowRightFromBracket /> KELUAR
            </button>
          </div>
        </div>

        {/* MENU TABS (4 Pilar Utama) */}
        <div 
          className={`${styles.wadahTabs} ${styles.SembunyiPrint}`} 
          role="tablist" 
          aria-label="Navigasi Menu Admin"
        >
          <button 
            role="tab" aria-selected={tab === "monitoring"} 
            onClick={() => setTab("monitoring")} 
            className={`${styles.tombolTab} ${tab === "monitoring" ? styles.tombolTabAktif : ""}`}
          >
            📟 MONITORING
          </button>
          
          <button 
            role="tab" aria-selected={tab === "jurnal"} 
            onClick={() => setTab("jurnal")} 
            className={`${styles.tombolTab} ${tab === "jurnal" ? styles.tombolTabAktif : ""}`}
          >
            📓 JURNAL
          </button>
          
          <button 
            role="tab" aria-selected={tab === "jadwal"} 
            onClick={() => setTab("jadwal")} 
            className={`${styles.tombolTab} ${tab === "jadwal" ? styles.tombolTabAktif : ""}`}
          >
            📅 JADWAL
          </button>
          
          <button 
            role="tab" aria-selected={tab === "user"} 
            onClick={() => setTab("user")} 
            className={`${styles.tombolTab} ${tab === "user" ? styles.tombolTabAktif : ""}`}
          >
            👥 USER
          </button>
        </div>

        {/* AREA KONTEN TAB */}
        <div className={styles.areaKontenTab} role="tabpanel">
          <ErrorBoundary>
            {renderIsiTab()}
          </ErrorBoundary>
        </div>

        {/* 🛠️ MODAL UTILITY QR CODE */}
        <ModalQr 
          isOpen={isModalQrOpen} 
          onClose={() => setIsModalQrOpen(false)} 
        />

      </div>
    </div>
  );
}