"use client";

import { memo } from "react";
import styles from "@/components/App.module.css";

const InstruksiArea = memo(({ isSudahMasuk }) => (
  <div className={styles.tabScanContainer}>
    <div 
      className={styles.scheduleOption}
      style={{
        backgroundColor: isSudahMasuk ? '#fecaca' : '#fef08a',
        borderColor: isSudahMasuk ? '#ef4444' : '#facc15',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px',
        boxShadow: '4px 4px 0 #111827',
        borderWidth: '3px'
      }}
    >
      <span style={{ color: isSudahMasuk ? '#ef4444' : '#111827', fontWeight: '900', textTransform: 'uppercase' }}>
        {isSudahMasuk ? '🛑 SCAN UNTUK CLOCK-OUT' : '🟢 SCAN UNTUK CLOCK-IN'}
      </span>
    </div>
  </div>
));

InstruksiArea.displayName = "InstruksiArea";
export default InstruksiArea;