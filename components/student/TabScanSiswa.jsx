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
        warnaClass: styles.teksHasilJudulError
      };
    }
    
    // Cek kata kunci untuk UI Sukses Pulang vs Sukses Datang
    if (pesanSistem?.includes("Selesai") || pesanSistem?.includes("Pulang")) {
      return {
        icon: <FaCircleCheck size={60} color="#22c55e" />,
        judul: "Sesi Selesai!",
        warnaClass: styles.teksHasilJudulSelesai
      };
    }
    
    return {
      icon: <FaCircleCheck size={60} color="#2563eb" />,
      judul: "Selamat Belajar!",
      warnaClass: styles.teksHasilJudulSukses
    };
  };

  const infoVisual = dapatkanInfoVisual();

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={styles.areaKontenScanner}>
      
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

      <div className={styles.contentArea}>
        
        {/* ------------------------------------------------------------- */}
        {/* TAB PILIHAN MODE (KELAS / KONSUL) */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.wadahTabScan}>
          <button 
            onClick={() => { setModeScan(MODE_SCAN.KELAS); resetScanner(); }} 
            className={`${styles.tombolTabScan} ${modeScan === MODE_SCAN.KELAS ? styles.tombolTabScanAktif : ""}`}
          >
            <FaBookOpen /> Kelas
          </button>
          
          <button 
            onClick={() => { setModeScan(MODE_SCAN.KONSUL); resetScanner(); }} 
            className={`${styles.tombolTabScan} ${modeScan === MODE_SCAN.KONSUL ? styles.tombolTabScanAktif : ""}`}
          >
            <FaLightbulb /> Konsul
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DROPDOWN MAPEL (KHUSUS KONSUL) */}
        {/* ------------------------------------------------------------- */}
        {modeScan === MODE_SCAN.KONSUL && (
          <div className={styles.wadahPilihMapel}>
            <label className={styles.labelPilihMapel}>Pilih Mata Pelajaran</label>
            <select 
              value={mapelPilihan} 
              onChange={(e) => setMapelPilihan(e.target.value)} 
              className={styles.opsiMapel}
              disabled={adaKonsulAktif}
              style={{
                backgroundColor: adaKonsulAktif ? '#fecaca' : '',
                borderColor: adaKonsulAktif ? '#ef4444' : ''
              }}
            >
              <option value="" style={{ color: adaKonsulAktif ? '#ef4444' : 'inherit', fontWeight: '900' }}>
                {adaKonsulAktif ? "🛑 SCAN UNTUK SELESAI" : "-- Pilih Mapel --"}
              </option>
              
              {OPSI_MAPEL_KONSUL.map(opsi => (
                <option key={opsi} value={opsi}>{opsi}</option>
              ))}
            </select>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* AREA KAMERA / HASIL SCAN */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.bingkaiKamera}>
          {!hasilScan ? (
            <div className={styles.wadahKamera}>
              {/* Kamera Aktif */}
              <Scanner onScan={(hasil) => { 
                if (hasil && hasil.length > 0) saatBarcodeTerbaca(hasil[0].rawValue); 
              }} />
              <div className={styles.overlayKameraGelap}></div>
              <div className={styles.overlayKameraKotak}></div>
            </div>
          ) : (
             <div className={`${styles.layarHasil} ${apakahError ? styles.layarHasilError : ""}`}>
              <div className={styles.iconHasilBesar}>
                {infoVisual.icon}
              </div>
              <h2 className={`${styles.teksHasilJudul} ${infoVisual.warnaClass}`}>
                {infoVisual.judul}
              </h2>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PESAN NOTIFIKASI SISTEM */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.wadahPesan}>
          {sedangLoading ? (
            <div className={`${styles.kotakPesan} ${styles.kotakPesanLoading}`}>
              <p className={`${styles.teksPesan} ${styles.teksPesanMemproses}`}>Memproses data...</p>
            </div>
          ) : (
            pesanSistem && (
               <div className={`${styles.kotakPesan} ${apakahError ? styles.pesanGagal : styles.pesanSukses}`}>
                <p className={styles.teksPesan}>{pesanSistem}</p>
                <button onClick={resetScanner} className={styles.tombolUlangi}>
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