"use client";

import { memo } from "react";
import dynamic from 'next/dynamic';
import { FaXmark, FaBookBookmark, FaTriangleExclamation } from "react-icons/fa6";
import 'react-medium-image-zoom/dist/styles.css';
import styles from "../App.module.css";

// 🚀 Lazy Load Zoom agar halaman utama tidak berat
const Zoom = dynamic(() => import('react-medium-image-zoom'), { ssr: false });

const ModalGaleri = memo(({ galeriAktif, onClose }) => {
  if (!galeriAktif) return null;

  return (
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
                <div className={styles.wrapperPhoto} key={idx}>
                  <Zoom>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.galleryPhoto} src={urlFoto} alt={`Catatan Papan ${idx + 1}`} style={{ cursor: 'zoom-in', width: '100%', display: 'block' }} />
                  </Zoom>
                  <div className={styles.countPhoto}>{idx + 1} / {galeriAktif.foto.length}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ModalGaleri.displayName = "ModalGaleri";
export default ModalGaleri;