"use client";

import { useEffect } from "react";
import {
  FaCheck,
  FaTriangleExclamation,
  FaCircleInfo,
  FaXmark,
} from "react-icons/fa6";
import { KONFIGURASI_SISTEM } from "@/utils/constants";
import styles from "./BrutalToast.module.css";

/**
 * @param {{ pesan: string, tipe?: "sukses"|"error"|"info", onClose: () => void }} props
 */
export default function BrutalToast({ pesan, tipe = "sukses", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), KONFIGURASI_SISTEM.TOAST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  const toastClass =
    tipe === "sukses" ? styles.toastSukses
    : tipe === "info" ? styles.toastInfo
    : styles.toastError;

  const Ikon =
    tipe === "sukses" ? FaCheck
    : tipe === "info"  ? FaCircleInfo
    : FaTriangleExclamation;

  return (
    <div className={`${styles.toastBase} ${toastClass}`}>
      <Ikon size={20} aria-hidden="true" />

      <span className={styles.toastText}>{pesan}</span>

      <button
        onClick={onClose}
        className={styles.closeButton}
        aria-label="Tutup notifikasi"
      >
        <FaXmark size={20} className={styles.ikonTutup} />
      </button>
    </div>
  );
}