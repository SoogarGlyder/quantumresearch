"use client";

import { memo } from "react";
import { FaCheck, FaXmark as FaCross, FaSquareCheck, FaRegSquare } from "react-icons/fa6";
import katex from "katex";
import "katex/dist/katex.min.css";
import styles from "@/components/App.module.css";

/** Render LaTeX inline di dalam string HTML */
const renderLaTeX = (htmlString) => {
  if (!htmlString) return { __html: "" };
  const rendered = htmlString.replace(/\$([^\$]+)\$/g, (match, rumus) => {
    try { return katex.renderToString(rumus, { throwOnError: false }); }
    catch { return match; }
  });
  return { __html: rendered };
};

/**
 * Mendeteksi apakah teks opsi benar-benar kosong.
 * Editor teks kadang menyisakan tag <p></p> kosong — opsi ini tidak ditampilkan.
 */
const isOpsiKosong = (teks) => {
  if (!teks) return true;
  const t = teks.trim();
  return (
    (t === "" || t === "<p></p>" || t === "<p><br></p>") &&
    !t.includes("<img") &&
    !t.includes("$")
  );
};

const KertasSoalCBT = memo(({
  soalSekarang, soalAktif, isReviewMode, jawabanSiswa,
  handlePilihJawaban, handleToggleKompleks, handleInputIsian,
}) => {
  if (!soalSekarang) return null;

  const tipeSoalAktif  = soalSekarang.tipeSoal || "PG";
  const daftarOpsi     = Array.isArray(soalSekarang.opsi) ? soalSekarang.opsi : [];
  const kunciDbAsli    = Array.isArray(soalSekarang.kunciJawaban)
    ? soalSekarang.kunciJawaban
    : [String(soalSekarang.kunciJawaban || "")];
  const kunciDbTunggal = kunciDbAsli[0] || "";

  return (
    <div className={styles.kertasSoalCard}>

      {/* Header soal */}
      <div className={styles.kertasHeaderInfo}>
        <span className={styles.badgeSoalNo}>SOAL NO. {soalAktif + 1}</span>
        <span className={styles.badgeSoalExp}>{soalSekarang.bobotExp || 20} EXP</span>
      </div>

      {/* Gambar & teks soal */}
      <div style={{ marginBottom: 30 }}>
        {soalSekarang.gambar && (
          <img
            src={soalSekarang.gambar}
            alt="Soal"
            className={styles.soalImage}
            style={{ pointerEvents: isReviewMode ? "auto" : "none" }}
          />
        )}
        <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pertanyaan)} className={styles.soalText} />
      </div>

      {/* Opsi jawaban */}
      <div className={styles.opsiContainer}>

        {/* 1. PILIHAN GANDA */}
        {tipeSoalAktif === "PG" && daftarOpsi.map((item, index) => {
          if (isOpsiKosong(item.teks)) return null;
          const abjad       = item.label;
          const isSelected  = String(jawabanSiswa[soalAktif] || "") === abjad;
          const isKunci     = isReviewMode && kunciDbTunggal === abjad;
          const isSalah     = isReviewMode && isSelected && !isKunci;

          let bg = "white", bgHuruf = "#f1f5f9", tcHuruf = "#111827", shadow = "4px 4px 0 #111827";
          if (isReviewMode) {
            if (isKunci)      { bg = "#dcfce3"; bgHuruf = "#22c55e"; tcHuruf = "white"; }
            else if (isSalah) { bg = "#fef2f2"; bgHuruf = "#ef4444"; tcHuruf = "white"; }
          } else if (isSelected) { bg = "#bfdbfe"; bgHuruf = "#2563eb"; tcHuruf = "white"; shadow = "2px 2px 0 #111827"; }

          return (
            <div key={index}
              onClick={() => !isReviewMode && handlePilihJawaban(soalAktif, abjad)}
              className={styles.opsiItem}
              style={{ background: bg, boxShadow: shadow, cursor: isReviewMode ? "default" : "pointer", transform: (!isReviewMode && isSelected) ? "translate(2px,2px)" : "none" }}>
              <span className={styles.opsiHuruf} style={{ background: bgHuruf, color: tcHuruf }}>
                {isKunci ? <FaCheck size={16} /> : isSalah ? <FaCross size={16} /> : abjad}
              </span>
              <div dangerouslySetInnerHTML={renderLaTeX(item.teks)} className={styles.opsiText} />
            </div>
          );
        })}

        {/* 2. PILIHAN GANDA KOMPLEKS */}
        {tipeSoalAktif === "PG_KOMPLEKS" && daftarOpsi.map((item, index) => {
          if (isOpsiKosong(item.teks)) return null;
          const abjad    = item.label;
          const jwbArr   = Array.isArray(jawabanSiswa[soalAktif]) ? jawabanSiswa[soalAktif] : [];
          const isSelected = jwbArr.includes(abjad);
          const isKunci  = isReviewMode && kunciDbAsli.includes(abjad);
          const isSalah  = isReviewMode && isSelected && !isKunci;

          let bg = "white", tc = "#111827", shadow = "4px 4px 0 #111827";
          if (isReviewMode) {
            if (isKunci)      { bg = "#dcfce3"; tc = "#22c55e"; }
            else if (isSalah) { bg = "#fef2f2"; tc = "#ef4444"; }
          } else if (isSelected) { bg = "#bfdbfe"; tc = "#2563eb"; shadow = "2px 2px 0 #111827"; }

          return (
            <div key={index}
              onClick={() => !isReviewMode && handleToggleKompleks(soalAktif, abjad)}
              className={styles.opsiItem}
              style={{ background: bg, boxShadow: shadow, cursor: isReviewMode ? "default" : "pointer", transform: (!isReviewMode && isSelected) ? "translate(2px,2px)" : "none" }}>
              <span style={{ display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, color: tc }}>
                {isSelected || isKunci ? <FaSquareCheck size={26} /> : <FaRegSquare size={26} />}
              </span>
              <div dangerouslySetInnerHTML={renderLaTeX(item.teks)} className={styles.opsiText} />
            </div>
          );
        })}

        {/* 3. BENAR / SALAH */}
        {tipeSoalAktif === "BENAR_SALAH" && (
          <div className={styles.opsiBsGrid}>
            {["A", "B"].map((opsi) => {
              const label     = opsi === "A" ? "✅ BENAR" : "❌ SALAH";
              const isSelected = String(jawabanSiswa[soalAktif] || "") === opsi;
              const isKunci   = isReviewMode && kunciDbTunggal === opsi;
              const isSalah   = isReviewMode && isSelected && !isKunci;

              let bg = "white", border = "#111827", tc = "#111827";
              if (isReviewMode) {
                if (isKunci)      { bg = "#4ade80"; }
                else if (isSalah) { bg = "#f87171"; tc = "white"; border = "#f87171"; }
              } else if (isSelected) { bg = "#3b82f6"; tc = "white"; }

              return (
                <button key={opsi}
                  onClick={() => !isReviewMode && handlePilihJawaban(soalAktif, opsi)}
                  className={styles.opsiBsBtn}
                  style={{ border: `4px solid ${border}`, cursor: isReviewMode ? "default" : "pointer", background: bg, color: tc, boxShadow: (isReviewMode || isSelected) ? "none" : "6px 6px 0 #111827", transform: (!isReviewMode && isSelected) ? "translate(6px,6px)" : "none" }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* 4. ISIAN SINGKAT */}
        {tipeSoalAktif === "ISIAN" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="text"
              placeholder={isReviewMode ? "" : "Ketik jawaban Anda di sini..."}
              value={jawabanSiswa[soalAktif] || ""}
              onChange={(e) => !isReviewMode && handleInputIsian(soalAktif, e.target.value)}
              disabled={isReviewMode}
              className={styles.isianInput}
              style={{ background: isReviewMode ? "#f1f5f9" : "white", boxShadow: isReviewMode ? "none" : "4px 4px 0 #111827" }}
            />
            {isReviewMode && (
              <div className={styles.isianKunciBox}
                style={{ background: String(jawabanSiswa[soalAktif] || "").trim().toLowerCase() === kunciDbTunggal.toLowerCase() ? "#dcfce3" : "#fef2f2" }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 900, marginBottom: 4, color: "#111827" }}>KUNCI JAWABAN YANG BENAR:</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#166534" }}>{kunciDbTunggal}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pembahasan */}
      {isReviewMode && soalSekarang.pembahasan && (
        <div className={styles.pembahasanBox}>
          <span className={styles.pembahasanBadge}>💡 PEMBAHASAN:</span>
          <div dangerouslySetInnerHTML={renderLaTeX(soalSekarang.pembahasan)} className={styles.soalText} style={{ lineHeight: 1.6 }} />
        </div>
      )}
    </div>
  );
});

KertasSoalCBT.displayName = "KertasSoalCBT";
export default KertasSoalCBT;