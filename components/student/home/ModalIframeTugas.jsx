"use client";

import { useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import styles from "@/components/App.module.css";

export default function ModalIframeTugas({ urlMitra, onClose }) {
  // 🚀 Mencegah body/halaman utama ikut ter-scroll saat modal terbuka
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!urlMitra) return null;

  // 🚀 LOGIKA ANTI-NGEBUG: Deteksi apakah URL berakhiran .pdf
  // Jika ya, bungkus dengan Google Docs Viewer agar bisa di-zoom di Safari/iOS
  let finalUrl = urlMitra;
  
  if (typeof urlMitra === 'string' && urlMitra.toLowerCase().includes('.pdf')) {
    finalUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(urlMitra)}&embedded=true`;
  }

  return (
    <div 
      className={styles.wrapperGallery} 
      onClick={onClose} // 🚀 Tutup modal jika area luar diklik
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(248, 250, 252, 0.9)', // Sedikit transparan agar lebih elegan
        zIndex: 99999,
        display: 'flex', flexDirection: 'column', padding: '15px'
      }}
    >
      <div 
        className={styles.containerGallery} 
        onClick={(e) => e.stopPropagation()} // 🚀 KUNCI UTAMA: Mencegah klik tembus/bocor ke latar belakang!
        style={{ 
          display: 'flex', flexDirection: 'column', maxHeight: '100%', height: '100%', padding: 0, 
          overflow: 'hidden', 
          border: '4px solid #111827', 
          boxShadow: '8px 8px 0 #111827', // 🚀 Sentuhan Neo-Brutalism Anda
          pointerEvents: 'auto', // 🚀 Memastikan elemen bisa diklik
          backgroundColor: '#fff'
        }}
      >
        
        {/* HEADER MODAL JURNAL STYLE */}
        <div className={styles.headerGallery} style={{ borderBottom: '4px solid #111827' }}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle} style={{ color: '#111827', fontWeight: '900', textTransform: 'uppercase' }}>
              📚 Bahan Belajar
            </h3>
            <span className={styles.galleryDate} style={{ fontWeight: 'bold' }}>Resource Eksternal</span>
          </div>
          <button 
            className={styles.galleryButton} 
            onClick={onClose} 
            style={{ border: '3px solid #111827', background: '#ef4444', cursor: 'pointer' }}
          >
            <FaXmark size={20} color="white" />
          </button>
        </div>

        {/* AREA KONTEN: FULL IFRAME */}
        <div style={{ 
          flex: 1, width: '100%', 
          WebkitOverflowScrolling: 'touch', // Penting untuk kelancaran scroll di iOS
          backgroundColor: '#f1f5f9',
          overflow: 'auto',
          position: 'relative'
        }}>
          <iframe 
            src={finalUrl} 
            width="100%" 
            height="100%" 
            style={{ 
              border: "none", 
              display: "block",
              pointerEvents: 'auto', // 🚀 GARANSI BISA DIKLIK!
              position: 'absolute',
              top: 0,
              left: 0
            }}
            title="Bahan Belajar"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" // 🚀 Izin ekstra interaktivitas
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          />
        </div>
        
      </div>
    </div>
  );
}