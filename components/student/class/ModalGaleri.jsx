"use client";

import { memo, useState } from "react";
import { FaXmark, FaBookBookmark, FaTriangleExclamation, FaMagnifyingGlassPlus, FaMagnifyingGlassMinus, FaRotateLeft } from "react-icons/fa6";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// FIX: Path Absolute
import styles from "@/components/App.module.css";

const ModalGaleri = memo(({ galeriAktif, onClose }) => {
  // 🚀 STATE BARU: Menyimpan foto mana yang sedang di-klik untuk di-Zoom (Mode Lightbox)
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  if (!galeriAktif) return null;

  return (
    <>
      {/* ================================================================= */}
      {/* 1. MODAL UTAMA (GALERI DAFTAR FOTO)                               */}
      {/* ================================================================= */}
      <div className={styles.wrapperGallery}>
        <div className={styles.containerGallery}> 
          <div className={styles.headerGallery}>
            <div className={styles.wrapperTitle}>
              <h3 className={styles.galleryTitle}>CATATAN {galeriAktif.mapel}</h3>
              <span className={styles.galleryDate}>
                {new Date(galeriAktif.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button className={styles.galleryButton} onClick={onClose}>
              <FaXmark size={20} />
            </button>
          </div>
          
          <div className={styles.areaGallery}>
            <div className={styles.galleryInfo}>
              <div className={styles.gallerySubject}>
                <div style={{ marginTop: '3px'}}><FaBookBookmark size={35} color="#2563eb" /></div>
                <div>
                  <h4 style={{ marginBottom: '1px', fontSize: '16px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                    {galeriAktif.bab || 'Materi Kelas'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#4b5563', lineHeight: '1.4' }}>
                    {galeriAktif.subBab || '-'}
                  </p>
                </div>
              </div>
            </div>

            {galeriAktif.foto.length === 0 ? (
              <div className={styles.emptyPhoto} style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaTriangleExclamation size={50} color="#facc15" style={{ marginBottom: '16px' }} />
                <h4 style={{ fontWeight: '900', color: '#111827', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Foto Tidak Tersedia</h4>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563', margin: 0 }}>Pengajar belum mengunggah catatan untuk sesi ini.</p>
              </div>
            ) : (
              <div className={styles.containerPhoto}>
                {galeriAktif.foto.map((urlFoto, idx) => (
                  <div 
                    key={idx} 
                    /* 🚀 KETIKA FOTO DIKLIK -> Buka Modal Zoom */
                    onClick={() => setZoomedPhoto({ url: urlFoto, index: idx + 1, total: galeriAktif.foto.length })}
                    style={{ 
                      position: 'relative', 
                      overflow: 'hidden', 
                      border: '3px solid #111827', 
                      borderRadius: '12px', 
                      background: '#111827',
                      width: '100%', 
                      marginBottom: '16px',
                      cursor: 'pointer' // Tanda bisa diklik
                    }}
                  >
                    
                    {/* FOTO BIASA (BELUM DI-ZOOM) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={urlFoto} 
                      alt={`Catatan Papan ${idx + 1}`} 
                      style={{ width: '100%', height: 'auto', display: 'block' }} 
                    />

                    {/* LABEL PETUNJUK DI TENGAH FOTO */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(17, 24, 39, 0.7)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
                      <FaMagnifyingGlassPlus size={16} /> KLIK UNTUK ZOOM
                    </div>

                    <div className={styles.countPhoto} style={{ zIndex: 10, position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(17, 24, 39, 0.8)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>
                      {idx + 1} / {galeriAktif.foto.length}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. MODAL LAPIS KEDUA (FULLSCREEN LIGHTBOX KHUSUS ZOOM)            */}
      {/* ================================================================= */}
      {zoomedPhoto && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(15, 23, 42, 0.95)', // Background gelap transparan
            display: 'flex', flexDirection: 'column' 
          }}
        >
          {/* HEADER MODAL ZOOM */}
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontWeight: '900', fontSize: '16px' }}>
              FOTO PAPAN ({zoomedPhoto.index} DARI {zoomedPhoto.total})
            </div>
            <button 
              onClick={() => setZoomedPhoto(null)} 
              style={{ background: '#ef4444', color: 'white', border: '2px solid white', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900' }}
            >
              <FaXmark size={18} /> TUTUP
            </button>
          </div>

          {/* AREA ZOOM (BEBAS DIMENSI COLLAPSE KARENA FULLSCREEN) */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              centerZoomedOut={true}
              pinch={{ step: 5 }}
              wheel={{ step: 0.1 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* TOMBOL ZOOM MANUAL (Melayang di bawah) */}
                  <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
                    <button onClick={() => zoomOut()} style={{ width: '45px', height: '45px', borderRadius: '10px', border: '3px solid #111827', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 #111827' }}><FaMagnifyingGlassMinus size={20} /></button>
                    <button onClick={() => resetTransform()} style={{ width: '45px', height: '45px', borderRadius: '10px', border: '3px solid #111827', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 #111827' }}><FaRotateLeft size={20} /></button>
                    <button onClick={() => zoomIn()} style={{ width: '45px', height: '45px', borderRadius: '10px', border: '3px solid #111827', background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 #111827' }}><FaMagnifyingGlassPlus size={20} /></button>
                  </div>

                  {/* KONTEN GAMBAR */}
                  <TransformComponent 
                    wrapperStyle={{ width: "100%", height: "100%" }} 
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={zoomedPhoto.url} 
                      alt="Papan Zoom HD" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', cursor: 'grab' }} 
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}
    </>
  );
});

ModalGaleri.displayName = "ModalGaleri";
export default ModalGaleri;