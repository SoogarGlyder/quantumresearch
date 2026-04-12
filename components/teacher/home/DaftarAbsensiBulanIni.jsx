"use client";

import { memo } from "react";
import { FaClock } from "react-icons/fa6";
import KartuAbsen from "./KartuAbsen";
import styles from "@/components/App.module.css";

const DaftarAbsensiBulanIni = memo(({ riwayatAbsenBulanIni, idAbsenTerbuka, toggleAbsen }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaClock color="#facc15" /> Absensi Bulan Ini</h3>
    
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px'}}>
      {riwayatAbsenBulanIni.length === 0 ? (
        <p className={styles.emptySchedule}>Belum ada riwayat absensi bulan ini.</p>
      ) : (
        riwayatAbsenBulanIni.map(abs => (
          <KartuAbsen 
            key={abs._id} 
            abs={abs} 
            isOpen={idAbsenTerbuka === abs._id} 
            onToggle={toggleAbsen} 
          />
        ))
      )}
    </div>
  </div>
));

DaftarAbsensiBulanIni.displayName = "DaftarAbsensiBulanIni";
export default DaftarAbsensiBulanIni;