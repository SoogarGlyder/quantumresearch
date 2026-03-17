"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState } from "react";
import QRCode from "react-qr-code"; 

import { PREFIX_BARCODE, OPSI_MAPEL_KELAS } from "../../utils/constants";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (PABRIK QR CODE)
// ============================================================================
export default function TabQrCode() {
  
  // --- STATE ---
  const [teksQR, setTeksQR] = useState(PREFIX_BARCODE.KONSUL);

  // --- HANDLERS ---
  const tanganiPerubahanInput = (e) => {
    setTeksQR(e.target.value.toUpperCase());
  };

  const tanganiTemplateKelas = (e) => {
    const mapel = e.target.value;
    if (mapel) {
      setTeksQR(`${PREFIX_BARCODE.KELAS}${mapel.toUpperCase()}`);
    }
  };

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.wadahQr}`}>
      
      {/* ------------------------------------------------------------- */}
      {/* KONTROL PABRIK QR (Akan disembunyikan saat di-print) */}
      {/* ------------------------------------------------------------- */}
      <div className={`${styles.SembunyiPrint} ${styles.wadahKontrolQr}`}>
        <h2 className={styles.judulPabrikQr}>Pabrik QR Code</h2>
        
        {/* Input Manual */}
        <input 
          type="text" 
          value={teksQR} 
          onChange={tanganiPerubahanInput} 
          className={styles.inputPabrikQr}
          placeholder="Ketik kode QR di sini..."
        />
        
        {/* Tombol Template Cepat */}
        <div className={styles.wadahTombolTemplateQr}>
          
          {/* Opsi 1: Generate QR Konsul */}
          <button 
            onClick={() => setTeksQR(PREFIX_BARCODE.KONSUL)} 
            className={styles.tombolTemplateKonsul}
          >
            💡 QR Konsul Bebas
          </button>
          
          {/* Opsi 2: Generate QR Kelas via Dropdown */}
          <select 
            onChange={tanganiTemplateKelas} 
            className={styles.tombolTemplateKelas}
            style={{ textAlign: 'center', outline: 'none' }}
            value="" 
          >
            <option value="" disabled>📚 Cetak QR Kelas (Pilih Mapel) ⬇️</option>
            {OPSI_MAPEL_KELAS.map(mapel => (
              <option key={mapel} value={mapel}>{mapel}</option>
            ))}
          </select>

        </div>
      </div>
      
      {/* ------------------------------------------------------------- */}
      {/* TAMPILAN QR KERTAS (Area yang akan ikut tercetak ke kertas) */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.qrBox}>
        {/* Library QR Code merender SVG yang anti-pecah saat dicetak besar */}
        <QRCode value={teksQR || "KOSONG"} size={250} />
        <p className={styles.teksHasilQr}>{teksQR}</p>
      </div>
      
      {/* ------------------------------------------------------------- */}
      {/* TOMBOL CETAK FISIK */}
      {/* ------------------------------------------------------------- */}
      <button 
        onClick={() => window.print()} 
        className={`${styles.SembunyiPrint} ${styles.tombolCetakQr}`}
      >
        🖨️ Cetak Barcode ke Kertas
      </button>
      
    </div>
  );
}