"use client";

import { memo } from "react";
import { FaLock, FaCirclePlay, FaGamepad } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/student/home/Home.module.css";

const QuizHariIni = memo(({ kuisHariIni, riwayatSesiIni, pesanKuis, onBukaKuis }) => {
  if (!kuisHariIni || kuisHariIni.isSudahDikerjakan) {
    return (
      <div className={styles.contentContainer}>
        <h3 className={styles.contentTitle}>
          <FaGamepad className={homeStyles.ikonBiru} /> Daftar Pre-Test
        </h3>
        <p className={homeStyles.emptySchedule}>Yeay! Tidak ada Pre-Test untukmu saat ini.</p>
      </div>
    );
  }

  const isSudahScanIn = !!(riwayatSesiIni?.waktuMulai);

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaGamepad className={homeStyles.ikonBiru} /> Pre-Test Aktif
      </h3>

      {/* Pesan error buka kuis — menggantikan alert() */}
      {pesanKuis && (
        <p className={`${homeStyles.emptySchedule} ${homeStyles.nilaiStatMerah}`}
          style={{ marginBottom: 8 }}>
          {pesanKuis}
        </p>
      )}

      <div className={homeStyles.missionList}>
        <div
          className={isSudahScanIn ? homeStyles.kartuKuis : homeStyles.kartuKuisLocked}
          onClick={isSudahScanIn ? () => onBukaKuis(kuisHariIni) : undefined}
        >
          <div className={homeStyles.innerKuis}>
            <div className={homeStyles.ikonKuisWrap}>
              <div className={isSudahScanIn ? homeStyles.ikonKuisBiru : homeStyles.ikonKuisAbu}>
                <FaGamepad size={18} />
              </div>
              <div>
                <h4 className={`${homeStyles.judulKuis} ${!isSudahScanIn ? homeStyles.judulKuisLocked : ""}`}>
                  {kuisHariIni.mapel} — {kuisHariIni.bab || "Pre-Test"}
                </h4>
                <span className={homeStyles.infoSoal}>
                  Jumlah Soal: {kuisHariIni.jumlahSoal || 0} Butir
                </span>
              </div>
            </div>

            {isSudahScanIn ? (
              <button className={homeStyles.tombolKerjakanKuis}>
                Kerjakan Sekarang <FaCirclePlay size={12} />
              </button>
            ) : (
              <button disabled className={homeStyles.tombolScanDulu}>
                <FaLock size={12} /> Scan Masuk Dulu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

QuizHariIni.displayName = "QuizHariIni";
export default QuizHariIni;