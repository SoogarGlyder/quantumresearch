"use client";

import { useState, useCallback, useMemo, useRef } from "react"; // 🚀 Tambah useRef
import { useRouter } from "next/navigation"; 

import { absenPengajarAction } from "@/actions/scanAction"; 
import { PREFIX_BARCODE } from "@/utils/constants"; 
import styles from "@/components/App.module.css";

import HeaderScanner from "./HeaderScanner";
import InstruksiArea from "./InstruksiArea";
import CameraArea from "./CameraArea";
import MessageArea from "./MessageArea";
import DaftarAbsensiBulanIni from "./DaftarAbsensiBulanIni";

export default function TabScanPengajar({ absenAktif, absensi = [] }) { 
  const router = useRouter(); 
  const [hasilScan, setHasilScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [pesanSistem, setPesanSistem] = useState("");
  const [idAbsenTerbuka, setIdAbsenTerbuka] = useState(null);
  const toggleAbsen = useCallback((id) => setIdAbsenTerbuka(prev => prev === id ? null : id), []);
  const riwayatAbsenBulanIni = useMemo(() => absensi || [], [absensi]);
  const isSudahMasuk = !!(absenAktif?.waktuMasuk && !absenAktif?.waktuKeluar);
  const isCooldownRef = useRef(false);
  const resetScanner = useCallback(() => {
    router.refresh(); 
    setHasilScan(null);
    setLoading(false);
    setErrorStatus(false);
    setPesanSistem("");
    isCooldownRef.current = false;
  }, [router]);

  const saatBarcodeTerbaca = useCallback(async (teksQR) => {
    if (loading || hasilScan || isCooldownRef.current) return;
    isCooldownRef.current = true;
    if (teksQR !== PREFIX_BARCODE.ADMIN) {
        setHasilScan(teksQR);
        setErrorStatus(true);
        setPesanSistem("Ups! Gunakan barcode khusus Staf.");
        setTimeout(() => { isCooldownRef.current = false; }, 3000);
        return;
    }

    setLoading(true);
    setHasilScan(teksQR);
    setPesanSistem("Memverifikasi Kehadiran...");

    try {
      const hasil = await absenPengajarAction(teksQR, null);
      setErrorStatus(!hasil.sukses);
      setPesanSistem(hasil.pesan);
    } catch (err) {
      setErrorStatus(true);
      setPesanSistem("Gagal menghubungi server.");
    } finally {
      setLoading(false);
      setTimeout(() => { isCooldownRef.current = false; }, 3000);
    }
  }, [loading, hasilScan]);

  return (
    <div className={styles.contentArea}>
      <HeaderScanner />

      <div className={styles.contentContainer}>
        {!hasilScan && <InstruksiArea isSudahMasuk={isSudahMasuk} />}
        
        <CameraArea 
          hasilScan={hasilScan}
          apakahError={errorStatus}
          pesanSistem={pesanSistem}
          saatBarcodeTerbaca={saatBarcodeTerbaca}
        />

        <MessageArea 
          sedangLoading={loading}
          pesanSistem={pesanSistem}
          apakahError={errorStatus}
          resetScanner={resetScanner}
        />
      </div>

      <DaftarAbsensiBulanIni 
        riwayatAbsenBulanIni={riwayatAbsenBulanIni} 
        idAbsenTerbuka={idAbsenTerbuka} 
        toggleAbsen={toggleAbsen} 
      />

    </div>
  );
}