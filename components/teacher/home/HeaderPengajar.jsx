"use client";

import { memo } from "react";
import Image from "next/image";
import styles from "@/components/App.module.css";

const HeaderPengajar = memo(({ dataUser, statsPengajar }) => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <div className={styles.identityContainer}>
      <p className={styles.welcomeText}>Selamat mengajar!</p>
      <h1 className={styles.userName}>{dataUser?.nama || "Pengajar Quantum"}</h1>
      <div className={styles.containerIdNumber}>
         <span className={styles.IdNumber}>Kode: {dataUser?.kodePengajar} | ID: {dataUser?.nomorPeserta}</span>
      </div>
    </div>
    <div className={styles.infoContainer} style={{ marginBottom: '0', marginTop: '24px' }}>
       <h2 className={styles.infoHeader}>Ringkasan Mengajar Bulan Ini</h2>
       <div className={styles.statGridContainer} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className={styles.statContainer}>
            <span className={styles.statLabel} style={{fontSize: '11px'}}>Total Sesi</span>
            <span className={`${styles.statValue} ${styles.nilaiStatBiru}`}>{statsPengajar.totalKelas}</span>
          </div>
          <div className={styles.statContainer}>        
            <span className={styles.statLabel} style={{fontSize: '11px'}}>Jurnal OK</span>
            <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>{statsPengajar.jurnalSelesai}</span>
          </div>
          <div className={styles.statContainer}>        
            <span className={styles.statLabel} style={{fontSize: '11px'}}>Absensi</span>
            <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>{statsPengajar.totalAbsensi}</span>
          </div>
       </div>
    </div>
  </div>
));

HeaderPengajar.displayName = "HeaderPengajar";
export default HeaderPengajar;