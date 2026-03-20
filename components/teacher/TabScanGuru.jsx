"use client";

import { useState, useCallback } from "react";
import Image from "next/image"; 
import { Scanner } from "@yudiel/react-qr-scanner";
import { 
  FaClockRotateLeft, FaCircleCheck, FaCircleXmark, 
  FaUserClock, FaCameraRotate, FaHandPointer 
} from "react-icons/fa6";

import styles from "../TeacherApp.module.css";

// Simbol konstanta untuk validasi (Bisa dipindah ke constants.js nanti)
const QR_ADMIN_VALID = "ADMIN_QUANTUM_ABSEN";

export default function TabScanGuru() {
  // --- STATE MANAGEMENT ---
  const [hasilScan, setHasilScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [pesanSistem, setPesanSistem] = useState("");

  // --- HANDLERS ---
  const resetScanner = () => {
    setHasilScan(null);
    setLoading(false);
    setErrorStatus(false);
    setPesanSistem("");
  };

  // Gunakan useCallback untuk mencegah re-render scanner yang tidak perlu
  const handleScan = useCallback(async (result) => {
    if (loading || hasilScan) return;

    const teksQR = result?.[0]?.rawValue || result; // Handle berbagai versi library
    if (!teksQR) return;

    setLoading(true);
    setHasilScan(teksQR);
    setPesanSistem("Memverifikasi lokasi & waktu...");

    // Simulasi Network Latency
    await new Promise(resolve => setTimeout(resolve, 1200));

    // LOGIKA VALIDASI (Nanti diganti Server Action: absenGuruAction(teksQR))
    if (teksQR === QR_ADMIN_VALID) {
      setErrorStatus(false);
      setPesanSistem("Absensi Berhasil! Jam masuk tercatat otomatis.");
    } else {
      setErrorStatus(true);
      setPesanSistem("⚠️ Barcode salah! Gunakan QR Code di meja Admin.");
    }
    setLoading(false);
  }, [loading, hasilScan]);

  return (
    <div className={styles.areaKontenScanner}>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER (Sesuai Standar Beranda & Profil) */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.headerHalaman}>
        <div className={styles.hiasanBulat1}></div>
        <div className={styles.hiasanBulat2}></div>
        <div className={styles.wadahLogoTengah}>
          <div className={styles.kotakLogo}>
            <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} className={styles.logoScannerPudar} priority />
          </div>
        </div>
        <h1 className={styles.judulHalaman}>Presensi Staf</h1>
      </div>

      <div className={styles.areaKonten} style={{ padding: '20px' }}>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: KAMERA SCANNER */}
        {/* ------------------------------------------------------------- */}
        {!hasilScan ? (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {/* Box Instruksi */}
            <div style={{ background: '#fef08a', border: '3px solid #111827', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '4px 4px 0 #111827' }}>
              <FaUserClock size={28} />
              <div>
                <p style={{ margin: 0, fontWeight: '900', fontSize: '14px' }}>Clock-In / Out</p>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#4b5563' }}>Scan barcode di meja pendaftaran Admin.</p>
              </div>
            </div>

            {/* Bingkai Scanner */}
            <div className={styles.bingkaiKamera} style={{ position: 'relative', overflow: 'hidden' }}>
              <div className={styles.wadahKamera}>
                <Scanner 
                  onScan={handleScan}
                  onError={(err) => setPesanSistem("Izin kamera ditolak atau error.")}
                  allowMultiple={false}
                  scanDelay={1500}
                />
                <div className={styles.overlayKameraGelap}></div>
                <div className={styles.overlayKameraKotak}></div>
              </div>
              
              {/* Petunjuk Visual Sederhana */}
              <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center', zIndex: 5 }}>
                <span style={{ background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '20px', border: '2px solid #111827', fontSize: '11px', fontWeight: '900' }}>
                  <FaCameraRotate /> KAMERA AKTIF
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VIEW 2: HASIL SCAN (Sukses/Gagal) */
          /* ------------------------------------------------------------- */
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className={`${styles.layarHasil} ${errorStatus ? styles.layarHasilError : ""}`} 
                 style={{ 
                   background: errorStatus ? "#fee2e2" : "#dcfce3", 
                   height: '280px', borderRadius: '24px', border: '4px solid #111827',
                   display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                   boxShadow: '8px 8px 0 #111827', gap: '16px'
                 }}>
              
              {loading ? (
                <div className={styles.loadingSpinnerBesar}></div> // Animasi loading khusus
              ) : (
                <>
                  {errorStatus ? <FaCircleXmark size={80} color="#ef4444" /> : <FaCircleCheck size={80} color="#22c55e" />}
                  <h2 style={{ fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
                    {errorStatus ? "Gagal!" : "Berhasil!"}
                  </h2>
                </>
              )}
            </div>

            {/* Kotak Pesan & Tombol Aksi */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <div style={{ background: 'white', border: '3px solid #111827', borderRadius: '16px', padding: '20px', boxShadow: '4px 4px 0 #111827', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontWeight: '800', color: '#111827', fontSize: '15px' }}>
                  {pesanSistem}
                </p>
              </div>

              <button 
                onClick={resetScanner}
                className={styles.tombolSimpanBiruBaru}
                style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              >
                <FaClockRotateLeft /> COBA SCAN ULANG
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}