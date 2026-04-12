"use client";

import { useState, useEffect } from "react";
import { FaTrophy, FaCrown, FaMedal } from "react-icons/fa6";

// 🚀 FIX: Path Absolute
import { dapatkanKlasemenBulanIni } from "@/actions/klasemenAction";
import styles from "@/components/App.module.css";

export default function ModalKlasemen({ onClose, kelasSiswa }) {
  const [dataKlasemen, setDataKlasemen] = useState([]);
  const [loadingKlasemen, setLoadingKlasemen] = useState(true);
  const [filterAktif, setFilterAktif] = useState("Semua Kelas");

  useEffect(() => {
    let isMounted = true; 
    setLoadingKlasemen(true);
    
    dapatkanKlasemenBulanIni(filterAktif).then(hasil => {
      if (isMounted) {
        if (hasil.sukses) setDataKlasemen(hasil.data);
        setLoadingKlasemen(false);
      }
    });
    
    return () => { isMounted = false; };
  }, [filterAktif]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalKonten} onClick={(e) => e.stopPropagation()}>
        <button className={styles.tombolTutupModal} onClick={onClose}>X</button>
        
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaTrophy color="#facc15" /> Top 10 Ambis
        </h2>

        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '4px', marginBottom: '16px' }}>
          <button 
            onClick={() => setFilterAktif("Semua Kelas")}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '6px',
              backgroundColor: filterAktif === "Semua Kelas" ? '#ffffff' : 'transparent',
              color: filterAktif === "Semua Kelas" ? '#2563eb' : '#64748b',
              fontWeight: 'bold', cursor: 'pointer', 
              boxShadow: filterAktif === "Semua Kelas" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s', fontSize: '14px'
            }}
          >
            🌍 Global
          </button>
          
          <button 
            onClick={() => setFilterAktif(kelasSiswa || "-")}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '6px',
              backgroundColor: filterAktif !== "Semua Kelas" ? '#ffffff' : 'transparent',
              color: filterAktif !== "Semua Kelas" ? '#2563eb' : '#64748b',
              fontWeight: 'bold', cursor: 'pointer', 
              boxShadow: filterAktif !== "Semua Kelas" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s', fontSize: '14px'
            }}
          >
            🎓 Kelas Saya
          </button>
        </div>

        {loadingKlasemen ? (
          <div className={styles.wadahKlasemen}>
            {[1, 2, 3].map(i => <div key={i} className={styles.messageLoading} style={{ height: '80px', borderRadius: '16px' }}></div>)}
          </div>
        ) : dataKlasemen.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ fontSize: '40px', margin: '0' }}>📭</p>
            <p className={styles.emptySchedule}>Belum ada data konsul untuk kategori ini.</p>
          </div>
        ) : (
          <div className={styles.wadahKlasemen}>
            {dataKlasemen.map((sis) => (
              <div key={sis.idSiswa} className={`${styles.kartuPeringkat} ${sis.peringkat === 1 ? styles.juara1 : sis.peringkat === 2 ? styles.juara2 : sis.peringkat === 3 ? styles.juara3 : ""}`}>
                <div className={styles.kiriPeringkat}>
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                    {sis.peringkat === 1 ? <FaCrown color="white" size={28} /> : 
                     sis.peringkat === 2 ? <FaMedal color="#64748b" size={24} /> : 
                     sis.peringkat === 3 ? <FaMedal color="#b45309" size={24} /> : 
                     <span className={styles.angkaPeringkat}>{sis.peringkat}</span>}
                  </div>
                  <div className={styles.infoPeringkat}>
                    <p className={styles.namaPeringkat}>{sis.nama || "Siswa Quantum"}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                       <span className={styles.gelarPeringkat} style={{ backgroundColor: '#111827', color: 'white', border: 'none' }}>{sis.kelas || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.kananPeringkat}>
                  <div className={styles.waktuPeringkat} style={{maxWidth: 'min-content', minWidth: '65px'}}>{sis.jam}j {sis.menit}m</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}