"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { 
  ambilDataDashboard, 
  ambilSemuaJadwal, 
  ambilAbsensiPengajar 
} from "../../actions/adminAction";
import { ambilSemuaPengajar } from "../../actions/teacherAction";
import { prosesLogout } from "../../actions/authAction";

import { KONFIGURASI_SISTEM, PERIODE_BELAJAR } from "../../utils/constants"; // 🚀 Tambah PERIODE_BELAJAR

import styles from "./AdminPage.module.css"; 

import { FaArrowRightFromBracket, FaQrcode, FaCalendarDays } from "react-icons/fa6"; // 🚀 Tambah Icon Kalender

import TabMonitoring from "../../components/admin/TabMonitoring";
import TabUser from "../../components/admin/TabUser";
import TabJurnal from "../../components/admin/TabJurnal"; 
import TabJadwal from "../../components/admin/TabJadwal";
import ModalQr from "../../components/admin/ModalQr"; 
import ErrorBoundary from "../../components/ui/ErrorBoundary";

// ============================================================================
// 1.5 HELPER: GENERATOR BULAN
// ============================================================================
function generateBulanOpsi(mulaiStr, akhirStr) {
  const opsi = [];
  const dMulai = new Date(mulaiStr);
  const dAkhir = new Date(akhirStr);
  
  // Set ke tanggal 1 agar looping bulannya tidak lompat
  let current = new Date(dMulai.getFullYear(), dMulai.getMonth(), 1);
  const end = new Date(dAkhir.getFullYear(), dAkhir.getMonth(), 1);
  
  while (current <= end) {
    const val = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const label = current.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    opsi.push({ value: val, label: label });
    current.setMonth(current.getMonth() + 1);
  }
  return opsi;
}

// ============================================================================
// 2. SUB-COMPONENT: ADMIN CONTENT (Logika Utama)
// ============================================================================
function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const tab = searchParams.get("tab") || "monitoring"; 
  
  // 🚀 LOGIKA BULAN GLOBAL
  const opsiBulan = useMemo(() => generateBulanOpsi(PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR), []);
  const currentMonthValue = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  // Default ke bulan ini (jika ada di opsi), atau bulan terakhir di periode belajar (jika sudah lewat)
  const defaultBulan = opsiBulan.find(o => o.value === currentMonthValue) ? currentMonthValue : opsiBulan[opsiBulan.length - 1]?.value;
  const bulanAktif = searchParams.get("bulan") || defaultBulan;
  
  const [isModalQrOpen, setIsModalQrOpen] = useState(false); 
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataPengajar, setDataPengajar] = useState([]); 
  const [dataJadwal, setDataJadwal] = useState([]); 
  const [dataAbsenStaf, setDataAbsenStaf] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // 🚀 PERBAIKAN: Fungsi Ganti Tab
  const gantiTab = (namaTabBaru) => {
    const params = new URLSearchParams();
    params.set("tab", namaTabBaru);
    // 💡 Jangan lupakan bulan yang sedang aktif saat ganti tab!
    if (searchParams.has("bulan")) {
      params.set("bulan", searchParams.get("bulan"));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 🚀 HANDLER: Ganti Bulan Global
  const handleGantiBulan = (e) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("bulan", val);
    params.delete("page"); // Reset pagination karena data berubah
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
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 🚀 GLOBAL MONTH SWITCHER (NEO BRUTALISM) */}
            <div style={{ 
              display: 'flex', alignItems: 'center', backgroundColor: 'white', 
              padding: '8px 16px', borderRadius: '12px', border: '3px solid #111827', 
              boxShadow: '3px 3px 0 #111827', gap: '8px' 
            }}>
              <FaCalendarDays color="#111827" size={18} />
              <select 
                value={bulanAktif} 
                onChange={handleGantiBulan}
                style={{ 
                  border: 'none', outline: 'none', backgroundColor: 'transparent', 
                  fontWeight: '900', color: '#111827', cursor: 'pointer', fontSize: '14px' 
                }}
              >
                {opsiBulan.map(opsi => (
                  <option key={opsi.value} value={opsi.value}>{opsi.label.toUpperCase()}</option>
                ))}
              </select>
            </div>

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

        {/* AREA KONTEN AKTIF (OPER VARIABEL bulanAktif) */}
        <div className={styles.areaKontenTab} role="tabpanel">
          <ErrorBoundary>
            {tab === "monitoring" && <TabMonitoring dataRiwayat={dataRiwayat} dataJadwal={dataJadwal} dataSiswa={dataSiswa} dataAbsenStaf={dataAbsenStaf} muatData={muatData} bulanAktif={bulanAktif} />}
            {tab === "jurnal" && <TabJurnal dataJadwal={dataJadwal} muatData={muatData} bulanAktif={bulanAktif} />}
            {tab === "jadwal" && <TabJadwal dataJadwal={dataJadwal} muatData={muatData} bulanAktif={bulanAktif} />}
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