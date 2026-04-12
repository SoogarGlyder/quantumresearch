"use client";

import { memo } from "react";
import Image from "next/image";
import styles from "@/components/App.module.css";

const HeaderTugas = memo(({ totalTugas }) => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <div className={styles.identityContainer}>
      <p className={styles.welcomeText}>Manajemen Pusat Soal</p>
      <h1 className={styles.userName}>Bank Tugas</h1>
      <div className={styles.containerIdNumber}>
         <span className={styles.IdNumber}>Anda memiliki {totalTugas} materi yang dibagikan</span>
      </div>
    </div>
  </div>
));

HeaderTugas.displayName = "HeaderTugas";
export default HeaderTugas;