"use client";

import { memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; 
import { FaBuildingShield } from "react-icons/fa6"; 
import { PANGKAT_PENGAJAR } from "@/utils/constants"; 

import styles from "@/components/App.module.css";

const HeaderPengajar = memo(({ dataUser, statsPengajar }) => {
  const router = useRouter();

  // LOGIKA RBAC: Cek apakah user punya hak masuk ruang admin
  const isBisaMasukAdmin = 
    dataUser?.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK || 
    dataUser?.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH;

  //  FIX: Logika Konversi Waktu Bimbingan (Pembulatan Aman Tanpa Koma)
  const totalMenit = Math.round(statsPengajar?.totalMenitKonsul || 0);
  const jamKonsul = Math.floor(totalMenit / 60);
  const menitKonsul = totalMenit % 60;
  const totalSesiKonsul = statsPengajar?.totalSesiKonsul || 0;

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
             {dataUser?.kodePengajar} | {dataUser?.nomorPeserta}
             {dataUser?.pangkat && dataUser.pangkat !== PANGKAT_PENGAJAR.FREELANCE && (
               <span style={{ marginLeft: '6px',}}>| {dataUser.pangkat.replace('_', ' ')}</span>
             )}
           </span>
        </div>
      </div>

      <div className={styles.infoContainer} style={{ marginBottom: '0', marginTop: '12px' }}>
         <h2 className={styles.infoHeader}>Ringkasan Mengajar Bulan Ini</h2>
         
         {/* 3 Kotak Utama (Jadwal Kelas) */}
         <div className={styles.statGridContainer} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className={styles.statContainer}>
              <span className={styles.statLabel} style={{fontSize: '11px'}}>Total Sesi</span>
              <span className={`${styles.statValue} ${styles.nilaiStatBiru}`}>{statsPengajar?.totalKelas || 0}</span>
            </div>
            <div className={styles.statContainer}>        
              <span className={styles.statLabel} style={{fontSize: '11px'}}>Jurnal OK</span>
              <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>{statsPengajar?.jurnalSelesai || 0}</span>
            </div>
            <div className={styles.statContainer}>        
              <span className={styles.statLabel} style={{fontSize: '11px'}}>Presensi</span>
              <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>{statsPengajar?.totalAbsensi || 0}</span>
            </div>
         </div>

         {/*  FIX: 2 Kotak Baru (Konsul) dengan gaya yang identik */}
         <div className={styles.statGridContainer} style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '16px' }}>
            <div className={styles.statContainer}>
              <span className={styles.statLabel} style={{fontSize: '11px'}}>Durasi Konsul</span>
              <span className={`${styles.statValue} ${styles.nilaiStatBiru}`} style={{ fontSize: jamKonsul > 0 ? '16px' : '20px' }}>
                {jamKonsul > 0 ? `${jamKonsul}j ` : ""}{menitKonsul}m
              </span>
            </div>
            <div className={styles.statContainer}>
              <span className={styles.statLabel} style={{fontSize: '11px'}}>Sesi Konsul</span>
              <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>{totalSesiKonsul}</span>
            </div>
         </div>
      </div>

      <div>
        {isBisaMasukAdmin && (
          <button
            onClick={() => router.push('/admin')}
            style={{
              marginTop: '16px',
              padding: '12px 20px',
              backgroundColor: '#facc15', 
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
    </div>
  );
});

HeaderPengajar.displayName = "HeaderPengajar";
export default HeaderPengajar;