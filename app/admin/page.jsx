"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { 
  ambilDataDashboard, 
  ambilSemuaJadwal, 
  ambilAbsensiPengajar,
  ambilSemuaAdmin,
  ambilPengajarCabang 
} from "../../actions/adminAction";

import { prosesLogout, dapatkanSesiAktif } from "../../actions/authAction"; 
import { KONFIGURASI_SISTEM, PERIODE_BELAJAR, PANGKAT_PENGAJAR, CABANG_QUANTUM } from "../../utils/constants"; 

import styles from "./AdminPage.module.css"; 

import { FaArrowRightFromBracket, FaCalendarDays, FaDesktop, FaLock, FaArrowsRotate, FaHouse } from "react-icons/fa6"; 

import TabMonitoring from "../../components/admin/TabMonitoring";
import TabUser from "../../components/admin/TabUser";
import TabJurnal from "../../components/admin/TabJurnal"; 
import TabJadwal from "../../components/admin/TabJadwal";
import ModalQr from "../../components/admin/ModalQr"; 
import ErrorBoundary from "../../components/ui/ErrorBoundary";
import TabSoal from "../../components/admin/TabSoal"; 
import TabKuis from "../../components/admin/TabKuis"; 
import ModalLogout from "../../components/ui/ModalLogout"; //FIX: Import Komponen Pop-up

