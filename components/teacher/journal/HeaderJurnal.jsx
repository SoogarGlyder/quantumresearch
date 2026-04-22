"use client";

import { memo } from "react";
import Image from "next/image";
import styles from "@/components/App.module.css";

const HeaderJurnal = memo(({ totalArsip }) => (
  <div className={`${styles.appHeader} header-aman-poni`}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <div className={styles.identityContainer}>
      <p className={styles.welcomeText}>Administrasi Mengajar</p>
      <h1 className={styles.userName}>Arsip Jurnal</h1>
      <div className={styles.containerIdNumber}>
         <span className={styles.IdNumber}>Ditemukan {totalArsip} riwayat kelas bulan ini</span>
      </div>
    </div>
  </div>
));

HeaderJurnal.displayName = "HeaderJurnal";
export default HeaderJurnal;