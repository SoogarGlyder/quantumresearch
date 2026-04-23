"use client";

import { useEffect, useRef } from "react";
import { FaXmark, FaCheckDouble, FaChevronLeft, FaChevronRight, FaClock, FaExpand, FaTriangleExclamation, FaWifi } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import { useCbtEngine } from "./useCbtEngine";
import KertasSoalCBT from "./KertasSoalCBT";

export default function ModalUjianCBT({ jadwalId, kuis, siswa, isReviewMode = false, jawabanPast = [], onClose }) {
  const containerRef = useRef(null); 
  const scrollAreaRef = useRef(null);

  const daftarSoal = kuis?.soal || [];
  const totalSoal = daftarSoal.length;
  const namaMapel = kuis?.mapel || "Ujian CBT";

  const {
    soalAktif, setSoalAktif, jawabanSiswa, sisaDetik,
    isSubmitting, isUjianMulai, setIsUjianMulai,
    pelanggaran, showPeringatan, setShowPeringatan, koneksiTerputus,
    handlePilihJawaban, handleToggleKompleks, handleInputIsian, handleKumpulJawaban, eksekusiSubmit
  } = useCbtEngine({ jadwalId, kuis, siswa, isReviewMode, jawabanPast, onClose });

  useEffect(() => {
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [soalAktif]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const formatWaktu = (totalDetik) => {
    const m = Math.floor(totalDetik / 60).toString().padStart(2, "0");
    const s = (totalDetik % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleMulaiUjianFullscreen = async () => {
    try {
      if (containerRef.current?.requestFullscreen) await containerRef.current.requestFullscreen();
      else if (containerRef.current?.webkitRequestFullscreen) await containerRef.current.webkitRequestFullscreen();
    } catch (err) { console.warn("Browser tidak mendukung fullscreen"); }
    setIsUjianMulai(true);
  };

  // EMPTY STATE
  if (totalSoal === 0) {
    return (
      <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgLight}`}>
        <div className={styles.cbtPromptCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', maxHeight: '90vh' }}>
          <h2 className={styles.cbtTitle}>Soal Tidak Tersedia.</h2>
          <button onClick={onClose} className={`${styles.cbtBtn} ${styles.cbtBtnPrimary}`} style={{ background: '#facc15', color: '#111827' }}>KEMBALI</button>
        </div>
      </div>
    );
  }

  // LAYAR PERINGATAN AWAL (FULLSCREEN PROMPT)
  if (!isUjianMulai && !isReviewMode) {
    return (
      <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDark}`}>
        <div className={styles.cbtPromptCard}>
          <div className={`${styles.cbtIconBox} ${styles.cbtIconBoxDanger}`}>
            <FaExpand size={35} color="#ef4444" />
          </div>
          <h2 className={styles.cbtTitle}>PERHATIAN!</h2>
          <p className={styles.cbtDesc}>
            Ujian ini menggunakan sistem <b>Anti-Cheat</b>. Layar akan masuk ke mode penuh. <br/><br/>
            ⚠️ Jangan keluar dari layar, pindah tab, atau membuka aplikasi lain selama ujian!
          </p>
          <div className={styles.cbtBtnGroup}>
            <button onClick={onClose} className={`${styles.cbtBtn} ${styles.cbtBtnBatal}`}>BATAL</button>
            <button onClick={handleMulaiUjianFullscreen} className={`${styles.cbtBtn} ${styles.cbtBtnPrimary}`}>
              MASUK <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSoalTerakhir = soalAktif === totalSoal - 1;

  return (
    <div ref={containerRef} className={`${styles.cbtFixedOverlay} ${styles.cbtBgLight}`} style={{ flexDirection: 'column', padding: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
        
        {/* OVERLAY PERINGATAN PELANGGARAN */}
        {showPeringatan && !isReviewMode && (
          <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDarker}`} style={{ zIndex: 999999 }}>
            <div className={`${styles.cbtPromptCard} ${styles.cbtPromptCardDanger}`}>
              <FaTriangleExclamation size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
              <h2 className={styles.cbtTitle}>PELANGGARAN!</h2>
              <p style={{ color: '#111827', fontWeight: 'bold', marginBottom: '20px' }}>Anda terdeteksi meninggalkan layar ujian. Peringatan ke-{pelanggaran}/3.</p>
              <button onClick={() => setShowPeringatan(false)} className={`${styles.cbtBtn} ${styles.cbtBtnDanger}`}>SAYA MENGERTI</button>
            </div>
          </div>
        )}

        {/* OVERLAY KONEKSI OFFLINE */}
        {koneksiTerputus && !isReviewMode && (
          <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgOffline}`} style={{ zIndex: 999999 }}>
            <div className={`${styles.cbtPromptCard} ${styles.cbtPromptCardOffline}`}>
              <FaWifi size={50} color="#111827" style={{ marginBottom: '15px' }} />
              <h2 className={styles.cbtTitle}>KONEKSI TERPUTUS!</h2>
              <p style={{ color: '#111827', fontSize: '15px', fontWeight: 'bold', marginBottom: '30px' }}>Gagal mengirim. <strong style={{ color: '#ef4444' }}>JANGAN TUTUP APLIKASI!</strong></p>
              <button onClick={eksekusiSubmit} className={`${styles.cbtBtn} ${styles.cbtBtnPrimary}`} style={{ width: '100%' }}>COBA KIRIM MANUAL</button>
            </div>
          </div>
        )}

        {/* HEADER APLIKASI UJIAN */}
        <div className={`${styles.cbtHeader} ${isReviewMode ? styles.cbtHeaderReview : styles.cbtHeaderNormal}`}>
          <div>
            <h3 className={styles.galleryTitle} style={{ color: '#111827' }}>
              {isReviewMode ? `REVIEW | ${namaMapel}` : `CBT | ${namaMapel}`}
            </h3>
            {!isReviewMode && (
              <span className={`${styles.cbtTimer} ${sisaDetik < 300 ? styles.cbtTimerDanger : styles.cbtTimerSafe}`}>
                <FaClock size={16} /> WAKTU: {formatWaktu(sisaDetik)}
              </span>
            )}
            {isReviewMode && (
              <span className={styles.cbtBadgeReview}>SELESAI</span>
            )}
          </div>
          <button className={styles.galleryButton} onClick={() => {
            if (isReviewMode) onClose();
            else if (window.confirm("Keluar ujian? Waktu tersimpan aman.")) onClose();
          }} style={{ border: '3px solid #111827', background: 'white' }}>
            <FaXmark size={20} color="#111827" />
          </button>
        </div>

        <div ref={scrollAreaRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* PALET NOMOR SOAL */}
          <div className={styles.paletContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontWeight: '900', color: '#111827', fontSize: '13px' }}>PALET SOAL</h4>
            </div>

            <div className={styles.paletScroll}>
              {daftarSoal.map((soal, index) => {
                const jwb = jawabanSiswa[index];
                const tipe = soal.tipeSoal || "PG";
                
                let isTerjawab = false;
                if (tipe === "PG_KOMPLEKS") isTerjawab = Array.isArray(jwb) && jwb.length > 0;
                else if (tipe === "ISIAN") isTerjawab = String(jwb || "").trim() !== "";
                else isTerjawab = !!jwb;

                const isAktif = soalAktif === index;
                let bgWarna = 'white'; let textWarna = '#111827'; let bayangan = '2px 2px 0 #111827';

                if (isReviewMode) {
                  let isBenar = false;
                  if (tipe === "PG" || tipe === "BENAR_SALAH") isBenar = String(jwb) === String(soal.kunciJawaban);
                  else if (tipe === "PG_KOMPLEKS") isBenar = JSON.stringify(Array.isArray(jwb)?jwb.sort():[]) === JSON.stringify(Array.isArray(soal.kunciJawaban)?soal.kunciJawaban.sort():[]);
                  else if (tipe === "ISIAN") isBenar = String(jwb||"").trim().toLowerCase() === String(soal.kunciJawaban||"").trim().toLowerCase();

                  if (isBenar) bgWarna = '#4ade80';
                  else if (isTerjawab) bgWarna = '#f87171';
                } else if (isTerjawab) {
                  bgWarna = '#3b82f6'; textWarna = 'white';
                }

                if (isAktif) bayangan = '4px 4px 0 #111827';

                return (
                  <button key={index} onClick={() => setSoalAktif(index)}
                    className={styles.paletBtn}
                    style={{ background: bgWarna, color: textWarna, boxShadow: bayangan, transform: isAktif ? 'translateY(-2px)' : 'none' }}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AREA KERTAS SOAL & TOMBOL NAVIGASI BAWAH */}
          <div className={styles.kertasSoalArea} style={{ userSelect: isReviewMode ? 'auto' : 'none' }}>
            
            <KertasSoalCBT 
              soalSekarang={daftarSoal[soalAktif]} 
              soalAktif={soalAktif} 
              isReviewMode={isReviewMode} 
              jawabanSiswa={jawabanSiswa} 
              handlePilihJawaban={handlePilihJawaban} 
              handleToggleKompleks={handleToggleKompleks} 
              handleInputIsian={handleInputIsian} 
            />

            {/* NAVIGASI KIRI-KANAN */}
            <div className={styles.cbtBtnGroup} style={{ marginTop: 'auto', paddingBottom: '20px' }}>
              <button onClick={() => setSoalAktif(prev => Math.max(0, prev - 1))} disabled={soalAktif === 0}
                className={`${styles.cbtBtn} ${soalAktif === 0 ? styles.cbtBtnSecondary : styles.cbtBtnBatal}`}>
                <FaChevronLeft /> KEMBALI
              </button>
              
              {!isReviewMode && isSoalTerakhir ? (
                <button onClick={handleKumpulJawaban} disabled={isSubmitting} className={`${styles.cbtBtn} ${styles.cbtBtnSuccess}`}>
                  {isSubmitting ? "MENGIRIM..." : <><FaCheckDouble /> KUMPULKAN</>}
                </button>
              ) : (
                <button onClick={() => {
                  if (isReviewMode && isSoalTerakhir) onClose();
                  else setSoalAktif(prev => Math.min(totalSoal - 1, prev + 1));
                }}
                  className={`${styles.cbtBtn} ${(isReviewMode && isSoalTerakhir) ? styles.cbtBtnDark : styles.cbtBtnPrimary}`}>
                  {(isReviewMode && isSoalTerakhir) ? "TUTUP REVIEW" : "LANJUT"} <FaChevronRight />
                </button>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}