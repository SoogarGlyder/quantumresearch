"use client";

import { useEffect, useRef } from "react";
import { FaXmark, FaCheckDouble, FaChevronLeft, FaChevronRight, FaClock, FaExpand, FaTriangleExclamation, FaWifi } from "react-icons/fa6";
import styles from "@/components/App.module.css";

// 🚀 IMPORT CUSTOM HOOK DAN KOMPONEN ANAK
import { useCbtEngine } from "./useCbtEngine";
import KertasSoalCBT from "./KertasSoalCBT";

export default function ModalUjianCBT({ jadwalId, kuis, siswa, isReviewMode = false, jawabanPast = [], onClose }) {
  const containerRef = useRef(null); 
  const scrollAreaRef = useRef(null);

  const daftarSoal = kuis?.soal || [];
  const totalSoal = daftarSoal.length;
  const namaMapel = kuis?.mapel || "Ujian CBT";

  // 🚀 PANGGIL MESIN CBT
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
      <div className={styles.wrapperGallery} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f8fafc', zIndex: 99999, display: 'flex', flexDirection: 'column', padding: '15px' }}>
        <div className={styles.containerGallery} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', height: '100vh', padding: '20px', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>Soal Tidak Tersedia.</h2>
          <button onClick={onClose} style={{ padding: '12px 24px', background: '#facc15', color: '#111827', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', boxShadow: '4px 4px 0 #111827' }}>KEMBALI</button>
        </div>
      </div>
    );
  }

  // LAYAR PERINGATAN AWAL (FULLSCREEN PROMPT)
  if (!isUjianMulai && !isReviewMode) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '4px solid #111827', boxShadow: '8px 8px 0 #facc15' }}>
          <div style={{ background: '#fef2f2', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #111827', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '4px 4px 0 #ef4444' }}>
            <FaExpand size={35} color="#ef4444" />
          </div>
          <h2 style={{ margin: '0 0 10px 0', color: '#111827', fontWeight: '900', textTransform: 'uppercase' }}>PERHATIAN!</h2>
          <p style={{ color: '#334155', fontSize: '15px', fontWeight: 'bold', lineHeight: '1.6', marginBottom: '30px' }}>
            Ujian ini menggunakan sistem <b>Anti-Cheat</b>. Layar akan masuk ke mode penuh. <br/><br/>
            ⚠️ Jangan keluar dari layar, pindah tab, atau membuka aplikasi lain selama ujian!
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '15px', background: '#f1f5f9', color: '#111827', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', boxShadow: '4px 4px 0 #111827' }}>BATAL</button>
            <button onClick={handleMulaiUjianFullscreen} style={{ flex: 2, padding: '15px', background: '#3b82f6', color: 'white', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '4px 4px 0 #111827' }}>
              MASUK <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSoalTerakhir = soalAktif === totalSoal - 1;

  // LAYAR UJIAN CBT UTAMA
  return (
    <div ref={containerRef} className={styles.wrapperGallery} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f8fafc', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
      <div className={styles.containerGallery} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden', position: 'relative' }}>
        
        {/* OVERLAY PERINGATAN PELANGGARAN */}
        {showPeringatan && !isReviewMode && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fef2f2', padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '350px', border: '4px solid #111827', boxShadow: '8px 8px 0 #ef4444' }}>
              <FaTriangleExclamation size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
              <h2 style={{ color: '#111827', margin: '0 0 10px 0', fontWeight: '900' }}>PELANGGARAN!</h2>
              <p style={{ color: '#111827', fontWeight: 'bold', marginBottom: '20px' }}>Anda terdeteksi meninggalkan layar ujian. Peringatan ke-{pelanggaran}/3.</p>
              <button onClick={() => setShowPeringatan(false)} style={{ width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', boxShadow: '4px 4px 0 #111827' }}>SAYA MENGERTI</button>
            </div>
          </div>
        )}

        {/* OVERLAY KONEKSI OFFLINE */}
        {koneksiTerputus && !isReviewMode && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fef08a', padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', border: '4px solid #111827', boxShadow: '8px 8px 0 #111827' }}>
              <FaWifi size={50} color="#111827" style={{ marginBottom: '15px' }} />
              <h2 style={{ color: '#111827', margin: '0 0 10px 0', fontWeight: '900' }}>KONEKSI TERPUTUS!</h2>
              <p style={{ color: '#111827', fontSize: '15px', fontWeight: 'bold', marginBottom: '30px' }}>Gagal mengirim. <strong style={{ color: '#ef4444' }}>JANGAN TUTUP APLIKASI!</strong></p>
              <button onClick={eksekusiSubmit} style={{ width: '100%', padding: '15px', background: '#3b82f6', color: 'white', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '4px 4px 0 #111827' }}>COBA KIRIM MANUAL</button>
            </div>
          </div>
        )}

        {/* HEADER APLIKASI UJIAN */}
        <div className={styles.headerGallery} style={{ flexShrink: 0, background: isReviewMode ? '#dcfce3' : '#facc15', borderBottom: '4px solid #111827', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle} style={{ color: '#111827', fontWeight: '900', textTransform: 'uppercase' }}>
              {isReviewMode ? `REVIEW | ${namaMapel}` : `CBT | ${namaMapel}`}
            </h3>
            {!isReviewMode && (
              <span className={styles.galleryDate} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: sisaDetik < 300 ? '#ef4444' : '#111827', fontWeight: '900', fontSize: '15px', marginTop: '4px' }}>
                <FaClock size={16} /> WAKTU: {formatWaktu(sisaDetik)}
              </span>
            )}
            {isReviewMode && (
              <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '900', border: '2px solid #111827', marginTop: '4px', display: 'inline-block' }}>SELESAI</span>
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
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', padding: '15px 20px', borderBottom: '4px solid #111827', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontWeight: '900', color: '#111827', fontSize: '13px' }}>PALET SOAL</h4>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch', userSelect: 'none' }}>
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
                    style={{ flexShrink: 0, width: '45px', height: '45px', margin: '2px 0', fontWeight: '900', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '3px solid #111827', background: bgWarna, color: textWarna, boxShadow: bayangan, borderRadius: '10px', cursor: 'pointer', transform: isAktif ? 'translateY(-2px)' : 'none', transition: 'all 0.1s' }}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AREA KERTAS SOAL & TOMBOL NAVIGASI BAWAH */}
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%', userSelect: isReviewMode ? 'auto' : 'none' }}>
            
            {/* 🚀 PANGGIL KOMPONEN RENDER SOAL */}
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
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '20px' }}>
              <button onClick={() => setSoalAktif(prev => Math.max(0, prev - 1))} disabled={soalAktif === 0}
                style={{ flex: 1, padding: '15px', background: soalAktif === 0 ? '#e2e8f0' : '#f1f5f9', color: '#111827', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', cursor: soalAktif === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: soalAktif === 0 ? 'none' : '4px 4px 0 #111827' }}>
                <FaChevronLeft /> KEMBALI
              </button>
              
              {!isReviewMode && isSoalTerakhir ? (
                <button onClick={handleKumpulJawaban} disabled={isSubmitting}
                  style={{ flex: 1, padding: '15px', background: '#22c55e', color: '#111827', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '4px 4px 0 #111827'}}>
                  {isSubmitting ? "MENGIRIM..." : <><FaCheckDouble /> KUMPULKAN</>}
                </button>
              ) : (
                <button onClick={() => {
                  if (isReviewMode && isSoalTerakhir) onClose();
                  else setSoalAktif(prev => Math.min(totalSoal - 1, prev + 1));
                }}
                  style={{ flex: 1, padding: '15px', background: (isReviewMode && isSoalTerakhir) ? '#111827' : '#3b82f6', color: 'white', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '4px 4px 0 #111827' }}>
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