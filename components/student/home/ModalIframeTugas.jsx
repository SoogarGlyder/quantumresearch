"use client";

import { FaXmark } from "react-icons/fa6";

// 🚀 FIX: Path Absolute
import styles from "@/components/App.module.css";

export default function ModalIframeTugas({ urlMitra, onClose }) {
  if (!urlMitra) return null;

  return (
    <div className={styles.wrapperGallery} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#fff', zIndex: 99999,
      display: 'flex', flexDirection: 'column', padding: '15px'
    }}>
      <div className={styles.containerGallery} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', height: '100vh', padding: 0 }}>
        
        {/* HEADER MODAL JURNAL STYLE */}
        <div className={styles.headerGallery}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle}>Tugas & Latihan</h3>
            <span className={styles.galleryDate}>Resource Eksternal</span>
          </div>
          <button className={styles.galleryButton} onClick={onClose}>
            <FaXmark size={20} />
          </button>
        </div>

        {/* AREA KONTEN: FULL IFRAME */}
        <div style={{ flex: 1, width: '100%', WebkitOverflowScrolling: 'touch', backgroundColor: '#f1f5f9' }}>
          <iframe 
            src={urlMitra} 
            width="100%" 
            height="100%" 
            style={{ border: "none", display: "block" }}
            title="Bank Soal"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
        
      </div>
    </div>
  );
}