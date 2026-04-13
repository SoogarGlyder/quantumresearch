"use client";

import { memo } from "react";
import { FaHourglassHalf, FaChevronUp, FaChevronDown } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const KartuAbsen = memo(({ abs, isOpen, onToggle }) => {
  const isSelesai = !!abs.waktuKeluar;
  const formatWaktu = (date) => new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatTanggal = (date) => new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={`${styles.recordCard} ${styles.recordCardClickable}`} onClick={() => onToggle(abs._id)} style={{ border: '3px solid #111827', margin: '0 0 20px'}}>
      <div className={styles.recordCardRow}>
        <p className={styles.recordDate}>{formatTanggal(abs.waktuMasuk)}</p>
        
        {!isSelesai && (
          <span className={styles.recordDuration} style={{ backgroundColor: '#fef08a', color: '#111827', border: '2px solid #111827', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <FaHourglassHalf className={styles.spin} /> Bertugas
          </span>
        )}
        
        <div style={{ color: '#111827' }}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className={styles.recordDetail} style={{ marginTop: '12px' }}>
            <div className={styles.recordDetailRow} style={{ backgroundColor: '#dbeafe', border: '2px solid #111827', marginBottom: '4px' }}>
              <span>Clock In</span>
              <span style={{ fontWeight: '900' }}>{formatWaktu(abs.waktuMasuk)} WIB</span>
            </div>
            <div className={styles.recordDetailRow} style={{ backgroundColor: isSelesai ? '#dcfce3' : '#fef08a', border: '2px solid #111827' }}>
              <span>Clock Out</span>
              <span style={{ fontWeight: '900' }}>{isSelesai ? `${formatWaktu(abs.waktuKeluar)} WIB` : 'Sedang Bertugas...'}</span>
            </div>
        </div>
      )}
    </div>
  );
});

KartuAbsen.displayName = "KartuAbsen";
export default KartuAbsen;