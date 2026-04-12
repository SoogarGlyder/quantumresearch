"use client";

import { memo, useEffect } from "react";
import { FaBookOpen, FaLightbulb } from "react-icons/fa6";

// 🚀 PATH ABSOLUTE
import { MODE_SCAN, OPSI_MAPEL_KONSUL } from "@/utils/constants";
import styles from "@/components/App.module.css";

const ModeSelector = memo(({ 
  modeScan, setModeScan, resetScanner, mapelPilihan, 
  setMapelPilihan, adaKonsulAktif, adaKelasAktif 
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
        <div className={styles.wrapperRow} style={{ marginTop: '12px' }}>
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
        </div>
      )}
    </div>
  );
});

ModeSelector.displayName = "ModeSelector";
export default ModeSelector;