"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import Image from "next/image"; 
import { Scanner } from "@yudiel/react-qr-scanner";

// 👈 Import Konstanta 
import { MODE_SCAN, OPSI_MAPEL_KONSUL } from "../../utils/constants";
import { FaQrcode, FaBookOpen, FaLightbulb, FaCircleCheck, FaCircleXmark } from "react-icons/fa6";

import styles from "../StudentApp.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB SCANNER SISWA)
// ============================================================================
export default function TabScanner({ 
  modeScan, setModeScan, hasilScan, pesanSistem, sedangLoading, 
  mapelPilihan, setMapelPilihan, saatBarcodeTerbaca, resetScanner, apakahError,
  adaKonsulAktif 
}) {

  // --- HELPER RENDER: VISUAL HASIL SCAN ---
  const dapatkanInfoVisual = () => {
    if (apakahError) {
      return {
        icon: <FaCircleXmark size={60} color="#ef4444" />,
        judul: "Oops!",
        warnaClass: styles.resultTitleError
      };
    }
    
    // Cek kata kunci untuk UI Sukses Pulang vs Sukses Datang
    if (pesanSistem?.includes("Selesai") || pesanSistem?.includes("Pulang")) {
      return {
        icon: <FaCircleCheck size={60} color="#22c55e" />,
        judul: "Sesi Selesai!",
        warnaClass: styles.resultTitleDone
      };
    }
    
    return {
      icon: <FaCircleCheck size={60} color="#2563eb" />,
      judul: "Selamat Belajar!",
      warnaClass: styles.resultTitleSuccess
    };
  };

  const infoVisual = dapatkanInfoVisual();

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={styles.contentArea}>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER HALAMAN */}
      {/* ------------------------------------------------------------- */}
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

      <div className={styles.contentContainer}>
        
        {/* ------------------------------------------------------------- */}
        {/* TAB PILIHAN MODE (KELAS / KONSUL) */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.tabScanContainer}>
          <div className={styles.wrapperRow}>
            <button 
              onClick={() => { setModeScan(MODE_SCAN.KELAS); resetScanner(); }} 
              className={`${styles.tabScanButton} ${modeScan === MODE_SCAN.KELAS ? styles.tabScanButtonActive : ""}`}
            >
              <FaBookOpen /> Kelas
            </button>
            
            <button 
              onClick={() => { setModeScan(MODE_SCAN.KONSUL); resetScanner(); }} 
              className={`${styles.tabScanButton} ${modeScan === MODE_SCAN.KONSUL ? styles.tabScanButtonActive : ""}`}
            >
              <FaLightbulb /> Konsul
            </button>
          </div>
          {modeScan === MODE_SCAN.KONSUL && (
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

        {/* ------------------------------------------------------------- */}
        {/* DROPDOWN MAPEL (KHUSUS KONSUL) */}
        {/* ------------------------------------------------------------- */}


        {/* ------------------------------------------------------------- */}
        {/* AREA KAMERA / HASIL SCAN */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.cameraFrame}>
          {!hasilScan ? (
            <div className={styles.containerCamera}>
              {/* Kamera Aktif */}
              <Scanner onScan={(hasil) => { 
                if (hasil && hasil.length > 0) saatBarcodeTerbaca(hasil[0].rawValue); 
              }} />
              <div className={styles.overlayDarkOutside}></div>
              <div className={styles.overlayCameraInside}></div>
            </div>
          ) : (
             <div className={`${styles.resultScreen} ${apakahError ? styles.resultScreenError : ""}`}>
              <div className={styles.resultIcon}>
                {infoVisual.icon}
              </div>
              <h2 className={`${styles.resultTitle} ${infoVisual.warnaClass}`}>
                {infoVisual.judul}
              </h2>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PESAN NOTIFIKASI SISTEM */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.containerMessage}>
          {sedangLoading ? (
            <div className={`${styles.messageBox} ${styles.messageLoading}`}>
              <p className={`${styles.messageText} ${styles.messageProcess}`}>Memproses data...</p>
            </div>
          ) : (
            pesanSistem && (
               <div className={`${styles.messageBox} ${apakahError ? styles.messageFail : styles.messageSuccess}`}>
                <p className={styles.messageText}>{pesanSistem}</p>
                <button onClick={resetScanner} className={styles.repeatButton}>
                  🔄 Scan Ulang
                </button>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}