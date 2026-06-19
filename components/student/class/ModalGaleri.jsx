"use client";

import { memo, useState } from "react";
import {
  FaXmark, FaBookBookmark, FaTriangleExclamation,
  FaMagnifyingGlassPlus, FaMagnifyingGlassMinus, FaRotateLeft,
} from "react-icons/fa6";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import classStyles from "@/components/student/class/Class.module.css";

const ModalGaleri = memo(({ galeriAktif, onClose }) => {
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  if (!galeriAktif) return null;

  return (
    <>
      {/* ================================================================ */}
      {/* 1. MODAL UTAMA — Daftar foto papan                               */}
      {/* ================================================================ */}
      <div className={styles.wrapperGallery}>
        <div className={styles.containerGallery}>
          <div className={styles.headerGallery}>
            <div className={styles.wrapperTitle}>
              <h3 className={styles.galleryTitle}>CATATAN {galeriAktif.mapel}</h3>
              {/* ✅ FIX: timeHelper — timezone-safe */}
              <span className={styles.galleryDate}>
                {timeHelper.formatTanggalLengkap(galeriAktif.tanggal)}
              </span>
            </div>
            <button className={styles.galleryButton} onClick={onClose} aria-label="Tutup galeri">
              <FaXmark size={20} />
            </button>
          </div>

          <div className={styles.areaGallery}>
            <div className={styles.galleryInfo}>
              <div className={classStyles.infoMateriRow}>
                <div className={classStyles.infoMateriIkon}>
                  <FaBookBookmark size={35} />
                </div>
                <div>
                  <h4 className={classStyles.infoBab}>
                    {galeriAktif.bab || "Materi Kelas"}
                  </h4>
                  <p className={classStyles.infoSubBab}>
                    {galeriAktif.subBab || "-"}
                  </p>
                </div>
              </div>
            </div>

            {galeriAktif.foto.length === 0 ? (
              <div className={`${styles.emptyPhoto} ${classStyles.emptyFotoWrapper}`}>
                <FaTriangleExclamation size={50} color="#facc15" />
                <h4 className={classStyles.emptyFotoJudul}>Foto Tidak Tersedia</h4>
                <p className={classStyles.emptyFotoSub}>
                  Pengajar belum mengunggah catatan untuk sesi ini.
                </p>
              </div>
            ) : (
              <div className={styles.containerPhoto}>
                {galeriAktif.foto.map((urlFoto, idx) => (
                  <div
                    key={idx}
                    className={classStyles.fotoKlikable}
                    onClick={() =>
                      setZoomedPhoto({ url: urlFoto, index: idx + 1, total: galeriAktif.foto.length })
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlFoto}
                      alt={`Catatan Papan ${idx + 1}`}
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                    <div className={classStyles.overlayKlikFoto}>
                      <FaMagnifyingGlassPlus size={16} /> KLIK UNTUK ZOOM
                    </div>
                    <div className={classStyles.labelFotoIndex}>
                      {idx + 1} / {galeriAktif.foto.length}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. LIGHTBOX — Fullscreen zoom modal                              */}
      {/* ================================================================ */}
      {zoomedPhoto && (
        <div className={classStyles.lightboxOverlay}>
          <div className={classStyles.lightboxHeader}>
            <span className={classStyles.lightboxJudul}>
              FOTO PAPAN ({zoomedPhoto.index} DARI {zoomedPhoto.total})
            </span>
            <button
              onClick={() => setZoomedPhoto(null)}
              className={classStyles.lightboxTombolTutup}
              aria-label="Tutup zoom foto"
            >
              <FaXmark size={18} /> TUTUP
            </button>
          </div>

          <div className={classStyles.lightboxArea}>
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              centerZoomedOut
              pinch={{ step: 5 }}
              wheel={{ step: 0.1 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className={classStyles.lightboxZoomBar}>
                    <button onClick={() => zoomOut()} className={classStyles.lightboxZoomBtn} aria-label="Perkecil">
                      <FaMagnifyingGlassMinus size={20} />
                    </button>
                    <button onClick={() => resetTransform()} className={classStyles.lightboxZoomBtn} aria-label="Reset zoom">
                      <FaRotateLeft size={20} />
                    </button>
                    <button onClick={() => zoomIn()} className={`${classStyles.lightboxZoomBtn} ${classStyles.lightboxZoomBtnPrimary}`} aria-label="Perbesar">
                      <FaMagnifyingGlassPlus size={20} />
                    </button>
                  </div>

                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={zoomedPhoto.url}
                      alt="Papan Zoom HD"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", cursor: "grab" }}
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