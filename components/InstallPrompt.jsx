"use client";

import { useEffect, useState } from "react";
import { FaDownload, FaXmark, FaShareFromSquare, FaPlus } from "react-icons/fa6";
import styles from "@/components/App.module.css"; // 🚀 Sesuaikan jalurnya!

export default function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true); // Default true agar tidak berkedip di awal
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Cek apakah pengguna sudah menutup spanduk ini sebelumnya
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed) setIsDismissed(true);

    // 2. Deteksi apakah sudah diinstal (Standalone/PWA Mode)
    const isAppMode = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsStandalone(isAppMode);

    // 3. Deteksi apakah ini perangkat iOS (Apple)
    const ua = window.navigator.userAgent;
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isMac = !!ua.match(/Macintosh/i);
    const isIPadOS = isMac && navigator.maxTouchPoints && navigator.maxTouchPoints > 1; // iPad modern
    
    if (isIPad || isIPhone || isIPadOS) {
       setIsIOS(true);
    }

    // 4. Tangkap event instalasi bawaan Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Fungsi untuk tombol Instal di Android
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  // Fungsi tutup spanduk
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("installPromptDismissed", "true");
  };

  // Sembunyikan jika: Sudah terinstal, Sengaja ditutup, atau Bukan target HP
  if (isStandalone || isDismissed) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className={styles.installOverlay}>
      <div className={styles.installCard}>
        
        {/* Tombol Tutup Silang */}
        <div className={styles.installCloseBtn} onClick={handleDismiss}>
          <FaXmark size={18} />
        </div>

        <div className={styles.installHeader}>
          <div className={styles.installIconBox}>
            <FaDownload size={24} color="#111827" />
          </div>
          <div>
            <h3 className={styles.installTitle}>Instal Aplikasi</h3>
            <p className={styles.installDesc}>
              Akses QuRi lebih cepat, lancar, dan hemat kuota langsung dari layar utama HP Anda.
            </p>
          </div>
        </div>

        {/* LOGIKA CABANG: Tampilan iOS vs Android */}
        {isIOS ? (
          <div className={styles.installIosBox}>
            <p style={{ margin: 0 }}>Untuk menginstal di iPhone/iPad:</p>
            <p style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              1. Ketuk ikon <FaShareFromSquare size={16} color="#2563eb" /> di bawah
            </p>
            <p style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              2. Pilih <strong>Tambah ke Layar Utama</strong> <FaPlus size={14} />
            </p>
          </div>
        ) : (
          <button onClick={handleInstall} className={styles.installBtn}>
            <FaDownload /> Instal Sekarang
          </button>
        )}

      </div>
    </div>
  );
}