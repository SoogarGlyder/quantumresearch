"use client";

import { useEffect } from "react";
import { FaTriangleExclamation } from "react-icons/fa6";
import styles from "./ModalLogout.module.css";

/**
 * @param {{ isOpen: boolean, onClose: () => void, onConfirm: () => void }} props
 */
export default function ModalLogout({ isOpen, onClose, onConfirm }) {
  useEffect(() => {
    if (!isOpen) return;

    const tanganiEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", tanganiEscape);
    return () => document.removeEventListener("keydown", tanganiEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-logout-judul"
        onClick={(e) => e.stopPropagation()}
      >
        <FaTriangleExclamation className={styles.ikonPeringatan} />

        <h3 id="modal-logout-judul" className={styles.judul}>
          Konfirmasi Keluar
        </h3>

        <p className={styles.deskripsi}>
          Apakah Anda yakin ingin keluar dari aplikasi?
        </p>

        <div className={styles.grupTombol}>
          <button
            onClick={onClose}
            className={`${styles.tombol} ${styles.tombolBatal}`}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            className={`${styles.tombol} ${styles.tombolKeluar}`}
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
}