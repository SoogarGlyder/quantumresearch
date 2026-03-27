"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // 👈 Tambahan useSearchParams & usePathname

import { 
  ambilDataDashboard, 
  ambilSemuaJadwal, 
  ambilAbsensiPengajar 
} from "../../actions/adminAction";
import { ambilSemuaPengajar } from "../../actions/teacherAction";
import { prosesLogout } from "../../actions/authAction";

import { KONFIGURASI_SISTEM } from "../../utils/constants";

import styles from "./AdminPage.module.css"; 
import { FaArrowRightFromBracket, FaQrcode } from "react-icons/fa6"; 

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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // --- STATE MANAGEMENT ---
  // 🚀 LOGIKA BARU: Ambil tab dari URL, kalau tidak ada default ke "monitoring"
  const tab = searchParams.get("tab") || "monitoring"; 
  
  const [isModalQrOpen, setIsModalQrOpen] = useState(false); 
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataPengajar, setDataPengajar] = useState([]); 
  const [dataJadwal, setDataJadwal] = useState([]); 
  const [dataAbsenStaf, setDataAbsenStaf] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // --- HANDLERS ---

  // 🚀 FUNGSI BARU: Untuk mengubah tab sekaligus mengubah URL
  const gantiTab = (namaTabBaru) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", namaTabBaru);
    // Menggunakan replace agar tidak memenuhi history browser (tombol back)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const muatData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [hasilDashboard, hasilJadwal, hasilPengajar, hasilAbsenStaf] = await Promise.all([
        ambilDataDashboard(),
        ambilSemuaJadwal(),
        ambilSemuaPengajar(),
        ambilAbsensiPengajar()
      ]);

      if (hasilDashboard.sukses && hasilDashboard.data) { 
        setDataRiwayat(hasilDashboard.data.riwayat || []); 
        setDataSiswa(hasilDashboard.data.siswa || []); 
      } else { 
        router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
        return; 
      }

      if (hasilJadwal.sukses) setDataJadwal(hasilJadwal.data || []);
      if (hasilPengajar.sukses) setDataPengajar(hasilPengajar.data || []);
      if (hasilAbsenStaf.sukses) setDataAbsenStaf(hasilAbsenStaf.data || []);

    } catch (error) {
      console.error("[ERROR muatData Admin]:", error);
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => { 
    muatData(); 
  }, [muatData]);

  const klikLogout = async () => { 
    await prosesLogout(); 
    router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
  };

  const renderIsiTab = () => {
    switch (tab) {
      case "monitoring": 
        return (
          <TabMonitoring 
            dataRiwayat={dataRiwayat} 
            dataJadwal={dataJadwal} 
            dataSiswa={dataSiswa} 
            dataAbsenStaf={dataAbsenStaf}
            muatData={muatData} 
          />
        );
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

  return (
    <div className={styles.mainContainer}>
      <div className={styles.wadahKonten}>
        <div className={`${styles.headerAdmin} ${styles.SembunyiPrint}`}>
          <div>
            <h1 className={styles.judulHeader}>Super Admin</h1>
            <p className={styles.subJudulHeader}>Pusat Kendali Quantum Research</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsModalQrOpen(true)} className={styles.tombolKeluar} style={{ backgroundColor: '#facc15', color: '#111827' }}><FaQrcode /> CETAK QR</button>
            <button onClick={klikLogout} className={styles.tombolKeluar}><FaArrowRightFromBracket /> KELUAR</button>
          </div>
        </div>

        {/* 🚀 NAVIGASI TAB: Sekarang memanggil gantiTab() */}
        <div className={`${styles.wadahTabs} ${styles.SembunyiPrint}`} role="tablist">
          <button onClick={() => gantiTab("monitoring")} className={`${styles.tombolTab} ${tab === "monitoring" ? styles.tombolTabAktif : ""}`}>📟 MONITORING</button>
          <button onClick={() => gantiTab("jurnal")} className={`${styles.tombolTab} ${tab === "jurnal" ? styles.tombolTabAktif : ""}`}>📓 JURNAL</button>
          <button onClick={() => gantiTab("jadwal")} className={`${styles.tombolTab} ${tab === "jadwal" ? styles.tombolTabAktif : ""}`}>📅 JADWAL</button>
          <button onClick={() => gantiTab("user")} className={`${styles.tombolTab} ${tab === "user" ? styles.tombolTabAktif : ""}`}>👥 USER</button>
        </div>

        <div className={styles.areaKontenTab} role="tabpanel">
          <ErrorBoundary>{renderIsiTab()}</ErrorBoundary>
        </div>

        <ModalQr isOpen={isModalQrOpen} onClose={() => setIsModalQrOpen(false)} />
      </div>
    </div>
  );
}