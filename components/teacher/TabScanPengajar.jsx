"use client";

import { useState, useCallback } from "react";
import Image from "next/image"; 
import { Scanner } from "@yudiel/react-qr-scanner";
import { 
  FaClockRotateLeft, FaCircleCheck, FaCircleXmark, 
  FaUserClock, FaCameraRotate 
} from "react-icons/fa6";

import { absenPengajarAction } from "../../actions/scanAction"; // 👈 Real Action!
import styles from "../TeacherApp.module.css";

export default function TabScanPengajar() {
  const [hasilScan, setHasilScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [pesanSistem, setPesanSistem] = useState("");

  const resetScanner = () => {
    setHasilScan(null);
    setLoading(false);
    setErrorStatus(false);
    setPesanSistem("");
  };

  const handleScan = useCallback(async (result) => {
    if (loading || hasilScan) return;

    const teksQR = result?.[0]?.rawValue || result;
    if (!teksQR) return;

    setLoading(true);
    setHasilScan(teksQR);
    setPesanSistem("Memeriksa lokasi GPS Anda...");

    // Mengambil lokasi GPS Pengajar secara langsung!
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lokasiUser = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setPesanSistem("Memverifikasi data kehadiran...");
          // Panggil Action Backend sesungguhnya
          const hasil = await absenPengajarAction(teksQR, lokasiUser);
          
          setErrorStatus(!hasil.sukses);
          setPesanSistem(hasil.pesan);
          setLoading(false);
        },
        (err) => {
          setErrorStatus(true);
          setPesanSistem("Gagal mengambil GPS. Pastikan GPS HP Anda aktif.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setErrorStatus(true);
      setPesanSistem("Browser Anda tidak mendukung GPS.");
      setLoading(false);
    }
  }, [loading, hasilScan]);

  return (
    <div className={styles.areaKontenScanner}>
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
        {!hasilScan ? (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ background: '#fef08a', border: '3px solid #111827', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '4px 4px 0 #111827' }}>
              <FaUserClock size={28} />
              <div>
                <p style={{ margin: 0, fontWeight: '900', fontSize: '14px' }}>Clock-In / Out</p>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#4b5563' }}>Scan barcode di meja pendaftaran Admin.</p>
              </div>
            </div>

            <div className={styles.bingkaiKamera} style={{ position: 'relative', overflow: 'hidden' }}>
              <div className={styles.wadahKamera}>
                <Scanner 
                  onScan={handleScan}
                  onError={() => setPesanSistem("Izin kamera ditolak atau error.")}
                  allowMultiple={false}
                  scanDelay={1500}
                />
                <div className={styles.overlayKameraGelap}></div>
                <div className={styles.overlayKameraKotak}></div>
              </div>
              
              <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center', zIndex: 5 }}>
                <span style={{ background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '20px', border: '2px solid #111827', fontSize: '11px', fontWeight: '900' }}>
                  <FaCameraRotate /> KAMERA AKTIF
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className={`${styles.layarHasil} ${errorStatus ? styles.layarHasilError : ""}`} 
                 style={{ 
                   background: errorStatus ? "#fee2e2" : "#dcfce3", 
                   height: '280px', borderRadius: '24px', border: '4px solid #111827',
                   display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                   boxShadow: '8px 8px 0 #111827', gap: '16px'
                 }}>
              
              {loading ? (
                <div className={styles.loadingSpinnerBesar}></div>
              ) : (
                <>
                  {errorStatus ? <FaCircleXmark size={80} color="#ef4444" /> : <FaCircleCheck size={80} color="#22c55e" />}
                  <h2 style={{ fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
                    {errorStatus ? "Gagal!" : "Berhasil!"}
                  </h2>
                </>
              )}
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <div style={{ background: 'white', border: '3px solid #111827', borderRadius: '16px', padding: '20px', boxShadow: '4px 4px 0 #111827', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontWeight: '800', color: '#111827', fontSize: '15px' }}>
                  {pesanSistem}
                </p>
              </div>

              <button onClick={resetScanner} className={styles.tombolSimpanBiruBaru} style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
                <FaClockRotateLeft /> COBA SCAN ULANG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}