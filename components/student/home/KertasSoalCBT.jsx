"use client";

import { memo } from "react";
import { FaCheck, FaXmark as FaCross, FaSquareCheck, FaRegSquare } from "react-icons/fa6";
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

const KertasSoalCBT = memo(({ 
  soalSekarang, soalAktif, isReviewMode, jawabanSiswa, 
  handlePilihJawaban, handleToggleKompleks, handleInputIsian 
}) => {
  const tipeSoalAktif = soalSekarang.tipeSoal || "PG";
  const opsiAbjad = soalSekarang.opsi && Object.keys(soalSekarang.opsi).length === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '4px solid #111827', boxShadow: '8px 8px 0 #111827', marginBottom: '30px' }}>
      
      {/* HEADER SOAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '4px solid #111827', paddingBottom: '16px' }}>
        <span style={{ fontWeight: '900', fontSize: '18px', color: '#111827', background: '#facc15', padding: '6px 12px', borderRadius: '8px', border: '2px solid #111827' }}>
          SOAL NO. {soalAktif + 1}
        </span>
        <span style={{ fontWeight: '900', fontSize: '14px', color: '#111827', background: '#e2e8f0', padding: '4px 10px', borderRadius: '6px', border: '2px solid #111827' }}>
          {soalSekarang.bobotExp || 20} EXP
        </span>
      </div>

      {/* GAMBAR & TEKS SOAL */}
      <div style={{ marginBottom: '30px' }}>
        {soalSekarang.gambar && (
          <img src={soalSekarang.gambar} alt="Soal" style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '12px', border: '3px solid #111827', marginBottom: '20px', objectFit: 'contain', pointerEvents: isReviewMode ? 'auto' : 'none', boxShadow: '4px 4px 0 #111827' }} />
        )}
        <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pertanyaan)} style={{ fontSize: '18px', color: '#111827', fontWeight: 'bold', lineHeight: '1.7' }} />
      </div>

      {/* OPSI JAWABAN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
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
              style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: bgOpsi, border: '3px solid #111827', borderRadius: '12px', boxShadow: bayanganOpsi, cursor: isReviewMode ? 'default' : 'pointer', transition: '0.1s', transform: (!isReviewMode && isSelected) ? 'translate(2px, 2px)' : 'none' }}>
              <span style={{ fontWeight: '900', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, background: bgHuruf, color: textHuruf, borderRadius: '8px', border: '2px solid #111827', fontSize: '16px' }}>
                {isKunciBenar ? <FaCheck size={16}/> : (isSalahPilih ? <FaCross size={16}/> : opsi)}
              </span>
              <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.opsi[opsi])} style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }} />
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
              style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: bgOpsi, border: '3px solid #111827', borderRadius: '12px', boxShadow: bayanganOpsi, cursor: isReviewMode ? 'default' : 'pointer', transition: '0.1s', transform: (!isReviewMode && isSelected) ? 'translate(2px, 2px)' : 'none' }}>
              <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, color: textHuruf }}>
                 {isSelected || isKunciBenar ? <FaSquareCheck size={26} /> : <FaRegSquare size={26} />}
              </span>
              <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.opsi[opsi])} style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }} />
            </div>
          );
        })}

        {tipeSoalAktif === "BENAR_SALAH" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                  style={{ padding: '20px', fontSize: '20px', fontWeight: '900', border: `4px solid ${borderCol}`, borderRadius: '12px', cursor: isReviewMode ? 'default' : 'pointer', background: bgOpsi, color: textColor, boxShadow: (isReviewMode || isSelected) ? 'none' : '6px 6px 0 #111827', transform: (!isReviewMode && isSelected) ? 'translate(6px, 6px)' : 'none' }}
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
              style={{ width: '100%', padding: '20px', border: '4px solid #111827', borderRadius: '12px', fontSize: '20px', fontWeight: '900', outline: 'none', background: isReviewMode ? '#f1f5f9' : 'white', color: '#111827', boxShadow: isReviewMode ? 'none' : '4px 4px 0 #111827' }}
            />
            {isReviewMode && (
              <div style={{ padding: '16px', borderRadius: '12px', border: '3px solid #111827', background: String(jawabanSiswa[soalAktif] || "").trim().toLowerCase() === String(soalSekarang.kunciJawaban || "").trim().toLowerCase() ? '#dcfce3' : '#fef2f2' }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: '900', marginBottom: '4px', color: '#111827' }}>KUNCI JAWABAN YANG BENAR:</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#166534' }}>{soalSekarang.kunciJawaban}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOX PEMBAHASAN */}
      {isReviewMode && soalSekarang.pembahasan && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#fef08a', border: '3px solid #111827', borderRadius: '12px', boxShadow: '4px 4px 0 #111827' }}>
          <span style={{ display: 'inline-block', fontWeight: '900', color: '#111827', marginBottom: '12px', fontSize: '15px', background: 'white', padding: '4px 10px', borderRadius: '6px', border: '2px solid #111827' }}>💡 PEMBAHASAN:</span>
          <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pembahasan)} style={{ fontSize: '16px', color: '#111827', fontWeight: 'bold', lineHeight: '1.6' }} />
        </div>
      )}
    </div>
  );
});

KertasSoalCBT.displayName = "KertasSoalCBT";
export default KertasSoalCBT;