"use client";

import { memo } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import scanStyles from "@/components/teacher/scan/Scan.module.css";

const CameraArea = memo(({ hasilScan, apakahError, pesanSistem, saatBarcodeTerbaca }) => {
  const dapatkanInfoVisual = () => {
    const indikasiGagal =
      apakahError ||
      pesanSistem?.includes("⚠️") ||
      pesanSistem?.toLowerCase().includes("ups") ||
      pesanSistem?.toLowerCase().includes("gagal");

    if (indikasiGagal) {
      return {
        icon:       <FaCircleXmark size={60} color="#ef4444" />,
        judul:      "Oops!",
        warnaClass: scanStyles.resultTitleError,
        isError:    true,
      };
    }

    if (
      pesanSistem?.toLowerCase().includes("out") ||
      pesanSistem?.toLowerCase().includes("pulang") ||
      pesanSistem?.toLowerCase().includes("terima kasih")
    ) {
      return {
        icon:       <FaCircleCheck size={60} color="#22c55e" />,
        judul:      "Selesai!",
        warnaClass: scanStyles.resultTitleDone,
        isError:    false,
      };
    }

    return {
      icon:       <FaCircleCheck size={60} color="#2563eb" />,
      judul:      "Berhasil!",
      warnaClass: scanStyles.resultTitleSuccess,
      isError:    false,
    };
  };

  const infoVisual = dapatkanInfoVisual();

  return (
    <div className={scanStyles.cameraFrame}>
      {!hasilScan ? (
        <div className={scanStyles.containerCamera}>
          <Scanner
            onScan={(hasil) => {
              if (hasil?.length > 0) saatBarcodeTerbaca(hasil[0].rawValue);
            }}
          />
          <div className={scanStyles.overlayDarkOutside} />
          <div className={scanStyles.overlayCameraInside} />
        </div>
      ) : (
        <div
          className={`${scanStyles.resultScreen} ${infoVisual.isError ? scanStyles.resultScreenError : ""}`}
        >
          <div className={scanStyles.resultIcon}>{infoVisual.icon}</div>
          <h2 className={`${scanStyles.resultTitle} ${infoVisual.warnaClass}`}>
            {infoVisual.judul}
          </h2>
        </div>
      )}
    </div>
  );
});

CameraArea.displayName = "CameraArea";
export default CameraArea;