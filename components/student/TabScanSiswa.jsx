"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { memo } from "react";
import Image from "next/image"; 
import { Scanner } from "@yudiel/react-qr-scanner";

// 👈 Import Konstanta 
import { MODE_SCAN, OPSI_MAPEL_KONSUL } from "../../utils/constants";
import { FaBookOpen, FaLightbulb, FaCircleCheck, FaCircleXmark, FaTriangleExclamation } from "react-icons/fa6";

import styles from "../App.module.css";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER (Pure & Memoized)
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
    <h1 className={styles.headerTitle}>Scan QR</h1>
  </div>
));
HeaderScanner.displayName = "HeaderScanner";

// ============================================================================
// 3. SUB-KOMPONEN: PEMILIH MODE & MAPEL (Logic: Mutual Exclusion)
// ============================================================================
const ModeSelector = memo(({ 
  modeScan, setModeScan, resetScanner, mapelPilihan, 
  setMapelPilihan, adaKonsulAktif, adaKelasAktif 
}) => {
  
  return (
    <div className={styles.tabScanContainer}>
      {/* 🚀 WRAPPER TOMBOL SWITCH: Menghilang salah satu jika ada sesi aktif */}
      <div className={styles.wrapperRow}>
        
        {/* Tombol KELAS: Hilang jika sedang KONSUL aktif */}
        {(!adaKonsulAktif) && (
          <button 
            onClick={() => { setModeScan(MODE_SCAN.KELAS); resetScanner(); }} 
            className={`${styles.tabScanButton} ${modeScan === MODE_SCAN.KELAS ? styles.tabScanButtonActive : ""}`}
            style={adaKelasAktif ? { width: '100%', cursor: 'default' } : {}}
          >
            <FaBookOpen /> Kelas
          </button>
        )}
        
        {/* Tombol KONSUL: Hilang jika sedang KELAS aktif */}
        {(!adaKelasAktif) && (
          <button 
            onClick={() => { setModeScan(MODE_SCAN.KONSUL); resetScanner(); }} 
            className={`${styles.tabScanButton} ${modeScan === MODE_SCAN.KONSUL ? styles.tabScanButtonActive : ""}`}
            style={adaKonsulAktif ? { width: '100%', cursor: 'default' } : {}}
          >
            <FaLightbulb /> Konsul
          </button>
        )}
      </div>

      {/* 🚀 PESAN PERINGATAN: Cuma muncul jika ada Kelas Aktif (Style Merah Brutalist) */}
      {adaKelasAktif && (
        <div className={styles.scheduleOption}
          style={{
              backgroundColor: '#fecaca',
              borderColor: '#ef4444',
              textAlign: 'center'
          }}>
          <span style={{ color: '#ef4444' , fontWeight: '900' , textAlign: 'center' }}>
            🛑 SCAN UNTUK SELESAI KELAS
          </span>
        </div>
      )}

      {/* DROPDOWN MAPEL KONSUL */}
      {modeScan === MODE_SCAN.KONSUL && !adaKelasAktif && (
        <div className={styles.wrapperRow}>
          <select 
            value={mapelPilihan} 
            onChange={(e) => setMapelPilihan(e.target.value)} 
            className={styles.scheduleOption}
            disabled={adaKonsulAktif}
            style={{
              backgroundColor: adaKonsulAktif ? '#fecaca' : '',
              borderColor: adaKonsulAktif ? '#ef4444' : ''
            }}
          >
            <option value="" style={{ color: adaKonsulAktif ? '#ef4444' : 'inherit', fontWeight: '900' , textAlign: 'center'}}>
              {adaKonsulAktif ? "🛑 SCAN UNTUK SELESAI KONSUL" : "-- Pilih Mapel --"}
            </option>
            {OPSI_MAPEL_KONSUL.map(opsi => (
              <option key={opsi} value={opsi}>{opsi}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});
ModeSelector.displayName = "ModeSelector";

// ============================================================================
// 4. SUB-KOMPONEN: AREA KAMERA & HASIL VISUAL (With Shake Effect on Error)
// ============================================================================
const CameraArea = memo(({ hasilScan, apakahError, pesanSistem, saatBarcodeTerbaca }) => {
  
  const dapatkanInfoVisual = () => {
    // 🛡️ Logika Penentuan Error (Termasuk Salah Barcode)
    const indikasiGagal = apakahError || 
                          pesanSistem?.includes("⚠️") || 
                          pesanSistem?.toLowerCase().includes("gagal") || 
                          pesanSistem?.toLowerCase().includes("salah") || 
                          pesanSistem?.toLowerCase().includes("bukan barcode") ||
                          pesanSistem?.toLowerCase().includes("oops");

    if (indikasiGagal) {
      return {
        icon: <FaCircleXmark size={60} color="#ef4444" />,
        judul: "Oops!",
        warnaClass: styles.resultTitleError,
        isError: true // Flag untuk memicu shake
      };
    }
    
    if (pesanSistem?.includes("Selesai") || pesanSistem?.includes("Pulang") || pesanSistem?.includes("Check-out")) {
      return {
        icon: <FaCircleCheck size={60} color="#22c55e" />,
        judul: "Sesi Selesai!",
        warnaClass: styles.resultTitleDone,
        isError: false
      };
    }
    
    return {
      icon: <FaCircleCheck size={60} color="#2563eb" />,
      judul: "Selamat Belajar!",
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
         /* 🚀 SHAKE EFFECT: styles.resultScreenError akan memicu animasi bergoyang */
         <div className={`${styles.resultScreen} ${infoVisual.isError ? styles.resultScreenError : ""}`}>
          <div className={styles.resultIcon}>
            {infoVisual.icon}
          </div>
          <h2 className={`${styles.resultTitle} ${infoVisual.warnaClass}`}>
            {infoVisual.judul}
          </h2>
        </div>
      )}
    </div>
  );
});
CameraArea.displayName = "CameraArea";

// ============================================================================
// 5. SUB-KOMPONEN: AREA PESAN NOTIFIKASI
// ============================================================================
const MessageArea = memo(({ sedangLoading, pesanSistem, apakahError, resetScanner }) => {
  const isMsgError = apakahError || 
                     pesanSistem?.includes("⚠️") || 
                     pesanSistem?.toLowerCase().includes("gagal") || 
                     pesanSistem?.toLowerCase().includes("salah");

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
              🔄 Scan Ulang
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
export default function TabScanner({ 
  modeScan, setModeScan, hasilScan, pesanSistem, sedangLoading, 
  mapelPilihan, setMapelPilihan, saatBarcodeTerbaca, resetScanner, apakahError,
  adaKonsulAktif, adaKelasAktif 
}) {

  return (
    <div className={styles.contentArea}>
      <HeaderScanner />
      <div className={styles.contentContainer}>
        <ModeSelector 
          modeScan={modeScan}
          setModeScan={setModeScan}
          resetScanner={resetScanner}
          mapelPilihan={mapelPilihan}
          setMapelPilihan={setMapelPilihan}
          adaKonsulAktif={adaKonsulAktif}
          adaKelasAktif={adaKelasAktif}
        />
        <CameraArea 
          hasilScan={hasilScan}
          apakahError={apakahError}
          pesanSistem={pesanSistem}
          saatBarcodeTerbaca={saatBarcodeTerbaca}
        />
        <MessageArea 
          sedangLoading={sedangLoading}
          pesanSistem={pesanSistem}
          apakahError={apakahError}
          resetScanner={resetScanner}
        />
      </div>
    </div>
  );
}