"use client";

import { memo } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const CameraArea = memo(({ hasilScan, apakahError, pesanSistem, saatBarcodeTerbaca }) => {
  
  const dapatkanInfoVisual = () => {
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
        isError: true 
      };
    }
    
    if (pesanSistem?.includes("Selesai") || pesanSistem?.includes("Pulang") || pesanSistem?.includes("Check-out") || pesanSistem?.includes("dibatalkan")) {
      return {
        icon: <FaCircleCheck size={60} color="#22c55e" />,
        judul: "Sesi Selesai!",
        warnaClass: styles.resultTitleDone,
        isError: false
      };
    }
    
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
export default CameraArea;