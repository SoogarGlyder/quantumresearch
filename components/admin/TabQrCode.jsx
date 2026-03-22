"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState } from "react";
import QRCode from "react-qr-code"; 

// 👈 Import Otak Utama (Prefix Barcode & Daftar Mapel)
import { PREFIX_BARCODE, OPSI_MAPEL_KELAS } from "../../utils/constants";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (PABRIK QR CODE)
// ============================================================================
export default function TabQrCode() {
  
  // --- STATE (Default ke QR Konsul sesuai Konstitusi) ---
  const [teksQR, setTeksQR] = useState(PREFIX_BARCODE.KONSUL);

  // --- HANDLERS ---
  const tanganiPerubahanInput = (e) => {
    setTeksQR(e.target.value.toUpperCase());
  };

  const tanganiTemplateKelas = (e) => {
    const mapel = e.target.value;
    if (mapel) {
      // 🛡️ ZERO HARDCODE: Menggabungkan prefix resmi dengan nama mapel
      setTeksQR(`${PREFIX_BARCODE.KELAS}${mapel.toUpperCase()}`);
    }
  };

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.wadahQr}`}>
      
      {/* KONTROL PABRIK QR (Disembunyikan saat print) */}
      <div className={`${styles.SembunyiPrint} ${styles.wadahKontrolQr}`}>
        <h2 className={styles.judulPabrikQr}>Pabrik QR Code Resmi</h2>
        
        {/* Input Manual */}
        <input 
          type="text" 
          value={teksQR} 
          onChange={tanganiPerubahanInput} 
          className={styles.inputPabrikQr}
          placeholder="Ketik kode QR manual..."
        />
        
        {/* Tombol Template Cepat */}
        <div className={styles.wadahTombolTemplateQr}>
          
          {/* Opsi 1: Reset ke QR Konsul */}
          <button 
            onClick={() => setTeksQR(PREFIX_BARCODE.KONSUL)} 
            className={styles.tombolTemplateKonsul}
          >
            💡 QR KONSUL BEBAS
          </button>
          
          {/* Opsi 2: Generate QR Kelas via Dropdown Resmi */}
          <select 
            onChange={tanganiTemplateKelas} 
            className={styles.tombolTemplateKelas}
            style={{ textAlign: 'center', outline: 'none' }}
            value="" 
          >
            <option value="" disabled>📚 TEMPLATE QR KELAS (PILIH MAPEL) ⬇️</option>
            {OPSI_MAPEL_KELAS.map(mapel => (
              <option key={mapel} value={mapel}>{mapel}</option>
            ))}
          </select>

        </div>
      </div>
      
      {/* TAMPILAN QR KERTAS (Area Cetak Fisik) */}
      <div className={styles.qrBox}>
        <QRCode value={teksQR || "KOSONG"} size={250} />
        <p className={styles.teksHasilQr}>{teksQR}</p>
      </div>
      
      <button 
        onClick={() => window.print()} 
        className={`${styles.SembunyiPrint} ${styles.tombolCetakQr}`}
      >
        🖨️ CETAK BARCODE KE KERTAS
      </button>
      
    </div>
  );
}