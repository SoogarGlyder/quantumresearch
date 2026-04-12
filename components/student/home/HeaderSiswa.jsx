"use client";

import { memo } from "react";
import Image from "next/image"; 
import { FaStar, FaTrophy } from "react-icons/fa6";
import { GAMIFIKASI } from "@/utils/constants";
import styles from "@/components/App.module.css";

const HeaderSiswa = memo(({ siswa, statsBulanIni, streakKonsul, onBukaKlasemen }) => {
  const expSaatIni = siswa.totalExp || 0;
  const expPerLevel = 500; 
  const levelSiswa = Math.floor(expSaatIni / expPerLevel) + 1;
  const expSisaUntukNaik = expSaatIni % expPerLevel;
  const persenLevel = Math.round((expSisaUntukNaik / expPerLevel) * 100);
  const lencanaSiswa = siswa.koleksiLencana || [];

  return (
    <div className={styles.appHeader}>
      <div className={styles.shapeRed}></div>
      <div className={styles.shapeYellow}></div>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
        </div>
      </div>
      
      <div className={styles.identityContainer}>
        <div style={{ width: '100%' }}>
          <p className={styles.welcomeText}>Selamat datang!</p>
          <h1 className={styles.userName}>{siswa.nama}</h1>
          
          <div style={{ marginTop: '12px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '10px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaStar color="#facc15" /> Level {levelSiswa}</span>
              <span>{expSisaUntukNaik} / {expPerLevel} EXP</span>
            </div>
            <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${persenLevel}%`, backgroundColor: '#4ade80', height: '100%', borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
            </div>
          </div>

          {lencanaSiswa.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {lencanaSiswa.map((lencana, index) => {
                const info = GAMIFIKASI.KAMUS_LENCANA[lencana.idLencana];
                if (!info) return null; 
                return (
                  <div key={index} style={{ backgroundColor: info.warna, padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title={`Didapat pada: ${new Date(lencana.tanggalDidapat).toLocaleDateString('id-ID')}`}>
                    {info.ikon} {info.nama}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className={styles.containerIdNumber} style={{ marginTop: '12px' }}>
           <span className={styles.IdNumber}>{siswa.username} | {siswa.nomorPeserta}</span>
        </div>
      </div>

      <div className={styles.infoContainer}>
         <h2 className={styles.infoHeader}>Pencapaian Bulan Ini</h2>
         <div className={styles.titleBadge}>{statsBulanIni.gelar}</div>

         <div className={styles.statGridContainer}>
            <div className={styles.statContainer}>
              <span className={styles.statLabel}>⏱️ Belajar</span>
              <span className={`${styles.statValue} ${styles.nilaiStatBiru}`}>{statsBulanIni.jamKonsul}j {statsBulanIni.menitSisa}m</span>
            </div>
            <div className={styles.statContainer}>
              <span className={styles.statLabel}>✅ Kehadiran</span>
              <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>
                {statsBulanIni.persenHadir}% 
                <span style={{fontSize:'11px', color:'#64748b', marginLeft: '4px'}}>({statsBulanIni.kelasHadir}/{statsBulanIni.jadwalWajibBulanIni})</span>
              </span>
            </div>
            <div className={styles.statContainer}>
              <span className={styles.statLabel}>📚 Terambis</span>
              <span className={styles.statValue} style={{fontSize: '14px'}}>{statsBulanIni.mapelTerambis}</span>
            </div>
            <div className={styles.statContainer}>
              {(siswa.kelas?.includes("12") || siswa.kelas?.toLowerCase().includes("alumni")) ? (
                <>
                  <span className={styles.statLabel}>⏳ UTBK 2026</span>
                  <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>H-{statsBulanIni.selisihHariUTBK}</span>
                </>
              ) : (
                <>
                  <span className={styles.statLabel}>🔥 Streak Konsul</span>
                  <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>{streakKonsul} Hari</span>
                </>
              )}
            </div>
         </div>

         <button onClick={onBukaKlasemen} className={styles.top10Button}>
            <FaTrophy size={18} /> Lihat Top 10 Ambis
         </button>
      </div>
    </div>
  );
});

HeaderSiswa.displayName = "HeaderSiswa";
export default HeaderSiswa;