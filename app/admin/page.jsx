"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { 
  ambilDataDashboard, 
  ambilSemuaJadwal, 
  ambilAbsensiPengajar 
} from "../../actions/adminAction";
import { ambilSemuaPengajar } from "../../actions/teacherAction";
import { prosesLogout } from "../../actions/authAction";

import { KONFIGURASI_SISTEM } from "../../utils/constants";

// ⚠️ Pastikan nama file .module.css ini sesuai dengan di folder Anda
import styles from "./AdminPage.module.css"; 

import { FaArrowRightFromBracket, FaQrcode } from "react-icons/fa6"; 

import TabMonitoring from "../../components/admin/TabMonitoring";
import TabUser from "../../components/admin/TabUser";
import TabJurnal from "../../components/admin/TabJurnal"; 
import TabJadwal from "../../components/admin/TabJadwal";
import ModalQr from "../../components/admin/ModalQr"; 
import ErrorBoundary from "../../components/ui/ErrorBoundary";

// ============================================================================
// 2. SUB-COMPONENT: ADMIN CONTENT (Logika Utama)
// ============================================================================
function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const tab = searchParams.get("tab") || "monitoring"; 
  
  const [isModalQrOpen, setIsModalQrOpen] = useState(false); 
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataPengajar, setDataPengajar] = useState([]); 
  const [dataJadwal, setDataJadwal] = useState([]); 
  const [dataAbsenStaf, setDataAbsenStaf] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // 🚀 PERBAIKAN: Fungsi Ganti Tab (Clean State)
  // Fungsi ini membuang parameter lama (seperti sub=... atau page=...) 
  // agar tab baru mulai dari kondisi default yang bersih.
  const gantiTab = (namaTabBaru) => {
    const params = new URLSearchParams(); // Membuat params baru yang kosong
    params.set("tab", namaTabBaru);
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
        
        {/* HEADER ADMIN */}
        <div className={`${styles.headerAdmin} ${styles.SembunyiPrint}`}>
          <div>
            <h1 className={styles.judulHeader}>Super Admin</h1>
            <p className={styles.subJudulHeader}>Pusat Kendali Quantum Research</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsModalQrOpen(true)} className={styles.tombolKeluar} style={{ backgroundColor: '#facc15', color: '#111827' }}>
              <FaQrcode /> CETAK QR
            </button>
            <button onClick={klikLogout} className={styles.tombolKeluar}>
              <FaArrowRightFromBracket /> KELUAR
            </button>
          </div>
        </div>

        {/* NAVIGASI TAB UTAMA */}
        <div className={`${styles.wadahTabs} ${styles.SembunyiPrint}`} role="tablist">
          <button onClick={() => gantiTab("monitoring")} className={`${styles.tombolTab} ${tab === "monitoring" ? styles.tombolTabAktif : ""}`}>📟 MONITORING</button>
          <button onClick={() => gantiTab("jurnal")} className={`${styles.tombolTab} ${tab === "jurnal" ? styles.tombolTabAktif : ""}`}>📓 JURNAL</button>
          <button onClick={() => gantiTab("jadwal")} className={`${styles.tombolTab} ${tab === "jadwal" ? styles.tombolTabAktif : ""}`}>📅 JADWAL</button>
          <button onClick={() => gantiTab("user")} className={`${styles.tombolTab} ${tab === "user" ? styles.tombolTabAktif : ""}`}>👥 USER</button>
        </div>

        {/* AREA KONTEN AKTIF */}
        <div className={styles.areaKontenTab} role="tabpanel">
          <ErrorBoundary>
            {tab === "monitoring" && <TabMonitoring dataRiwayat={dataRiwayat} dataJadwal={dataJadwal} dataSiswa={dataSiswa} dataAbsenStaf={dataAbsenStaf} muatData={muatData} />}
            {tab === "jurnal" && <TabJurnal dataJadwal={dataJadwal} muatData={muatData} />}
            {tab === "jadwal" && <TabJadwal dataJadwal={dataJadwal} muatData={muatData} />}
            {tab === "user" && <TabUser dataSiswa={dataSiswa} dataPengajar={dataPengajar} muatData={muatData} />}
          </ErrorBoundary>
        </div>

        {/* MODAL QR */}
        <ModalQr isOpen={isModalQrOpen} onClose={() => setIsModalQrOpen(false)} />
      </div>
    </div>
  );
}

// ============================================================================
// 3. EXPORT UTAMA (DENGAN SUSPENSE BOUNDARY)
// ============================================================================
export default function SuperDashboardAdmin() {
  return (
    <Suspense fallback={
      <div className={styles.layarLoadingPenuh}>
        <div className={styles.kotakLoadingBrutal}>
          <h2 className={styles.judulLoading}>MENGHUBUNGKAN...</h2>
          <div className={styles.pitaLoadingKecil}></div>
        </div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}