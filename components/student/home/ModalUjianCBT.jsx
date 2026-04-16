"use client";

import { useState, useEffect, useRef } from "react";
import { FaXmark, FaCheckDouble, FaChevronLeft, FaChevronRight, FaClock, FaExpand, FaTriangleExclamation, FaWifi, FaCheck, FaXmark as FaCross } from "react-icons/fa6";
import { kumpulkanUjianSiswa } from "@/actions/studentAction"; 
import styles from "@/components/App.module.css";
import katex from 'katex';
import 'katex/dist/katex.min.css';

const renderLaTeX = (htmlString) => {
  if (!htmlString) return { __html: "" };
  const rendered = htmlString.replace(/\$([^\$]+)\$/g, (match, rumus) => {
    try { return katex.renderToString(rumus, { throwOnError: false }); } 
    catch (e) { return match; }
  });
  return { __html: rendered };
};

// 🚀 TAMBAHAN PROPS: isReviewMode dan jawabanPast
export default function ModalUjianCBT({ jadwalId, kuis, siswa, isReviewMode = false, jawabanPast = [], onClose }) {
  const storageKey = `q_cbt_${jadwalId}_${siswa._id}`;
  const durasiMenit = kuis?.durasi || 10; 
  
  const [soalAktif, setSoalAktif] = useState(0);
  const [jawabanSiswa, setJawabanSiswa] = useState({}); 
  const [sisaDetik, setSisaDetik] = useState(durasiMenit * 60);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [isUjianMulai, setIsUjianMulai] = useState(false); 
  const [pelanggaran, setPelanggaran] = useState(0); 
  const [showPeringatan, setShowPeringatan] = useState(false); 
  const [koneksiTerputus, setKoneksiTerputus] = useState(false); 
  
  const timerRef = useRef(null);
  const containerRef = useRef(null); 
  const scrollAreaRef = useRef(null);

  const daftarSoal = kuis?.soal || [];
  const totalSoal = daftarSoal.length;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: 0,
        behavior: "smooth" // Gulir ke atas dengan mulus
      });
    }
  }, [soalAktif]);

  // 🚀 PERSIAPAN DATA BERDASARKAN MODE
  useEffect(() => {
    if (isReviewMode) {
      const pastObj = {};
      jawabanPast.forEach((jawaban, index) => {
        if (jawaban) pastObj[index] = jawaban;
      });
      setJawabanSiswa(pastObj);
      setIsUjianMulai(true); 
      setIsDataLoaded(true);
    } else {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.jawaban) setJawabanSiswa(parsed.jawaban);
          if (parsed.waktu > 0) setSisaDetik(parsed.waktu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
        } catch (error) { console.error("Gagal membaca memori:", error); }
      }
      setIsDataLoaded(true); 
    }
  }, [isReviewMode, storageKey, jawabanPast]);

  // AUTO SAVE (Hanya di mode ujian asli)
  useEffect(() => {
    if (isDataLoaded && !isReviewMode) {
      const stateToSave = { jawaban: jawabanSiswa, waktu: sisaDetik, pelanggaran };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [jawabanSiswa, sisaDetik, isDataLoaded, pelanggaran, storageKey, isReviewMode]);

  // ANTI CHEAT (Hanya di mode ujian asli)
  useEffect(() => {
    if (isReviewMode) return; 
    
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => { e.preventDefault(); alert("⚠️ Tindakan menyalin dilarang!"); };
    const handleVisibilityChange = () => {
      if (document.hidden && isUjianMulai && !isSubmitting && !koneksiTerputus) {
        setPelanggaran((prev) => {
          const pBaru = prev + 1;
          if (pBaru >= 3) { alert("❌ PELANGGARAN MAKSIMAL!"); eksekusiSubmit(); } 
          else { setShowPeringatan(true); }
          return pBaru;
        });
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUjianMulai, isSubmitting, koneksiTerputus, isReviewMode]);

  // RADAR SINYAL
  useEffect(() => {
    const handleOnline = () => {
      if (koneksiTerputus && isSubmitting && !isReviewMode) {
        setKoneksiTerputus(false); eksekusiSubmit(); 
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koneksiTerputus, isSubmitting, isReviewMode]);

  // TIMER (Hanya di mode ujian asli)
  useEffect(() => {
    if (isDataLoaded && isUjianMulai && !koneksiTerputus && !isReviewMode) {
      timerRef.current = setInterval(() => {
        setSisaDetik((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current); handleAutoSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded, isUjianMulai, koneksiTerputus, isReviewMode]);

  const formatWaktu = (totalDetik) => {
    const m = Math.floor(totalDetik / 60).toString().padStart(2, "0");
    const s = (totalDetik % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handlePilihJawaban = (nomorSoal, opsiPilihan) => {
    if (isReviewMode) return; 
    setJawabanSiswa((prev) => ({ ...prev, [nomorSoal]: opsiPilihan }));
  };

  const handleMulaiUjianFullscreen = async () => {
    try {
      if (containerRef.current?.requestFullscreen) await containerRef.current.requestFullscreen();
      else if (containerRef.current?.webkitRequestFullscreen) await containerRef.current.webkitRequestFullscreen();
    } catch (err) { console.warn("Browser tidak mendukung fullscreen"); }
    setIsUjianMulai(true);
  };

  const handleKumpulJawaban = async () => {
    if (isReviewMode) return;
    const konfirmasi = window.confirm("Yakin ingin menyelesaikan ujian?");
    if (!konfirmasi) return;
    eksekusiSubmit();
  };

  const handleAutoSubmit = () => { alert("WAKTU HABIS!"); eksekusiSubmit(); };

  const eksekusiSubmit = async () => {
    setIsSubmitting(true); setKoneksiTerputus(false); clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(e=>e);

    const arrayJawaban = daftarSoal.map((_, index) => jawabanSiswa[index] || "");
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error("Offline");
      const res = await kumpulkanUjianSiswa({ jadwalId, siswaId: siswa._id, nama: siswa.nama, jawabanSiswa: arrayJawaban });
      
      if (res.sukses) {
        localStorage.removeItem(storageKey);
        
        // 🚀 TAMPILAN GAMIFIKASI (MUNCULKAN TOTAL EXP)
        alert(`✅ UJIAN SELESAI!\n🎯 Nilai Anda: ${res.skor}\n🌟 Anda mendapatkan +${res.exp} EXP!`);
        
        onClose(); 
      } else { alert("❌ Gagal: " + res.pesan); setIsSubmitting(false); }
    } catch (err) { setKoneksiTerputus(true); }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  if (totalSoal === 0) {
    return (
      <div className={styles.wrapperGallery} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 99999, display: 'flex', flexDirection: 'column', padding: '15px' }}>
        <div className={styles.containerGallery} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', height: '100vh', padding: '20px', alignItems: 'center', justifyContent: 'center' }}>
          <h2>Maaf, Soal Tidak Tersedia.</h2>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Kembali</button>
        </div>
      </div>
    );
  }

  // 🚀 LAYAR PERSIAPAN (Hanya Muncul di Ujian Asli)
  if (!isUjianMulai && !isReviewMode) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px 30px', borderRadius: '20px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ background: '#fee2e2', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FaExpand size={35} color="#ef4444" />
          </div>
          <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', fontWeight: '900' }}>PERHATIAN!</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
            Ujian ini menggunakan sistem <b>Anti-Cheat</b>. Layar akan masuk ke mode penuh (Fullscreen). <br/><br/>
            ⚠️ Jangan keluar dari layar, pindah tab, atau membuka aplikasi lain selama ujian berlangsung!
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '15px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>BATAL</button>
            <button onClick={handleMulaiUjianFullscreen} style={{ flex: 2, padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              MASUK UJIAN <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const soalSekarang = daftarSoal[soalAktif];
  const opsiAbjad = ['A', 'B', 'C', 'D', 'E'];
  const isSoalTerakhir = soalAktif === totalSoal - 1;

  return (
    <div ref={containerRef} className={styles.wrapperGallery} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f1f5f9', zIndex: 99999, display: 'flex', flexDirection: 'column'
    }}>
      <div className={styles.containerGallery} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden', position: 'relative' }}>
        
        {/* MODAL PERINGATAN (Hanya Ujian Asli) */}
        {showPeringatan && !isReviewMode && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center', maxWidth: '350px', border: '4px solid #ef4444' }}>
              <FaTriangleExclamation size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
              <h2 style={{ color: '#ef4444', margin: '0 0 10px 0', fontWeight: '900' }}>PELANGGARAN!</h2>
              <p style={{ color: '#334155', fontWeight: '600', marginBottom: '20px' }}>
                Anda terdeteksi meninggalkan layar ujian. Peringatan ke-{pelanggaran}/3.
              </p>
              <button onClick={() => setShowPeringatan(false)} style={{ width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
                SAYA MENGERTI
              </button>
            </div>
          </div>
        )}

        {/* MODAL OFFLINE (Hanya Ujian Asli) */}
        {koneksiTerputus && !isReviewMode && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#1e293b', padding: '40px 30px', borderRadius: '20px', textAlign: 'center', maxWidth: '400px', border: '2px solid #ef4444', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
              <FaWifi size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
              <h2 style={{ color: 'white', margin: '0 0 10px 0', fontWeight: '900' }}>KONEKSI TERPUTUS!</h2>
              <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
                Gagal mengirim. <strong style={{ color: '#facc15' }}>JANGAN TUTUP APLIKASI!</strong><br/><br/>
                Sistem akan mengulang otomatis saat internet stabil.
              </p>
              <button onClick={eksekusiSubmit} style={{ width: '100%', padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                COBA KIRIM MANUAL
              </button>
            </div>
          </div>
        )}

        {/* 1. HEADER */}
        <div className={styles.headerGallery} style={{ flexShrink: 0, background: isReviewMode ? '#1e293b' : 'white', borderBottom: '1px solid #e2e8f0', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle} style={{ color: isReviewMode ? 'white' : '#1e293b' }}>
              {isReviewMode ? `REVIEW PRE-TEST | ${kuis.mapel}` : `PRE-TEST | ${kuis.mapel}`}
            </h3>
            
            {/* Timer Disembunyikan saat Review */}
            {!isReviewMode && (
              <span className={styles.galleryDate} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: sisaDetik < 300 ? '#ef4444' : '#2563eb', fontWeight: '900', fontSize: '15px' }}>
                <FaClock size={16} /> WAKTU: {formatWaktu(sisaDetik)}
              </span>
            )}
            {isReviewMode && (
              <span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>SELESAI</span>
            )}
          </div>
          <button className={styles.galleryButton} onClick={() => {
            if (isReviewMode) onClose();
            else if (window.confirm("Keluar ujian? Waktu tersimpan aman.")) onClose();
          }}>
            <FaXmark size={20} color={isReviewMode ? 'white' : 'inherit'} />
          </button>
        </div>

        {/* 2. AREA KONTEN */}
        <div ref={scrollAreaRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* 3. PALET SOAL STICKY */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10, background: 'white', padding: '15px 20px', 
            borderBottom: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontWeight: '900', color: '#475569', fontSize: '13px' }}>DAFTRAR SOAL</h4>
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', WebkitOverflowScrolling: 'touch', userSelect: 'none', justifyContent: 'center' }}>
              {daftarSoal.map((soal, index) => {
                const isTerjawab = !!jawabanSiswa[index];
                const isAktif = soalAktif === index;
                
                // WARNA PALET KHUSUS MODE REVIEW
                let bgWarna = 'white';
                let borderWarna = '2px solid #cbd5e1';
                let textWarna = '#64748b';

                if (isReviewMode) {
                  const isBenar = jawabanSiswa[index] === soal.kunciJawaban;
                  if (isBenar) { bgWarna = '#22c55e'; textWarna = 'white'; borderWarna = 'none'; } 
                  else if (isTerjawab) { bgWarna = '#ef4444'; textWarna = 'white'; borderWarna = 'none'; }
                } else if (isTerjawab) {
                  bgWarna = '#22c55e'; textWarna = 'white'; borderWarna = 'none';
                }

                if (isAktif) borderWarna = '3px solid #111827';

                return (
                  <button key={index} onClick={() => setSoalAktif(index)}
                    style={{
                      flexShrink: 0, width: '40px', height: '40px', margin: '2px 0',
                      fontWeight: '900', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                      border: borderWarna, background: bgWarna, color: textWarna,
                      borderRadius: '8px', cursor: 'pointer', transform: isAktif ? 'scale(1.1)' : 'scale(1)', transition: '0.1s'
                    }}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. KERTAS SOAL DAN JAWABAN */}
          <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%', userSelect: isReviewMode ? 'auto' : 'none' }}>
            
            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', border: '2px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px dashed #e2e8f0', paddingBottom: '15px' }}>
                <span style={{ fontWeight: '900', fontSize: '20px', color: '#1e293b' }}>SOAL NO. {soalAktif + 1}</span>
              </div>

              <div style={{ marginBottom: '30px' }}>
                {soalSekarang.gambar && (
                  <img src={soalSekarang.gambar} alt="Soal" style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '20px', objectFit: 'contain', pointerEvents: isReviewMode ? 'auto' : 'none' }} />
                )}
                <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pertanyaan)} style={{ fontSize: '16px', color: '#334155', lineHeight: '1.7' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {opsiAbjad.map((opsi) => {
                  if (!soalSekarang.opsi || !soalSekarang.opsi[opsi]) return null;
                  const isSelected = jawabanSiswa[soalAktif] === opsi;
                  
                  // LOGIKA WARNA OPSI UNTUK MODE REVIEW
                  const isKunciBenar = isReviewMode && soalSekarang.kunciJawaban === opsi;
                  const isSalahPilih = isReviewMode && isSelected && !isKunciBenar;

                  let bgOpsi = 'white';
                  let borderOpsi = '2px solid #e2e8f0';
                  let bgHuruf = '#f1f5f9';
                  let textHuruf = '#64748b';

                  if (isReviewMode) {
                    if (isKunciBenar) { bgOpsi = '#f0fdf4'; borderOpsi = '2px solid #22c55e'; bgHuruf = '#22c55e'; textHuruf = 'white'; }
                    else if (isSalahPilih) { bgOpsi = '#fef2f2'; borderOpsi = '2px solid #ef4444'; bgHuruf = '#ef4444'; textHuruf = 'white'; }
                  } else {
                    if (isSelected) { bgOpsi = '#eff6ff'; borderOpsi = '2px solid #3b82f6'; bgHuruf = '#3b82f6'; textHuruf = 'white'; }
                  }

                  return (
                    <div key={opsi} onClick={() => handlePilihJawaban(soalAktif, opsi)}
                      style={{ 
                        display: 'flex', gap: '15px', alignItems: 'center', padding: '12px 18px', 
                        background: bgOpsi, border: borderOpsi, borderRadius: '12px', 
                        cursor: isReviewMode ? 'default' : 'pointer', transition: '0.2s',
                      }}>
                      <span style={{ 
                        fontWeight: '900', width: '30px', height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                        flexShrink: 0, background: bgHuruf, color: textHuruf, borderRadius: '50%', fontSize: '15px' 
                      }}>
                        {isKunciBenar ? <FaCheck size={14}/> : (isSalahPilih ? <FaCross size={14}/> : opsi)}
                      </span>
                      <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.opsi[opsi])} style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }} />
                    </div>
                  );
                })}
              </div>

              {/* BOX PEMBAHASAN (Hanya muncul di Mode Review) */}
              {isReviewMode && soalSekarang.pembahasan && (
                <div style={{ marginTop: '25px', padding: '20px', background: '#f8fafc', borderLeft: '4px solid #facc15', borderRadius: '8px' }}>
                  <span style={{ display: 'block', fontWeight: '900', color: '#ca8a04', marginBottom: '10px', fontSize: '14px' }}>KUNCI & PEMBAHASAN:</span>
                  <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pembahasan)} style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }} />
                </div>
              )}

            </div>

            {/* Navigasi Bawah */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', paddingBottom: '20px' }}>
              <button onClick={() => setSoalAktif(prev => Math.max(0, prev - 1))} disabled={soalAktif === 0}
                style={{ padding: '12px 20px', background: soalAktif === 0 ? '#cbd5e1' : '#1e293b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: soalAktif === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaChevronLeft /> KEMBALI
              </button>
              
              {/* Sembunyikan tombol selesaikan di mode review */}
              {!isReviewMode && isSoalTerakhir ? (
                <button onClick={handleKumpulJawaban} disabled={isSubmitting}
                  style={{ padding: '12px 20px', background: '#112714', color: '#facc15', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  {isSubmitting ? "MENGIRIM..." : <><FaCheckDouble /> SELESAI</>}
                </button>
              ) : (
                <button onClick={() => {
                  if (isReviewMode && isSoalTerakhir) onClose();
                  else setSoalAktif(prev => Math.min(totalSoal - 1, prev + 1));
                }}
                  style={{ padding: '12px 20px', background: (isReviewMode && isSoalTerakhir) ? '#166534' : '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
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