"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaXmark, FaCheckDouble, FaChevronLeft, FaChevronRight,
  FaClock, FaExpand, FaTriangleExclamation, FaWifi,
} from "react-icons/fa6";
import styles from "@/components/App.module.css";
import { useCbtEngine } from "./useCbtEngine";
import KertasSoalCBT from "./KertasSoalCBT";

export default function ModalUjianCBT({
  jadwalId, kuis, siswa, isReviewMode = false, jawabanPast = [], onClose,
}) {
  const containerRef  = useRef(null);
  const scrollAreaRef = useRef(null);

  const daftarSoal = kuis?.soal || [];
  const totalSoal  = daftarSoal.length;
  const namaMapel  = kuis?.mapel || "Ujian CBT";

  // ✅ State konfirmasi keluar — menggantikan window.confirm
  const [showKonfirmasiKeluar, setShowKonfirmasiKeluar] = useState(false);

  const {
    soalAktif, setSoalAktif, jawabanSiswa, sisaDetik,
    isSubmitting, isUjianMulai, setIsUjianMulai,
    pelanggaran, showPeringatan, setShowPeringatan, koneksiTerputus,
    showKonfirmasiSubmit, konfirmasiSubmit, batalKonfirmasiSubmit,
    pesanSelesai, setPesanSelesai,
    pesanGagalSubmit, setPesanGagalSubmit,
    handlePilihJawaban, handleToggleKompleks, handleInputIsian,
    handleKumpulJawaban, eksekusiSubmit,
  } = useCbtEngine({ jadwalId, kuis, siswa, isReviewMode, jawabanPast, onClose });

  const cekJawabanBenar = (index) => {
    const soal = daftarSoal[index];
    const jwb  = jawabanSiswa[index];
    if (!soal || jwb === undefined || jwb === null || jwb === "") return false;

    const tipe      = soal.tipeSoal || "PG";
    const kunciArr  = Array.isArray(soal.kunciJawaban)
      ? soal.kunciJawaban
      : [String(soal.kunciJawaban || "")];
    const jwbArr    = Array.isArray(jwb) ? jwb : [String(jwb)];

    if (tipe === "PG_KOMPLEKS") {
      const a = [...jwbArr].sort().join(",").toLowerCase().trim();
      const b = [...kunciArr].sort().join(",").toLowerCase().trim();
      return a === b && a !== "";
    }
    return String(jwbArr[0]).trim().toLowerCase() === String(kunciArr[0]).trim().toLowerCase();
  };

  useEffect(() => {
    if (scrollAreaRef.current)
      scrollAreaRef.current.scrollTo({ top: 0, behavior: "smooth" });
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
      if (containerRef.current?.requestFullscreen)
        await containerRef.current.requestFullscreen();
      else if (containerRef.current?.webkitRequestFullscreen)
        await containerRef.current.webkitRequestFullscreen();
    } catch { /* Browser tidak mendukung fullscreen — lanjut tanpa fullscreen */ }
    setIsUjianMulai(true);
  };

  // ======================== EMPTY STATE ========================
  if (totalSoal === 0) {
    return (
      <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgLight}`}>
        <div className={styles.cbtPromptCard}>
          <h2 className={styles.cbtTitle}>Soal Tidak Tersedia.</h2>
          <button onClick={onClose} className={`${styles.cbtBtn} ${styles.cbtBtnPrimary}`}>
            KEMBALI
          </button>
        </div>
      </div>
    );
  }

  // ======================== LAYAR SELESAI (pengganti alert post-submit) ========================
  if (pesanSelesai) {
    return (
      <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDark}`}>
        <div className={styles.cbtPromptCard}>
          <FaCheckDouble size={50} color="#22c55e" style={{ marginBottom: 16 }} />
          <h2 className={styles.cbtTitle}>
            {pesanSelesai.isDemo ? "SIMULASI SELESAI!" : "UJIAN SELESAI!"}
          </h2>
          <p className={styles.cbtDesc}>
            {pesanSelesai.isDemo ? (
              <>
                🎉 Ini adalah simulasi CBT pada Mode Demo.<br />
                Jawaban tidak dikirim ke server — Anda bisa mengulang kuis ini kapan saja!
              </>
            ) : (
              <>
                🎯 Nilai Anda: <b>{pesanSelesai.skor}</b><br />
                🌟 Anda mendapatkan <b>+{pesanSelesai.exp} EXP!</b>
              </>
            )}
          </p>
          <button
            onClick={() => { setPesanSelesai(null); onClose(); }}
            className={`${styles.cbtBtn} ${styles.cbtBtnSuccess}`}
            style={{ width: "100%" }}
          >
            TUTUP
          </button>
        </div>
      </div>
    );
  }

  // ======================== PROMPT FULLSCREEN ========================
  if (!isUjianMulai && !isReviewMode) {
    return (
      <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDark}`}>
        <div className={styles.cbtPromptCard}>
          <div className={`${styles.cbtIconBox} ${styles.cbtIconBoxDanger}`}>
            <FaExpand size={35} color="#ef4444" />
          </div>
          <h2 className={styles.cbtTitle}>PERHATIAN!</h2>
          <p className={styles.cbtDesc}>
            Ujian ini menggunakan sistem <b>Anti-Cheat</b>. Layar akan masuk ke mode penuh.<br /><br />
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
    <div
      ref={containerRef}
      className={`${styles.cbtFixedOverlay} ${styles.cbtBgLight}`}
      style={{ flexDirection: "column", padding: 0 }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>

        {/* OVERLAY: Peringatan Pelanggaran */}
        {showPeringatan && !isReviewMode && (
          <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDarker}`} style={{ zIndex: 999999 }}>
            <div className={`${styles.cbtPromptCard} ${styles.cbtPromptCardDanger}`}>
              <FaTriangleExclamation size={50} color="#ef4444" style={{ marginBottom: 15 }} />
              <h2 className={styles.cbtTitle}>PELANGGARAN!</h2>
              <p style={{ color: "#111827", fontWeight: "bold", marginBottom: 20 }}>
                Anda terdeteksi meninggalkan layar ujian. Peringatan ke-{pelanggaran}/3.
              </p>
              <button onClick={() => setShowPeringatan(false)} className={`${styles.cbtBtn} ${styles.cbtBtnDanger}`}>
                SAYA MENGERTI
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: Koneksi Terputus */}
        {koneksiTerputus && !isReviewMode && (
          <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgOffline}`} style={{ zIndex: 999999 }}>
            <div className={`${styles.cbtPromptCard} ${styles.cbtPromptCardOffline}`}>
              <FaWifi size={50} color="#111827" style={{ marginBottom: 15 }} />
              <h2 className={styles.cbtTitle}>KONEKSI TERPUTUS!</h2>
              <p style={{ color: "#111827", fontSize: 15, fontWeight: "bold", marginBottom: 30 }}>
                Gagal mengirim. <strong style={{ color: "#ef4444" }}>JANGAN TUTUP APLIKASI!</strong>
              </p>
              <button onClick={eksekusiSubmit} className={`${styles.cbtBtn} ${styles.cbtBtnPrimary}`} style={{ width: "100%" }}>
                COBA KIRIM MANUAL
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: Konfirmasi Submit — menggantikan window.confirm */}
        {showKonfirmasiSubmit && (
          <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDarker}`} style={{ zIndex: 999999 }}>
            <div className={styles.cbtPromptCard}>
              <FaCheckDouble size={40} color="#22c55e" style={{ marginBottom: 12 }} />
              <h2 className={styles.cbtTitle}>Kumpulkan Jawaban?</h2>
              <p className={styles.cbtDesc}>Yakin ingin menyelesaikan ujian sekarang?</p>
              <div className={styles.cbtBtnGroup}>
                <button onClick={batalKonfirmasiSubmit} className={`${styles.cbtBtn} ${styles.cbtBtnBatal}`}>BELUM</button>
                <button onClick={konfirmasiSubmit} disabled={isSubmitting} className={`${styles.cbtBtn} ${styles.cbtBtnSuccess}`}>
                  {isSubmitting ? "MENGIRIM..." : "YA, KUMPULKAN"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: Gagal Submit — menggantikan alert() saat server menolak jawaban */}
        {pesanGagalSubmit && (
          <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDarker}`} style={{ zIndex: 999999 }}>
            <div className={`${styles.cbtPromptCard} ${styles.cbtPromptCardDanger}`}>
              <FaTriangleExclamation size={40} color="#ef4444" style={{ marginBottom: 12 }} />
              <h2 className={styles.cbtTitle}>Gagal Mengumpulkan</h2>
              <p className={styles.cbtDesc}>{pesanGagalSubmit}</p>
              <button
                onClick={() => setPesanGagalSubmit(null)}
                className={`${styles.cbtBtn} ${styles.cbtBtnDanger}`}
                style={{ width: "100%" }}
              >
                COBA LAGI
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: Konfirmasi Keluar — menggantikan window.confirm */}
        {showKonfirmasiKeluar && (
          <div className={`${styles.cbtFixedOverlay} ${styles.cbtBgDarker}`} style={{ zIndex: 999999 }}>
            <div className={styles.cbtPromptCard}>
              <h2 className={styles.cbtTitle}>Keluar Ujian?</h2>
              <p className={styles.cbtDesc}>Waktu dan jawaban tersimpan aman.</p>
              <div className={styles.cbtBtnGroup}>
                <button onClick={() => setShowKonfirmasiKeluar(false)} className={`${styles.cbtBtn} ${styles.cbtBtnBatal}`}>TETAP UJIAN</button>
                <button onClick={onClose} className={`${styles.cbtBtn} ${styles.cbtBtnDark}`}>YA, KELUAR</button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className={`${styles.cbtHeader} ${isReviewMode ? styles.cbtHeaderReview : styles.cbtHeaderNormal}`}>
          <div>
            <h3 className={styles.galleryTitle} style={{ color: "#111827" }}>
              {isReviewMode ? `REVIEW | ${namaMapel}` : `CBT | ${namaMapel}`}
            </h3>
            {!isReviewMode && (
              <span className={`${styles.cbtTimer} ${sisaDetik < 300 ? styles.cbtTimerDanger : styles.cbtTimerSafe}`}>
                <FaClock size={16} /> WAKTU: {formatWaktu(sisaDetik)}
              </span>
            )}
            {isReviewMode && <span className={styles.cbtBadgeReview}>SELESAI</span>}
          </div>
          <button
            className={styles.galleryButton}
            onClick={() => {
              if (isReviewMode) { onClose(); return; }
              setShowKonfirmasiKeluar(true);
            }}
            style={{ border: "3px solid #111827", background: "white" }}
            aria-label="Keluar ujian"
          >
            <FaXmark size={20} color="#111827" />
          </button>
        </div>

        <div ref={scrollAreaRef} style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* PALET SOAL */}
          <div className={styles.paletContainer}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontWeight: 900, color: "#111827", fontSize: 13 }}>PALET SOAL</h4>
            </div>
            <div className={styles.paletScroll}>
              {daftarSoal.map((soal, index) => {
                const jwb  = jawabanSiswa[index];
                const tipe = soal.tipeSoal || "PG";
                let isTerjawab = false;
                if (tipe === "PG_KOMPLEKS") isTerjawab = Array.isArray(jwb) && jwb.length > 0;
                else if (tipe === "ISIAN") isTerjawab = String(jwb || "").trim() !== "";
                else isTerjawab = !!jwb;

                const isAktif = soalAktif === index;
                let bg = "white", tc = "#111827", shadow = "2px 2px 0 #111827";
                if (isReviewMode) {
                  if (cekJawabanBenar(index)) bg = "#4ade80";
                  else if (isTerjawab) { bg = "#f87171"; tc = "white"; }
                } else if (isTerjawab) { bg = "#3b82f6"; tc = "white"; }
                if (isAktif) shadow = "4px 4px 0 #111827";

                return (
                  <button key={index} onClick={() => setSoalAktif(index)}
                    className={styles.paletBtn}
                    style={{ background: bg, color: tc, boxShadow: shadow, transform: isAktif ? "translateY(-2px)" : "none" }}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* KERTAS SOAL */}
          <div className={styles.kertasSoalArea} style={{ userSelect: isReviewMode ? "auto" : "none" }}>
            <KertasSoalCBT
              soalSekarang={daftarSoal[soalAktif]}
              soalAktif={soalAktif}
              isReviewMode={isReviewMode}
              jawabanSiswa={jawabanSiswa}
              handlePilihJawaban={handlePilihJawaban}
              handleToggleKompleks={handleToggleKompleks}
              handleInputIsian={handleInputIsian}
            />

            {/* NAVIGASI */}
            <div className={styles.cbtBtnGroup} style={{ marginTop: "auto", paddingBottom: 20 }}>
              <button
                onClick={() => setSoalAktif((prev) => Math.max(0, prev - 1))}
                disabled={soalAktif === 0}
                className={`${styles.cbtBtn} ${soalAktif === 0 ? styles.cbtBtnSecondary : styles.cbtBtnBatal}`}
              >
                <FaChevronLeft /> KEMBALI
              </button>

              {!isReviewMode && isSoalTerakhir ? (
                <button
                  onClick={handleKumpulJawaban}
                  disabled={isSubmitting}
                  className={`${styles.cbtBtn} ${styles.cbtBtnSuccess}`}
                >
                  {isSubmitting ? "MENGIRIM..." : <><FaCheckDouble /> KUMPULKAN</>}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (isReviewMode && isSoalTerakhir) onClose();
                    else setSoalAktif((prev) => Math.min(totalSoal - 1, prev + 1));
                  }}
                  className={`${styles.cbtBtn} ${isReviewMode && isSoalTerakhir ? styles.cbtBtnDark : styles.cbtBtnPrimary}`}
                >
                  {isReviewMode && isSoalTerakhir ? "TUTUP REVIEW" : "LANJUT"} <FaChevronRight />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}