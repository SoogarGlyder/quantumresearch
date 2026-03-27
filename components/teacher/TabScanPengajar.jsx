"use client";

import { useState, useCallback } from "react";
import Image from "next/image"; 
import { Scanner } from "@yudiel/react-qr-scanner";
import { 
  FaClockRotateLeft, FaCircleCheck, FaCircleXmark, 
  FaUserClock, FaCameraRotate 
} from "react-icons/fa6";

import { absenPengajarAction } from "../../actions/scanAction"; 
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
    setPesanSistem("MEMERIKSA LOKASI GPS...");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lokasiUser = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setPesanSistem("MEMVERIFIKASI KEHADIRAN...");
          const hasil = await absenPengajarAction(teksQR, lokasiUser);
          
          setErrorStatus(!hasil.sukses);
          setPesanSistem(hasil.pesan);
          setLoading(false);
        },
        (err) => {
          setErrorStatus(true);
          setPesanSistem("GAGAL MENGAMBIL GPS. AKTIFKAN LOKASI HP.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setErrorStatus(true);
      setPesanSistem("BROWSER TIDAK MENDUKUNG GPS.");
      setLoading(false);
    }
  }, [loading, hasilScan]);

  return (
    <div className={styles.areaKontenScanner}>
      <div className={styles.appHeader}>
        <div className={styles.shapeRed}></div>
        <div className={styles.shapeYellow}></div>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
          </div>
        </div>
        <h1 className={styles.headerTitle}>Presensi Staf</h1>
      </div>

      <div className={styles.contentArea} style={{ padding: '24px' }}>
        {!hasilScan ? (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ background: '#fef08a', border: '4px solid #111827', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '6px 6px 0 #111827' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '3px solid #111827' }}>
                <FaUserClock size={32} color="#111827" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '900', fontSize: '18px', textTransform: 'uppercase', color: '#111827' }}>Clock-In / Out</p>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#4b5563' }}>Scan barcode di meja pendaftaran Admin.</p>
              </div>
            </div>

            <div className={styles.bingkaiKamera} style={{ position: 'relative', overflow: 'hidden', padding: '20px', borderRadius: '24px', boxShadow: '8px 8px 0 #111827' }}>
              <div className={styles.wadahKamera} style={{ borderRadius: '16px', border: '4px solid #111827' }}>
                <Scanner 
                  onScan={handleScan}
                  onError={() => setPesanSistem("IZIN KAMERA DITOLAK.")}
                  allowMultiple={false}
                  scanDelay={1500}
                />
                <div className={styles.overlayKameraGelap}></div>
                <div className={styles.overlayKameraKotak}></div>
              </div>
              
              <div style={{ position: 'absolute', bottom: '28px', left: '0', right: '0', textAlign: 'center', zIndex: 5 }}>
                <span style={{ background: '#111827', color: 'white', padding: '8px 16px', borderRadius: '12px', border: '2px solid white', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', boxShadow: '0 4px 0 rgba(0,0,0,0.5)' }}>
                  <FaCameraRotate /> KAMERA AKTIF
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className={`${styles.layarHasil} ${errorStatus ? styles.layarHasilError : ""}`} 
                 style={{ 
                   background: errorStatus ? "#fca5a5" : "#4ade80", 
                   height: '300px', borderRadius: '24px', border: '4px solid #111827',
                   display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                   boxShadow: '8px 8px 0 #111827', gap: '20px'
                 }}>
              
              {loading ? (
                <div className={styles.kotakPesanLoading} style={{ padding: '30px', borderRadius: '16px' }}>
                  <h2 style={{ margin: 0, fontWeight: '900' }}>MEMPROSES...</h2>
                </div>
              ) : (
                <>
                  {errorStatus ? <FaCircleXmark size={100} color="#111827" /> : <FaCircleCheck size={100} color="#111827" />}
                  <h2 style={{ fontWeight: '900', textTransform: 'uppercase', margin: 0, fontSize: '32px', color: '#111827', textShadow: '2px 2px 0 white' }}>
                    {errorStatus ? "GAGAL!" : "BERHASIL!"}
                  </h2>
                </>
              )}
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <div style={{ background: 'white', border: '4px solid #111827', borderRadius: '16px', padding: '24px', boxShadow: '6px 6px 0 #111827', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontWeight: '900', color: '#111827', fontSize: '16px', textTransform: 'uppercase' }}>
                  {pesanSistem}
                </p>
              </div>

              <button onClick={resetScanner} className={styles.tombolSimpanBiruBaru} style={{ width: '100%', padding: '20px', fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                <FaClockRotateLeft /> SCAN ULANG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}