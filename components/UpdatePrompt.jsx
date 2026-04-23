"use client";

import { useEffect, useState } from "react";
import { FaRocket } from "react-icons/fa6";
import styles from "@/components/App.module.css"; // 🚀 Sesuaikan jalurnya!

export default function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Pastikan hanya berjalan di browser dan mendukung Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      
      // 1. Cek apakah ada antrean update
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowPrompt(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowPrompt(true);
              }
            });
          }
        });
      });

      // 2. Memicu reload setelah worker baru menyingkirkan yang lama
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const eksekusiUpdate = () => {
    if (waitingWorker) {
      // Menyuruh worker baru mengambil alih
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setShowPrompt(false);
  };

  // Jika tidak ada update, sembunyikan radar
  if (!showPrompt) return null;

  return (
    <div className={styles.updateOverlay}>
      <div className={styles.updateCard}>
        
        <div className={styles.updateHeader}>
          <div className={styles.updateIconBox}>
            <FaRocket size={18} />
          </div>
          <div>
            <h3 className={styles.updateTitle}>Versi Baru Tersedia!</h3>
            <p className={styles.updateDesc}>
              Kami baru saja memperbarui QuRi. Update sekarang untuk fitur terbaru dan perbaikan sistem.
            </p>
          </div>
        </div>

        <div className={styles.updateBtnGroup}>
          <button onClick={() => setShowPrompt(false)} className={styles.updateBtnLater}>
            NANTI SAJA
          </button>
          <button onClick={eksekusiUpdate} className={styles.updateBtnNow}>
            UPDATE
          </button>
        </div>

      </div>
    </div>
  );
}