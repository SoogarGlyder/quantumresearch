"use client";

import { memo } from "react";
import { FaChevronDown, FaChevronUp, FaSkullCrossbones } from "react-icons/fa6";

// 🚀 PATH ABSOLUTE
import { STATUS_SESI, PERIODE_BELAJAR } from "@/utils/constants";
import { hitungDurasiMenit, formatJam } from "@/utils/formatHelper";
import styles from "@/components/App.module.css";

const RecordCard = memo(({ sesi, isOpen, onToggle }) => {
  const isSelesai = sesi.status === STATUS_SESI.SELESAI.id;
  const isPinalti = sesi.status === STATUS_SESI.PINALTI?.id;
  const isBerjalan = sesi.status === STATUS_SESI.BERJALAN.id;

  const formatTanggalTanpaTahun = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString('id-ID', {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className={`${styles.recordCard} ${styles.recordCardClickable}`} onClick={() => onToggle(sesi._id)}>
      <div className={styles.recordCardRow}>
        <p className={styles.recordDate}>{formatTanggalTanpaTahun(sesi.waktuMulai)}</p>
        
        {isPinalti ? (
          <span className={styles.recordDuration} style={{ backgroundColor: '#111827', color: '#ef4444', border: '2px solid #ef4444', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <FaSkullCrossbones /> PINALTI
          </span>
        ) : (
          <span 
            className={styles.recordDuration} 
            style={{ backgroundColor: isSelesai ? '#4ade80' : '#facc15', display: isSelesai ? 'none' : 'flex', border: '2px solid #111827', color: '#111827' }}
          >
            {isBerjalan ? "Sedang Berjalan" : sesi.status.charAt(0).toUpperCase() + sesi.status.slice(1)}
          </span>
        )}

        {isSelesai && <span className={styles.recordDuration}>{hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)} menit</span>}
      </div>

      <div className={styles.recordCardRow}>
        <h3 className={styles.recordTitle}>{sesi.namaMapel || "Umum"}</h3>
        <div style={{ marginTop: '12px', color: '#111827', transition: 'transform 0.2s' }}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className={styles.recordDetail}>
            <div className={styles.recordDetailRow} style={{ backgroundColor: '#dbeafe' }}>
              <span>Mulai</span>
              <span>{formatJam(sesi.waktuMulai)} WIB</span>
            </div>
            
            <div className={styles.recordDetailRow} style={{ backgroundColor: isSelesai ? '#dcfce3' : isPinalti ? '#fecaca' : '#fef08a' }}>
              <span>Selesai</span>
              <span>{isSelesai || isPinalti ? `${formatJam(sesi.waktuSelesai)} WIB` : 'Sedang Berjalan...'}</span>
            </div>
            
            {isPinalti && (
              <div style={{ backgroundColor: '#111827', color: 'white', padding: '8px', fontSize: '11px', textAlign: 'center', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px', fontWeight: 'bold' }}>
                Sesi dihentikan karena kamu lupa Scan Out! (0 Menit)
              </div>
            )}
        </div>
      )}
    </div>
  );
});

RecordCard.displayName = "RecordCard";
export default RecordCard;