// ============================================================================
// 1.5 HELPER: GENERATOR BULAN
// ============================================================================
function generateBulanOpsi(mulaiStr, akhirStr) {
  const opsi = [];
  const dMulai = new Date(mulaiStr);
  const dAkhir = new Date(akhirStr);
  
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
  
  const opsiBulan = useMemo(() => generateBulanOpsi(PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR), []);
  const currentMonthValue = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const defaultBulan = opsiBulan.find(o => o.value === currentMonthValue) ? currentMonthValue : opsiBulan[opsiBulan.length - 1]?.value;
  const bulanAktif = searchParams.get("bulan") || defaultBulan;
  
  const [isModalQrOpen, setIsModalQrOpen] = useState(false); 
  const [isModalLogoutOpen, setIsModalLogoutOpen] = useState(false); //FIX: State untuk Modal Logout
  
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataPengajar, setDataPengajar] = useState([]); 
  const [dataJadwal, setDataJadwal] = useState([]); 
  const [dataAbsenStaf, setDataAbsenStaf] = useState([]); 
  const [dataAdmin, setDataAdmin] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  const [adminIdAktif, setAdminIdAktif] = useState("000000000000000000000000");
  const [pangkatAktif, setPangkatAktif] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); 

  const [peranUser, setPeranUser] = useState("");

  const [judulAdmin, setJudulAdmin] = useState("Memuat...");
  const [subJudulAdmin, setSubJudulAdmin] = useState("Pusat Kendali Quantum Research");

  const [isLayarKecil, setIsLayarKecil] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const cekLayar = () => {
      setIsLayarKecil(window.innerWidth < 1024);
    };

    cekLayar();
    window.addEventListener("resize", cekLayar);
    return () => window.removeEventListener("resize", cekLayar);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const gantiTab = (namaTabBaru) => {
    const params = new URLSearchParams();
    params.set("tab", namaTabBaru);
    if (searchParams.has("bulan")) {
      params.set("bulan", searchParams.get("bulan"));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleGantiBulan = (e) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("bulan", val);
    params.delete("page"); 
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const muatData = useCallback(async (targetTab = "SEMUA") => {
    setLoadingData(true);
    try {
      const sesi = await dapatkanSesiAktif();
      if (!sesi || !sesi.userId) {
        router.push(KONFIGURASI_SISTEM.PATH_LOGIN);
        return;
      }
      
      const peranAktif = sesi.peran;
      const pangkatAktifUser = sesi.pangkat || "";

      if (peranAktif === "pengajar" && pangkatAktifUser !== PANGKAT_PENGAJAR.STAFF_AKADEMIK && pangkatAktifUser !== PANGKAT_PENGAJAR.KAKAK_ASUH) {
        router.push("/"); 
        return;
      }

      setAdminIdAktif(sesi.userId);
      setPangkatAktif(pangkatAktifUser);
      setPeranUser(peranAktif);
      
      const modeSuper = sesi.kodeCabang === CABANG_QUANTUM.PUSAT.id;
      setIsSuperAdmin(modeSuper);
      const isModeKakakAsuh = pangkatAktifUser === PANGKAT_PENGAJAR.KAKAK_ASUH;

      const objekCabang = Object.values(CABANG_QUANTUM).find(c => c.id === sesi.kodeCabang);
      const namaCabang = objekCabang ? (objekCabang.label || objekCabang.nama || "Cabang") : "Cabang";

      if (modeSuper) {
        setJudulAdmin("Super Admin");
        setSubJudulAdmin("Pusat Kendali Quantum Research");
      } else {
        let suffix = "";
        if (pangkatAktifUser === PANGKAT_PENGAJAR.KAKAK_ASUH) suffix = " (Kakak Asuh)";
        else if (pangkatAktifUser === PANGKAT_PENGAJAR.STAFF_AKADEMIK) suffix = " (Staff)";
        
        setJudulAdmin(`Admin ${namaCabang}${suffix}`);
        setSubJudulAdmin(`Pusat Kendali Quantum Research ${namaCabang}`);
      }

      let butuhDashboard = false;
      let butuhJadwal = false;
      let butuhPengajar = false;
      let butuhAbsen = false;
      let butuhAdmin = false;

      if (targetTab === "SEMUA" || targetTab === "monitoring") {
        butuhDashboard = true; butuhJadwal = true; butuhPengajar = true;
        if (!isModeKakakAsuh) butuhAbsen = true;
      } else if (targetTab === "jurnal") {
        butuhJadwal = true; 
      } else if (targetTab === "jadwal") {
        butuhJadwal = true; butuhPengajar = true;
      } else if (targetTab === "user") {
        butuhDashboard = true; butuhPengajar = true;
        if (modeSuper) butuhAdmin = true;
      } else if (targetTab === "soal") {
        butuhDashboard = true; 
      }

      const namaKunci = [];
      const antrianPanggilan = [];

      if (butuhDashboard) { antrianPanggilan.push(ambilDataDashboard()); namaKunci.push("dashboard"); }
      if (butuhJadwal)    { antrianPanggilan.push(ambilSemuaJadwal()); namaKunci.push("jadwal"); }
      if (butuhPengajar)  { antrianPanggilan.push(ambilPengajarCabang()); namaKunci.push("pengajar"); }
      if (butuhAbsen)     { antrianPanggilan.push(ambilAbsensiPengajar()); namaKunci.push("absen"); }
      if (butuhAdmin)     { antrianPanggilan.push(ambilSemuaAdmin()); namaKunci.push("admin"); }

      const hasilApi = await Promise.all(antrianPanggilan);
      
      const hasil = {};
      namaKunci.forEach((kunci, index) => {
        hasil[kunci] = hasilApi[index];
      });

      if (hasil.dashboard?.sukses) { 
        setDataRiwayat(hasil.dashboard.data.riwayat || []); 
        setDataSiswa(hasil.dashboard.data.siswa || []); 
      }
      if (hasil.jadwal?.sukses)   setDataJadwal(hasil.jadwal.data || []);
      if (hasil.pengajar?.sukses) setDataPengajar(hasil.pengajar.data || []);
      if (hasil.absen?.sukses)    setDataAbsenStaf(hasil.absen.data || []);
      if (hasil.admin?.sukses)    setDataAdmin(hasil.admin.data || []);

      if (targetTab === "SEMUA" && !hasil.dashboard?.sukses) {
        router.push(KONFIGURASI_SISTEM.PATH_LOGIN);
      }

    } catch (error) {
      console.error("[ERROR muatData Admin]:", error);
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => { 
    muatData("SEMUA"); 
  }, [muatData]);

  const handleRefresh = async () => {
    if (isRefreshing || cooldown > 0) return; 
    
    setIsRefreshing(true);
    await muatData(tab); 
    setIsRefreshing(false);
    
    setCooldown(3); 
  };

  const klikLogout = async () => { 
    setIsModalLogoutOpen(false); // Tutup modal saat loading
    await prosesLogout(); 
    router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
  };

  if (isLayarKecil) {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', 
        padding: '24px', textAlign: 'center', overflow: 'hidden'
      }}>
        <div style={{ 
          backgroundColor: '#ef4444', padding: '30px', borderRadius: '24px', 
          border: '6px solid #facc15', boxShadow: '8px 8px 0 #facc15',
          maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' 
        }}>
          <FaLock size={64} color="#111827" />
          <h1 style={{ margin: 0, color: 'white', fontWeight: '900', fontSize: '24px', textTransform: 'uppercase', lineHeight: '1.2' }}>Akses <br/> Diblokir</h1>
          <p style={{ margin: 0, color: '#fef08a', fontWeight: 'bold', fontSize: '15px', lineHeight: '1.5' }}>
            Ruang Super Admin memuat tabel data besar dan Papan Catur <i>Drag & Drop</i>.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#111827', padding: '12px 16px', borderRadius: '12px', marginTop: '10px' }}>
            <FaDesktop color="#4ade80" size={24} />
            <span style={{ color: 'white', fontWeight: '900', fontSize: '14px', textAlign: 'left' }}>
              Silakan akses halaman ini menggunakan PC, Laptop, atau Tablet (Landscape).
            </span>
          </div>
          <button 
            onClick={() => router.push('/')} 
            style={{ 
              marginTop: '16px', padding: '14px 24px', backgroundColor: '#facc15', color: '#111827', 
              border: '4px solid #111827', borderRadius: '12px', fontWeight: '900', fontSize: '16px', 
              cursor: 'pointer', width: '100%', textTransform: 'uppercase' 
            }}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const isModeKakakAsuh = pangkatAktif === PANGKAT_PENGAJAR.KAKAK_ASUH;

  return (
    <div className={styles.mainContainer}>
      <style>{`
        .spin-icon {
          animation: putar-refresh 1s linear infinite;
        }
        @keyframes putar-refresh {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className={styles.wadahKonten}>
        
        <div className={`${styles.headerAdmin} ${styles.SembunyiPrint}`}>
          <div>
            <h1 className={styles.judulHeader}>{judulAdmin}</h1>
            <p className={styles.subJudulHeader}>{subJudulAdmin}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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

            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing || cooldown > 0}
              className={styles.tombolKeluar} 
              style={{ 
                backgroundColor: (isRefreshing || cooldown > 0) ? '#e5e7eb' : '#facc15', 
                color: (isRefreshing || cooldown > 0) ? '#9ca3af' : 'black',
                cursor: (isRefreshing || cooldown > 0) ? 'not-allowed' : 'pointer',
                minWidth: '130px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaArrowsRotate className={isRefreshing ? "spin-icon" : ""} /> 
              {isRefreshing ? "MEMUAT..." : cooldown > 0 ? `TUNGGU (${cooldown}s)` : "REFRESH"}
            </button>

            {peranUser === "pengajar" ? (
              <button onClick={() => router.push('/')} className={styles.tombolKeluar}>
                <FaHouse /> BERANDA
              </button>
            ) : (
              //FIX: Ubah trigger dari logout langsung menjadi buka Modal
              <button onClick={() => setIsModalLogoutOpen(true)} className={styles.tombolKeluar}>
                <FaArrowRightFromBracket /> KELUAR
              </button>
            )}

          </div>
        </div>

        <div className={`${styles.wadahTabs} ${styles.SembunyiPrint}`} role="tablist">
          <button onClick={() => gantiTab("monitoring")} className={`${styles.tombolTab} ${tab === "monitoring" ? styles.tombolTabAktif : ""}`}>📟 MONITORING</button>
          <button onClick={() => gantiTab("jurnal")} className={`${styles.tombolTab} ${tab === "jurnal" ? styles.tombolTabAktif : ""}`}>📓 JURNAL</button>
          <button onClick={() => gantiTab("jadwal")} className={`${styles.tombolTab} ${tab === "jadwal" ? styles.tombolTabAktif : ""}`}>📅 JADWAL</button>
          <button onClick={() => gantiTab("user")} className={`${styles.tombolTab} ${tab === "user" ? styles.tombolTabAktif : ""}`}>👥 USER</button>
          
          {!isModeKakakAsuh && (
            <>
              <button onClick={() => gantiTab("soal")} className={`${styles.tombolTab} ${tab === "soal" ? styles.tombolTabAktif : ""}`}>📚 TUGAS</button>
              <button onClick={() => gantiTab("kuis")} className={`${styles.tombolTab} ${tab === "kuis" ? styles.tombolTabAktif : ""}`}>🧠 CBT</button>
            </>
          )}
        </div>

        <div className={styles.areaKontenTab} role="tabpanel">
          <ErrorBoundary>
            {tab === "monitoring" && <TabMonitoring dataRiwayat={dataRiwayat} dataJadwal={dataJadwal} dataSiswa={dataSiswa} dataAbsenStaf={dataAbsenStaf} dataPengajar={dataPengajar} muatData={() => muatData("monitoring")} bulanAktif={bulanAktif} isKakakAsuh={isModeKakakAsuh} />}
            {tab === "jurnal" && <TabJurnal dataJadwal={dataJadwal} muatData={() => muatData("jurnal")} bulanAktif={bulanAktif} />}
            {tab === "jadwal" && <TabJadwal dataJadwal={dataJadwal} muatData={() => muatData("jadwal")} bulanAktif={bulanAktif} adminId={adminIdAktif} isKakakAsuh={isModeKakakAsuh} isSuperAdmin={isSuperAdmin} />}
            
            {tab === "user" && <TabUser dataSiswa={dataSiswa} dataPengajar={dataPengajar} dataAdmin={dataAdmin} muatData={() => muatData("user")} isKakakAsuh={isModeKakakAsuh} isSuperAdmin={isSuperAdmin} />}
            
            {tab === "soal" && !isModeKakakAsuh && <TabSoal dataSiswa={dataSiswa} />}
            {tab === "kuis" && !isModeKakakAsuh && <TabKuis adminId={adminIdAktif} />}
          </ErrorBoundary>
        </div>

        <ModalQr isOpen={isModalQrOpen} onClose={() => setIsModalQrOpen(false)} />
        
        {/*FIX: Pasang Modal Logout di Dasar Komponen Admin */}
        <ModalLogout 
          isOpen={isModalLogoutOpen} 
          onClose={() => setIsModalLogoutOpen(false)} 
          onConfirm={klikLogout} 
        />
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