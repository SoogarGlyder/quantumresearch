"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation"; 

import { absenPengajarAction } from "@/actions/scanAction"; 
import { PREFIX_BARCODE } from "@/utils/constants"; 
import styles from "@/components/App.module.css";

// 🚀 IMPORT KOMPONEN LOKAL
import HeaderScanner from "./HeaderScanner";
import InstruksiArea from "./InstruksiArea";
import CameraArea from "./CameraArea";
import MessageArea from "./MessageArea";
import DaftarAbsensiBulanIni from "./DaftarAbsensiBulanIni"; // <-- Tambahkan ini!

export default function TabScanPengajar({ absenAktif, absensi = [] }) { // <-- Tambah prop absensi
  const router = useRouter(); 
  const [hasilScan, setHasilScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [pesanSistem, setPesanSistem] = useState("");

  // 🚀 STATE & LOGIKA UNTUK DAFTAR ABSENSI DIPINDAH KE SINI
  const [idAbsenTerbuka, setIdAbsenTerbuka] = useState(null);
  const toggleAbsen = useCallback((id) => setIdAbsenTerbuka(prev => prev === id ? null : id), []);
  const riwayatAbsenBulanIni = useMemo(() => absensi || [], [absensi]);

  const isSudahMasuk = !!(absenAktif?.waktuMasuk && !absenAktif?.waktuKeluar);

  const resetScanner = useCallback(() => {
    router.refresh(); 
    setHasilScan(null);
    setLoading(false);
    setErrorStatus(false);
    setPesanSistem("");
  }, [router]);

  const saatBarcodeTerbaca = useCallback(async (teksQR) => {
    if (loading || hasilScan) return;

    if (teksQR !== PREFIX_BARCODE.ADMIN) {
        setHasilScan(teksQR);
        setErrorStatus(true);
        setPesanSistem("Ups! Gunakan barcode khusus Staf.");
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

      {/* 🚀 RENDER DAFTAR ABSENSI DI BAWAH SCANNER */}
      <DaftarAbsensiBulanIni 
        riwayatAbsenBulanIni={riwayatAbsenBulanIni} 
        idAbsenTerbuka={idAbsenTerbuka} 
        toggleAbsen={toggleAbsen} 
      />

    </div>
  );
}