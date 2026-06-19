"use client";

import { memo, useEffect } from "react";
import { FaBookOpen, FaLightbulb } from "react-icons/fa6";
import { MODE_SCAN, OPSI_MAPEL_KONSUL } from "@/utils/constants";
import styles from "@/components/App.module.css";
import scanStyles from "@/components/student/scan/Scan.module.css";

const ModeSelector = memo(({
  modeScan, setModeScan, resetScanner, mapelPilihan,
  setMapelPilihan, guruPilihan, setGuruPilihan, daftarGuru = [],
  adaKonsulAktif, adaKelasAktif,
}) => {
  // Sinkronisasi mode scan dengan status sesi yang sedang berjalan
  useEffect(() => {
    if (adaKonsulAktif && modeScan !== MODE_SCAN.KONSUL) setModeScan(MODE_SCAN.KONSUL);
    else if (adaKelasAktif && modeScan !== MODE_SCAN.KELAS)  setModeScan(MODE_SCAN.KELAS);
  }, [adaKonsulAktif, adaKelasAktif, modeScan, setModeScan]);

  return (
    // tabScanContainer dari Scan.module.css; wrapperRow adalah utility shared dari App.module.css
    <div className={scanStyles.tabScanContainer}>
      <div className={styles.wrapperRow}>

        {/* Tab Kelas — tampil jika tidak ada sesi konsul aktif */}
        {!adaKonsulAktif && (
          <button
            onClick={() => { setModeScan(MODE_SCAN.KELAS); resetScanner(); }}
            className={`${scanStyles.tabScanButton} ${modeScan === MODE_SCAN.KELAS ? scanStyles.tabScanButtonActive : ""} ${adaKelasAktif ? scanStyles.tabButtonAktifPenuh : ""}`}
            aria-current={modeScan === MODE_SCAN.KELAS ? "page" : undefined}
          >
            <FaBookOpen /> Kelas
          </button>
        )}

        {/* Tab Konsul — tampil jika tidak ada sesi kelas aktif */}
        {!adaKelasAktif && (
          <button
            onClick={() => { setModeScan(MODE_SCAN.KONSUL); resetScanner(); }}
            className={`${scanStyles.tabScanButton} ${modeScan === MODE_SCAN.KONSUL ? scanStyles.tabScanButtonActive : ""} ${adaKonsulAktif ? scanStyles.tabButtonAktifPenuh : ""}`}
            aria-current={modeScan === MODE_SCAN.KONSUL ? "page" : undefined}
          >
            <FaLightbulb /> Konsul
          </button>
        )}
      </div>

      {/* Banner peringatan: scan untuk keluar sesi yang sedang berjalan */}
      {(adaKelasAktif || adaKonsulAktif) && (
        <div className={`${scanStyles.scheduleOption} ${scanStyles.bannerSesiAktif}`}>
          <span className={scanStyles.bannerSesiAktifTeks}>
            {adaKelasAktif ? "🛑 SCAN UNTUK SELESAI KELAS" : "🛑 SCAN UNTUK SELESAI KONSUL"}
          </span>
        </div>
      )}

      {/* Dropdown pilih mapel & guru — hanya saat mode Konsul dan tidak ada sesi aktif */}
      {modeScan === MODE_SCAN.KONSUL && !adaKelasAktif && !adaKonsulAktif && (
        <div className={scanStyles.wrapperDropdownKonsul}>
          <select
            value={mapelPilihan}
            onChange={(e) => setMapelPilihan(e.target.value)}
            className={scanStyles.scheduleOption}
            aria-label="Pilih mata pelajaran konsul"
          >
            <option value="">-- Pilih Mapel --</option>
            {OPSI_MAPEL_KONSUL.map((opsi) => (
              <option key={opsi} value={opsi}>{opsi}</option>
            ))}
          </select>

          <select
            value={guruPilihan}
            onChange={(e) => setGuruPilihan(e.target.value)}
            className={scanStyles.scheduleOption}
            aria-label="Pilih pendamping konsul"
          >
            <option value="">-- Pilih Pendamping --</option>
            <option value="MANDIRI">Belajar Mandiri (Tanpa Pengajar)</option>
            {(daftarGuru || []).map((guru) => (
              <option key={guru._id} value={guru._id}>{guru.nama}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});

ModeSelector.displayName = "ModeSelector";
export default ModeSelector;