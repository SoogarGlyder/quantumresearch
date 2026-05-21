"use client";

import { memo, useEffect } from "react";
import { FaBookOpen, FaLightbulb } from "react-icons/fa6";

// PATH ABSOLUTE
import { MODE_SCAN, OPSI_MAPEL_KONSUL } from "@/utils/constants";
import styles from "@/components/App.module.css";

const ModeSelector = memo(({ 
  modeScan, setModeScan, resetScanner, mapelPilihan, 
  setMapelPilihan, guruPilihan, setGuruPilihan, daftarGuru = [], //  FIX: Terima Props Guru
  adaKonsulAktif, adaKelasAktif 
}) => {
  
  useEffect(() => {
    if (adaKonsulAktif && modeScan !== MODE_SCAN.KONSUL) {
      setModeScan(MODE_SCAN.KONSUL);
    } else if (adaKelasAktif && modeScan !== MODE_SCAN.KELAS) {
      setModeScan(MODE_SCAN.KELAS);
    }
  }, [adaKonsulAktif, adaKelasAktif, modeScan, setModeScan]);

  return (
    <div className={styles.tabScanContainer}>
      <div className={styles.wrapperRow}>
        
        {(!adaKonsulAktif) && (
          <button 
            onClick={() => { setModeScan(MODE_SCAN.KELAS); resetScanner(); }} 
            className={`${styles.tabScanButton} ${modeScan === MODE_SCAN.KELAS ? styles.tabScanButtonActive : ""}`}
            style={adaKelasAktif ? { width: '100%', cursor: 'default' } : {}}
          >
            <FaBookOpen /> Kelas
          </button>
        )}
        
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

      {(adaKelasAktif || adaKonsulAktif) && (
        <div className={styles.scheduleOption}
          style={{
              backgroundColor: '#fecaca',
              borderColor: '#ef4444',
              textAlign: 'center',
              marginTop: '12px'
          }}>
          <span style={{ color: '#ef4444' , fontWeight: '900' , textAlign: 'center' }}>
            {adaKelasAktif ? "🛑 SCAN UNTUK SELESAI KELAS" : "🛑 SCAN UNTUK SELESAI KONSUL"}
          </span>
        </div>
      )}

      {modeScan === MODE_SCAN.KONSUL && !adaKelasAktif && !adaKonsulAktif && (
        //  FIX: Bungkus kedua dropdown dengan Flexbox agar rapi secara vertikal
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          
          <select 
            value={mapelPilihan} 
            onChange={(e) => setMapelPilihan(e.target.value)} 
            className={styles.scheduleOption}
          >
            <option value="">-- Pilih Mapel --</option>
            {OPSI_MAPEL_KONSUL.map(opsi => (
              <option key={opsi} value={opsi}>{opsi}</option>
            ))}
          </select>

          {/*  FIX: Dropdown Pilihan Guru */}
          <select 
            value={guruPilihan} 
            onChange={(e) => setGuruPilihan(e.target.value)} 
            className={styles.scheduleOption}
          >
            <option value="">-- Pilih Pendamping --</option>
            
            {/* OPSI BELAJAR MANDIRI */}
            <option value="MANDIRI" style={{ fontWeight: '900', color: '#2563eb' }}>
              Belajar Mandiri (Tanpa Pengajar)
            </option>

            {(daftarGuru || []).map(guru => (
              <option key={guru._id} value={guru._id}>
                {guru.nama}
              </option>
            ))}
          </select>

        </div>
      )}
    </div>
  );
});

ModeSelector.displayName = "ModeSelector";
export default ModeSelector;