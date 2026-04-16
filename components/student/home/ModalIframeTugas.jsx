"use client";

import { FaXmark } from "react-icons/fa6";
import styles from "@/components/App.module.css";

export default function ModalIframeTugas({ urlMitra, onClose }) {
  if (!urlMitra) return null;

  // 🚀 LOGIKA ANTI-NGEBUG: Deteksi apakah URL berakhiran .pdf
  // Jika ya, bungkus dengan Google Docs Viewer agar bisa di-zoom di Safari/iOS
  let finalUrl = urlMitra;
  
  if (typeof urlMitra === 'string' && urlMitra.toLowerCase().includes('.pdf')) {
    // Format URL Google Docs Viewer:
    finalUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(urlMitra)}&embedded=true`;
  }

  return (
    <div className={styles.wrapperGallery} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f8fafc', zIndex: 99999,
      display: 'flex', flexDirection: 'column', padding: '15px'
    }}>
      <div className={styles.containerGallery} style={{ 
        display: 'flex', flexDirection: 'column', maxHeight: '100%', height: '100%', padding: 0, 
        overflow: 'hidden', border: '4px solid #111827', boxShadow: '8px 8px 0 #111827' // 🚀 Sentuhan Neo-Brutalism
      }}>
        
        {/* HEADER MODAL JURNAL STYLE */}
        <div className={styles.headerGallery} style={{ borderBottom: '4px solid #111827' }}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle} style={{ color: '#111827', fontWeight: '900', textTransform: 'uppercase' }}>📚 Bahan Belajar</h3>
            <span className={styles.galleryDate} style={{ fontWeight: 'bold' }}>Resource Eksternal</span>
          </div>
          <button className={styles.galleryButton} onClick={onClose} style={{ border: '3px solid #111827', background: '#ef4444' }}>
            <FaXmark size={20} color="white" />
          </button>
        </div>

        {/* AREA KONTEN: FULL IFRAME */}
        <div style={{ 
          flex: 1, width: '100%', 
          WebkitOverflowScrolling: 'touch', // Penting untuk kelancaran scroll di iOS
          backgroundColor: '#f1f5f9',
          overflow: 'auto' // Pastikan parent bisa digeser
        }}>
          <iframe 
            src={finalUrl} 
            width="100%" 
            height="100%" 
            style={{ border: "none", display: "block" }}
            title="Bahan Belajar"
            allowFullScreen
            // Tambahkan allow-downloads agar siswa bisa mengunduh jika disediakan oleh Google Docs
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          />
        </div>
        
      </div>
    </div>
  );
}