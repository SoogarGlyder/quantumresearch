"use client";

import { useEffect } from "react";
import { FaCheck, FaTriangleExclamation, FaXmark } from "react-icons/fa6";
import { KONFIGURASI_SISTEM } from "@/utils/constants";
import styles from "./BrutalToast.module.css"; // 👈 Import CSS Module

export default function BrutalToast({ pesan, tipe = "sukses", onClose }) {
  // Otomatis hilang sesuai konfigurasi sistem
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, KONFIGURASI_SISTEM.TOAST_DELAY_MS);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSukses = tipe === "sukses";

  // Tentukan class berdasarkan tipe
  const toastClass = isSukses ? styles.toastSukses : styles.toastError;

  return (
    <div className={`${styles.toastBase} ${toastClass}`}>
      {isSukses ? <FaCheck size={20} /> : <FaTriangleExclamation size={20} />}
      
      <span className={styles.toastText}>{pesan}</span>
      
      <button 
        onClick={onClose} 
        className={styles.closeButton}
        aria-label="Tutup Notifikasi"
      >
        <FaXmark 
          size={20} 
          color={isSukses ? "var(--brutal-hitam)" : "var(--brutal-putih)"} 
        />
      </button>
    </div>
  );
}