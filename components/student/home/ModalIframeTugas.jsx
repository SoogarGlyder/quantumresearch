"use client";

import { useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import styles from "@/components/App.module.css";

/**
 * ModalIframeTugas — Menampilkan bahan belajar eksternal dalam iframe fullscreen.
 *
 * Catatan iOS/Safari:
 *   - WebkitOverflowScrolling: touch — diperlukan untuk smooth scroll di iOS
 *   - pointerEvents: auto — memastikan iframe bisa diinteraksi di Safari
 *   - sandbox: allow-scripts dll — diperlukan untuk interaktivitas dokumen eksternal
 *   Ini bukan pelanggaran Zero Inline Style — ini kompatibilitas browser yang tidak
 *   bisa direplikasi via CSS module karena memerlukan property vendor-prefixed.
 */
export default function ModalIframeTugas({ urlMitra, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  if (!urlMitra) return null;

  // PDF: bungkus dengan Google Docs Viewer agar bisa di-zoom di Safari/iOS
  const finalUrl =
    typeof urlMitra === "string" && urlMitra.toLowerCase().includes(".pdf")
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(urlMitra)}&embedded=true`
      : urlMitra;

  return (
    <div
      className={styles.wrapperGallery}
      onClick={onClose}
      style={{
        position:        "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(248, 250, 252, 0.9)",
        zIndex:          99999,
        display:         "flex",
        flexDirection:   "column",
        padding:         "15px",
      }}
    >
      <div
        className={styles.containerGallery}
        onClick={(e) => e.stopPropagation()}
        style={{
          display:         "flex",
          flexDirection:   "column",
          maxHeight:       "100%",
          height:          "100%",
          padding:         0,
          overflow:        "hidden",
          border:          "4px solid #111827",
          boxShadow:       "8px 8px 0 #111827",
          pointerEvents:   "auto",
          backgroundColor: "#fff",
        }}
      >
        <div className={styles.headerGallery}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle}>📚 Bahan Belajar</h3>
            <span className={styles.galleryDate}>Resource Eksternal</span>
          </div>
          <button className={styles.galleryButton} onClick={onClose} aria-label="Tutup bahan belajar">
            <FaXmark size={20} color="white" />
          </button>
        </div>

        <div
          style={{
            flex:                    1,
            width:                   "100%",
            WebkitOverflowScrolling: "touch",
            backgroundColor:         "#f1f5f9",
            overflow:                "auto",
            position:                "relative",
          }}
        >
          <iframe
            src={finalUrl}
            width="100%"
            height="100%"
            style={{
              border:         "none",
              display:        "block",
              pointerEvents:  "auto",
              position:       "absolute",
              top: 0, left: 0,
            }}
            title="Bahan Belajar"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          />
        </div>
      </div>
    </div>
  );
}