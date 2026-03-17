"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic"; 

import { ambilDataDashboard, ambilSemuaJadwal } from "../../actions/adminAction";
import { prosesLogout } from "../../actions/authAction";

import styles from "./AdminPage.module.css";
import { FaArrowRightFromBracket } from "react-icons/fa6";

import TabKelas from "../../components/admin/TabKelas";
import TabJurnal from "../../components/admin/TabJurnal"; 
import TabKonsul from "../../components/admin/TabKonsul";
import TabJadwal from "../../components/admin/TabJadwal";
import TabSiswa from "../../components/admin/TabSiswa";

// ============================================================================
// 2. DYNAMIC IMPORTS (Lazy Loading)
// ============================================================================
const TabQrCode = dynamic(() => import("../../components/admin/TabQrCode"), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: '#111827' }}>
      <div className={styles.pitaLoadingKecil}></div>
      <p style={{ fontWeight: '900', marginTop: '16px', textTransform: 'uppercase' }}>Memuat Mesin Cetak QR...</p>
    </div>
  )
});

// ============================================================================
// 3. MAIN COMPONENT (SUPER DASHBOARD)
// ============================================================================
export default function SuperDashboardAdmin() {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [tab, setTab] = useState("kelas"); 
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataJadwal, setDataJadwal] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // --- HANDLERS ---
  const muatData = useCallback(async () => {
    setLoadingData(true);
    
    try {
      const [hasilDashboard, hasilJadwal] = await Promise.all([
        ambilDataDashboard(),
        ambilSemuaJadwal()
      ]);

      if (hasilDashboard.sukses) { 
        setDataRiwayat(hasilDashboard.riwayat); 
        setDataSiswa(hasilDashboard.siswa); 
      } else { 
        router.push("/login"); 
        return; 
      }

      if (hasilJadwal.sukses) {
        setDataJadwal(hasilJadwal.data);
      }

    } catch (error) {
      console.error("[ERROR muatData Admin]:", error);
      alert("⚠️ Gagal terhubung ke server. Periksa koneksi internet Anda.");
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
      case "kelas":  return <TabKelas dataRiwayat={dataRiwayat} dataJadwal={dataJadwal} dataSiswa={dataSiswa} muatData={muatData} />;
      case "jurnal": return <TabJurnal dataJadwal={dataJadwal} muatData={muatData} />;
      case "jadwal": return <TabJadwal dataJadwal={dataJadwal} muatData={muatData} />;
      case "konsul": return <TabKonsul dataRiwayat={dataRiwayat} />;
      case "siswa":  return <TabSiswa dataSiswa={dataSiswa} muatData={muatData} />;
      case "qrcode": return <TabQrCode />;
      default:       return null;
    }
  };

  // --- RENDER LOADING STATE (Neo-Brutalism) ---
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
  // 4. MAIN JSX RENDER
  // ============================================================================
  return (
    <div className={styles.wadahUtama}>
      <div className={styles.wadahKonten}>

        {/* HEADER ADMIN (Disembunyikan saat nge-print) */}
        <div className={`${styles.headerAdmin} ${styles.SembunyiPrint}`}>
          <div>
            <h1 className={styles.judulHeader}>Super Admin</h1>
            <p className={styles.subJudulHeader}>Pusat Kendali Quantum Research</p>
          </div>
          <button onClick={klikLogout} className={styles.tombolKeluar}>
            <FaArrowRightFromBracket /> Keluar
          </button>
        </div>

        {/* MENU TABS (Disembunyikan saat nge-print) */}
        <div className={`${styles.wadahTabs} ${styles.SembunyiPrint}`}>
          <button onClick={() => setTab("kelas")} className={`${styles.tombolTab} ${tab === "kelas" ? styles.tombolTabAktif : ""}`}>📚 Absensi</button>
          <button onClick={() => setTab("jurnal")} className={`${styles.tombolTab} ${tab === "jurnal" ? styles.tombolTabAktif : ""}`}>📓 Jurnal</button>
          <button onClick={() => setTab("jadwal")} className={`${styles.tombolTab} ${tab === "jadwal" ? styles.tombolTabAktif : ""}`}>📅 Jadwal</button>
          <button onClick={() => setTab("konsul")} className={`${styles.tombolTab} ${tab === "konsul" ? styles.tombolTabAktif : ""}`}>💡 Konsul</button>
          <button onClick={() => setTab("siswa")} className={`${styles.tombolTab} ${tab === "siswa" ? styles.tombolTabAktif : ""}`}>👥 Siswa</button>
          <button onClick={() => setTab("qrcode")} className={`${styles.tombolTab} ${tab === "qrcode" ? styles.tombolTabAktif : ""}`}>🖨️ Cetak QR</button>
        </div>

        {/* AREA KONTEN TAB */}
        <div className={styles.areaKontenTab}>
          {renderIsiTab()}
        </div>

      </div>
    </div>
  );
}