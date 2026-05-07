"use client";

import { memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // FIX: Import router untuk pindah ke /admin
import { FaBuildingShield } from "react-icons/fa6"; // FIX: Icon Tameng Admin
import { PANGKAT_PENGAJAR } from "@/utils/constants"; // FIX: Import Konstanta Pangkat

import styles from "@/components/App.module.css";

const HeaderPengajar = memo(({ dataUser, statsPengajar }) => {
  const router = useRouter();

  // LOGIKA RBAC: Cek apakah user punya hak masuk ruang admin
  const isBisaMasukAdmin = 
    dataUser?.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK || 
    dataUser?.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH;

  return (
    <div className={`${styles.appHeader} header-aman-poni`}>
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
           <span className={styles.IdNumber}>
             Kode: {dataUser?.kodePengajar} | ID: {dataUser?.nomorPeserta}
             {/* Indikator Pangkat Kecil di sebelah ID */}
             {dataUser?.pangkat && dataUser.pangkat !== PANGKAT_PENGAJAR.FREELANCE && (
               <span style={{ marginLeft: '6px', color: '#facc15' }}>• {dataUser.pangkat.replace('_', ' ')}</span>
             )}
           </span>
        </div>

        {/* TOMBOL RAHASIA (Hanya Muncul untuk Staff Akademik & Kakak Asuh) */}
        {isBisaMasukAdmin && (
          <button
            onClick={() => router.push('/admin')}
            style={{
              marginTop: '16px',
              padding: '12px 20px',
              backgroundColor: '#facc15', // Warna Emas Mencolok
              color: '#111827',
              border: '3px solid #111827',
              borderRadius: '12px',
              fontWeight: '900',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '4px 4px 0 #111827',
              cursor: 'pointer',
              width: '100%',
              textTransform: 'uppercase',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translate(4px, 4px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translate(0, 0)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(0, 0)'}
          >
            <FaBuildingShield size={18} /> Masuk Ruang Admin
          </button>
        )}
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
              <span className={styles.statLabel} style={{fontSize: '11px'}}>Presensi</span>
              <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>{statsPengajar.totalAbsensi}</span>
            </div>
         </div>
      </div>
    </div>
  );
});

HeaderPengajar.displayName = "HeaderPengajar";
export default HeaderPengajar;