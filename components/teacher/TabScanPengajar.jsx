"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useCallback, memo } from "react";
import Image from "next/image"; 
import { useRouter } from "next/navigation"; 
import { Scanner } from "@yudiel/react-qr-scanner";

import { absenPengajarAction } from "../../actions/scanAction"; 
import { PREFIX_BARCODE } from "../../utils/constants"; 
import styles from "../App.module.css";

import { 
  FaClockRotateLeft, FaCircleCheck, FaCircleXmark, 
  FaUserClock 
} from "react-icons/fa6";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER
// ============================================================================
const HeaderScanner = memo(() => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <h1 className={styles.headerTitle}>Presensi Staf</h1>
  </div>
));
HeaderScanner.displayName = "HeaderScanner";

// ============================================================================
// 3. SUB-KOMPONEN: INSTRUKSI AREA (Style Brutalist Dinamis)
// ============================================================================
const InstruksiArea = memo(({ isSudahMasuk }) => (
  <div className={styles.tabScanContainer}>
    <div 
      className={styles.scheduleOption}
      style={{
        backgroundColor: isSudahMasuk ? '#fecaca' : '#fef08a', // Merah muda vs Kuning
        borderColor: isSudahMasuk ? '#ef4444' : '#facc15',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px',
        boxShadow: '4px 4px 0 #111827',
        borderWidth: '3px'
      }}
    >
      <span style={{ color: isSudahMasuk ? '#ef4444' : '#111827', fontWeight: '900', textTransform: 'uppercase' }}>
        {isSudahMasuk ? '🛑 SCAN UNTUK CLOCK-OUT' : '🟢 SCAN UNTUK CLOCK-IN'}
      </span>
    </div>
  </div>
));
InstruksiArea.displayName = "InstruksiArea";

// ============================================================================
// 4. SUB-KOMPONEN: AREA KAMERA & HASIL (Logic Visual & Shake)
// ============================================================================
const CameraArea = memo(({ hasilScan, apakahError, pesanSistem, saatBarcodeTerbaca }) => {
  
  const dapatkanInfoVisual = () => {
    // Deteksi Error
    const indikasiGagal = apakahError || 
                          pesanSistem?.includes("⚠️") || 
                          pesanSistem?.toLowerCase().includes("ups") ||
                          pesanSistem?.toLowerCase().includes("gagal");

    if (indikasiGagal) {
      return {
        icon: <FaCircleXmark size={60} color="#ef4444" />,
        judul: "Oops!",
        warnaClass: styles.resultTitleError,
        isError: true
      };
    }
    
    // UI Selesai (Clock-Out)
    if (pesanSistem?.toLowerCase().includes("out") || pesanSistem?.toLowerCase().includes("pulang") || pesanSistem?.toLowerCase().includes("terima kasih")) {
      return {
        icon: <FaCircleCheck size={60} color="#22c55e" />,
        judul: "Selesai!",
        warnaClass: styles.resultTitleDone,
        isError: false
      };
    }
    
    // UI Berhasil (Clock-In)
    return {
      icon: <FaCircleCheck size={60} color="#2563eb" />,
      judul: "Berhasil!",
      warnaClass: styles.resultTitleSuccess,
      isError: false
    };
  };

  const infoVisual = dapatkanInfoVisual();

  return (
    <div className={styles.cameraFrame}>
      {!hasilScan ? (
        <div className={styles.containerCamera}>
          <Scanner onScan={(hasil) => { 
            if (hasil && hasil.length > 0) saatBarcodeTerbaca(hasil[0].rawValue); 
          }} />
          <div className={styles.overlayDarkOutside}></div>
          <div className={styles.overlayCameraInside}></div>
        </div>
      ) : (
         <div className={`${styles.resultScreen} ${infoVisual.isError ? styles.resultScreenError : ""}`}>
          <div className={styles.resultIcon}>{infoVisual.icon}</div>
          <h2 className={`${styles.resultTitle} ${infoVisual.warnaClass}`}>{infoVisual.judul}</h2>
        </div>
      )}
    </div>
  );
});
CameraArea.displayName = "CameraArea";

// ============================================================================
// 5. SUB-KOMPONEN: MESSAGE AREA
// ============================================================================
const MessageArea = memo(({ sedangLoading, pesanSistem, apakahError, resetScanner }) => {
  const isMsgError = apakahError || pesanSistem?.includes("⚠️") || pesanSistem?.toLowerCase().includes("ups");

  return (
    <div className={styles.containerMessage}>
      {sedangLoading ? (
        <div className={`${styles.messageBox} ${styles.messageLoading}`}>
          <p className={`${styles.messageText} ${styles.messageProcess}`}>Memproses data...</p>
        </div>
      ) : (
        pesanSistem && (
           <div className={`${styles.messageBox} ${isMsgError ? styles.messageFail : styles.messageSuccess}`}>
            <p className={styles.messageText}>{pesanSistem}</p>
            <button onClick={resetScanner} className={styles.repeatButton}>
              <FaClockRotateLeft /> Scan Ulang
            </button>
          </div>
        )
      )}
    </div>
  );
});
MessageArea.displayName = "MessageArea";

// ============================================================================
// 6. MAIN EXPORT COMPONENT
// ============================================================================
export default function TabScanPengajar({ absenAktif }) {
  const router = useRouter(); 
  const [hasilScan, setHasilScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [pesanSistem, setPesanSistem] = useState("");

  // TRUE jika ada waktuMasuk tapi belum ada waktuKeluar
  const isSudahMasuk = !!(absenAktif?.waktuMasuk && !absenAktif?.waktuKeluar);

  // 🚀 LOGIKA MANUAL REFRESH: Sinkronisasi data dipicu saat tombol ditekan
  const resetScanner = useCallback(() => {
    router.refresh(); // Ambil data props 'absenAktif' terbaru dari server
    
    setHasilScan(null);
    setLoading(false);
    setErrorStatus(false);
    setPesanSistem("");
  }, [router]);

  const saatBarcodeTerbaca = useCallback(async (teksQR) => {
    if (loading || hasilScan) return;

    // 🛡️ Validasi Lokal
    if (teksQR !== PREFIX_BARCODE.ADMIN) {
        setHasilScan(teksQR);
        setErrorStatus(true);
        setPesanSistem("Ups! Gunakan barcode khusus Staf.");
        return;
    }

    setLoading(true);
    setHasilScan(teksQR);
    setPesanSistem("Memverifikasi Kehadiran...");

    try {
      const hasil = await absenPengajarAction(teksQR, null);
      
      setErrorStatus(!hasil.sukses);
      setPesanSistem(hasil.pesan);

      // 🛑 router.refresh() dipindahkan ke resetScanner() 
      // agar UI instruksi tidak langsung berubah otomatis.
      
    } catch (err) {
      setErrorStatus(true);
      setPesanSistem("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasilScan]);

  return (
    <div className={styles.contentArea}>
      <HeaderScanner />

      <div className={styles.contentContainer}>
        {!hasilScan && <InstruksiArea isSudahMasuk={isSudahMasuk} />}
        
        <CameraArea 
          hasilScan={hasilScan}
          apakahError={errorStatus}
          pesanSistem={pesanSistem}
          saatBarcodeTerbaca={saatBarcodeTerbaca}
        />

        <MessageArea 
          sedangLoading={loading}
          pesanSistem={pesanSistem}
          apakahError={errorStatus}
          resetScanner={resetScanner}
        />
      </div>
    </div>
  );
}