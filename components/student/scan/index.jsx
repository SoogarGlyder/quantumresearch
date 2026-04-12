"use client";

import styles from "@/components/App.module.css";

// 🚀 IMPORT TETANGGA (LOKAL)
import HeaderScanner from "./HeaderScanner";
import ModeSelector from "./ModeSelector";
import CameraArea from "./CameraArea";
import MessageArea from "./MessageArea";

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