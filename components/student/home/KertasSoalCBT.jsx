"use client";

import { memo } from "react";
import { FaCheck, FaXmark as FaCross, FaSquareCheck, FaRegSquare } from "react-icons/fa6";
import katex from 'katex';
import 'katex/dist/katex.min.css';
import styles from "@/components/App.module.css";

const renderLaTeX = (htmlString) => {
  if (!htmlString) return { __html: "" };
  const rendered = htmlString.replace(/\$([^\$]+)\$/g, (match, rumus) => {
    try { return katex.renderToString(rumus, { throwOnError: false }); } 
    catch (e) { return match; }
  });
  return { __html: rendered };
};

const KertasSoalCBT = memo(({ 
  soalSekarang, soalAktif, isReviewMode, jawabanSiswa, 
  handlePilihJawaban, handleToggleKompleks, handleInputIsian 
}) => {
  const tipeSoalAktif = soalSekarang.tipeSoal || "PG";
  const opsiAbjad = soalSekarang.opsi && Object.keys(soalSekarang.opsi).length === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className={styles.kertasSoalCard}>
      
      {/* HEADER SOAL */}
      <div className={styles.kertasHeaderInfo}>
        <span className={styles.badgeSoalNo}>SOAL NO. {soalAktif + 1}</span>
        <span className={styles.badgeSoalExp}>{soalSekarang.bobotExp || 20} EXP</span>
      </div>

      {/* GAMBAR & TEKS SOAL */}
      <div style={{ marginBottom: '30px' }}>
        {soalSekarang.gambar && (
          <img src={soalSekarang.gambar} alt="Soal" className={styles.soalImage} style={{ pointerEvents: isReviewMode ? 'auto' : 'none' }} />
        )}
        <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pertanyaan)} className={styles.soalText} />
      </div>

      {/* OPSI JAWABAN */}
      <div className={styles.opsiContainer}>
        
        {tipeSoalAktif === "PG" && opsiAbjad.map((opsi) => {
          if (!soalSekarang.opsi || !soalSekarang.opsi[opsi]) return null;
          const isSelected = jawabanSiswa[soalAktif] === opsi;
          const isKunciBenar = isReviewMode && soalSekarang.kunciJawaban === opsi;
          const isSalahPilih = isReviewMode && isSelected && !isKunciBenar;

          let bgOpsi = 'white'; let bgHuruf = '#f1f5f9'; let textHuruf = '#111827'; let bayanganOpsi = '4px 4px 0 #111827';
          if (isReviewMode) {
            if (isKunciBenar) { bgOpsi = '#dcfce3'; bgHuruf = '#22c55e'; textHuruf = 'white'; }
            else if (isSalahPilih) { bgOpsi = '#fef2f2'; bgHuruf = '#ef4444'; textHuruf = 'white'; }
          } else if (isSelected) { 
            bgOpsi = '#bfdbfe'; bgHuruf = '#2563eb'; textHuruf = 'white'; bayanganOpsi = '2px 2px 0 #111827'; 
          }

          return (
            <div key={opsi} onClick={() => handlePilihJawaban(soalAktif, opsi)}
              className={styles.opsiItem}
              style={{ background: bgOpsi, boxShadow: bayanganOpsi, cursor: isReviewMode ? 'default' : 'pointer', transform: (!isReviewMode && isSelected) ? 'translate(2px, 2px)' : 'none' }}>
              <span className={styles.opsiHuruf} style={{ background: bgHuruf, color: textHuruf }}>
                {isKunciBenar ? <FaCheck size={16}/> : (isSalahPilih ? <FaCross size={16}/> : opsi)}
              </span>
              <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.opsi[opsi])} className={styles.opsiText} />
            </div>
          );
        })}

        {tipeSoalAktif === "PG_KOMPLEKS" && opsiAbjad.map((opsi) => {
          if (!soalSekarang.opsi || !soalSekarang.opsi[opsi]) return null;
          const isSelected = Array.isArray(jawabanSiswa[soalAktif]) && jawabanSiswa[soalAktif].includes(opsi);
          const isKunciBenar = isReviewMode && Array.isArray(soalSekarang.kunciJawaban) && soalSekarang.kunciJawaban.includes(opsi);
          const isSalahPilih = isReviewMode && isSelected && !isKunciBenar;

          let bgOpsi = 'white'; let textHuruf = '#111827'; let bayanganOpsi = '4px 4px 0 #111827';
          if (isReviewMode) {
            if (isKunciBenar) { bgOpsi = '#dcfce3'; textHuruf = '#22c55e'; }
            else if (isSalahPilih) { bgOpsi = '#fef2f2'; textHuruf = '#ef4444'; }
          } else if (isSelected) { 
            bgOpsi = '#bfdbfe'; textHuruf = '#2563eb'; bayanganOpsi = '2px 2px 0 #111827'; 
          }

          return (
            <div key={opsi} onClick={() => handleToggleKompleks(soalAktif, opsi)}
              className={styles.opsiItem}
              style={{ background: bgOpsi, boxShadow: bayanganOpsi, cursor: isReviewMode ? 'default' : 'pointer', transform: (!isReviewMode && isSelected) ? 'translate(2px, 2px)' : 'none' }}>
              <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, color: textHuruf }}>
                 {isSelected || isKunciBenar ? <FaSquareCheck size={26} /> : <FaRegSquare size={26} />}
              </span>
              <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.opsi[opsi])} className={styles.opsiText} />
            </div>
          );
        })}

        {tipeSoalAktif === "BENAR_SALAH" && (
          <div className={styles.opsiBsGrid}>
            {['A', 'B'].map((opsi) => {
              const label = opsi === 'A' ? '✅ BENAR' : '❌ SALAH';
              const isSelected = jawabanSiswa[soalAktif] === opsi;
              const isKunciBenar = isReviewMode && soalSekarang.kunciJawaban === opsi;
              const isSalahPilih = isReviewMode && isSelected && !isKunciBenar;

              let bgOpsi = 'white'; let borderCol = '#111827'; let textColor = '#111827';
              if (isReviewMode) {
                if (isKunciBenar) { bgOpsi = '#4ade80'; textColor = '#111827'; }
                else if (isSalahPilih) { bgOpsi = '#f87171'; textColor = 'white'; borderCol = '#f87171'; }
              } else if (isSelected) { 
                bgOpsi = '#3b82f6'; textColor = 'white'; 
              }

              return (
                <button key={opsi} onClick={() => handlePilihJawaban(soalAktif, opsi)}
                  className={styles.opsiBsBtn}
                  style={{ border: `4px solid ${borderCol}`, cursor: isReviewMode ? 'default' : 'pointer', background: bgOpsi, color: textColor, boxShadow: (isReviewMode || isSelected) ? 'none' : '6px 6px 0 #111827', transform: (!isReviewMode && isSelected) ? 'translate(6px, 6px)' : 'none' }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}

        {tipeSoalAktif === "ISIAN" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder={isReviewMode ? "" : "Ketik jawaban Anda di sini..."}
              value={jawabanSiswa[soalAktif] || ""}
              onChange={(e) => handleInputIsian(soalAktif, e.target.value)}
              disabled={isReviewMode}
              className={styles.isianInput}
              style={{ background: isReviewMode ? '#f1f5f9' : 'white', boxShadow: isReviewMode ? 'none' : '4px 4px 0 #111827' }}
            />
            {isReviewMode && (
              <div className={styles.isianKunciBox} style={{ background: String(jawabanSiswa[soalAktif] || "").trim().toLowerCase() === String(soalSekarang.kunciJawaban || "").trim().toLowerCase() ? '#dcfce3' : '#fef2f2' }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: '900', marginBottom: '4px', color: '#111827' }}>KUNCI JAWABAN YANG BENAR:</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#166534' }}>{soalSekarang.kunciJawaban}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOX PEMBAHASAN */}
      {isReviewMode && soalSekarang.pembahasan && (
        <div className={styles.pembahasanBox}>
          <span className={styles.pembahasanBadge}>💡 PEMBAHASAN:</span>
          <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pembahasan)} className={styles.soalText} style={{ lineHeight: '1.6' }} />
        </div>
      )}
    </div>
  );
});

KertasSoalCBT.displayName = "KertasSoalCBT";
export default KertasSoalCBT;