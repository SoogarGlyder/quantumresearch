"use client";

import { memo } from "react";
import Image from "next/image"; 
import styles from "@/components/App.module.css";

const HeaderKonsul = memo(() => (
  <div className={`${styles.appHeader} header-aman-poni`}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <h1 className={styles.headerTitle}>Record Konsul</h1>
  </div>
));

HeaderKonsul.displayName = "HeaderKonsul";
export default HeaderKonsul;