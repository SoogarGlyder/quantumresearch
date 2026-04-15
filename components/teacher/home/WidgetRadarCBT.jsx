"use client";

import { useState, useEffect } from "react";
import { FaSatelliteDish, FaCircleCheck, FaChevronRight, FaClock } from "react-icons/fa6";
import { ambilKuisByJadwal } from "@/actions/quizAction"; 

// 🚀 IMPORT STYLES DAN MODAL
import styles from "@/components/App.module.css";
import ModalMonitorCBT from "@/components/teacher/journal/ModalMonitorCBT";

export default function WidgetRadarCBT({ jadwalHariIni }) {
  const [kuisAktif, setKuisAktif] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk membuka modal radar
  const [monitorJadwalTerpilih, setMonitorJadwalTerpilih] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const scanKuisHariIni = async () => {
      setLoading(true);
      const jadwalDenganKuis = [];
      
      for (const jadwal of jadwalHariIni) {
        try {
          const resKuis = await ambilKuisByJadwal(jadwal._id);
          if (resKuis) {
            jadwalDenganKuis.push({ ...jadwal, kuis: resKuis });
          }
        } catch (err) {
          console.error("Gagal scan kuis:", err);
        }
      }
      
      if (isMounted) {
        setKuisAktif(jadwalDenganKuis);
        setLoading(false);
      }
    };

    if (jadwalHariIni && jadwalHariIni.length > 0) {
      scanKuisHariIni();
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [jadwalHariIni]);

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaSatelliteDish color="#ef4444" /> Moniroting Pre-Test
      </h3>

      {loading ? (
        // ⏳ STATE LOADING
        <p className={styles.emptySchedule} style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', color: '#64748b' }}>
          📡 Memindai gelombang ujian kelas hari ini...
        </p>
      ) : kuisAktif.length === 0 ? (
        // ⚪ STATE KOSONG (TIDAK ADA UJIAN)
        <div className={styles.emptySchedule} style={{ backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '16px' }}>
          <FaCircleCheck size={28} color="#22c55e" />
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: '900', color: '#166534', fontSize: '15px' }}>AMAN TERKENDALI</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#15803d', fontSize: '12px' }}>Tidak ada jadwal Pre-Test di kelas Anda hari ini.</p>
          </div>
        </div>
      ) : (
        // 🔴 STATE AKTIF (ADA UJIAN)
        <div className={styles.scheduleList}>
          {kuisAktif.map((jadwal, idx) => (
            <div 
              key={idx} 
              className={styles.scheduleCard}
              onClick={() => setMonitorJadwalTerpilih(jadwal)} // 🚀 Pindah ke sini
              style={{ 
                backgroundColor: '#1e293b', 
                border: '3px solid #ef4444', 
                boxShadow: '4px 4px 0 #7f1d1d',
                cursor: 'pointer' // 🚀 Ubah menjadi pointer
              }}
            >
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleDate} style={{ backgroundColor: '#ffffff', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Monitoring
                </div>
                <div className={styles.scheduleTime}>
                  {jadwal.jamMulai} - {jadwal.jamSelesai}
                </div>
              </div>

              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject} style={{ color: 'white', fontSize: '18px' }}>
                  {jadwal.mapel}
                </p>
              </div>

              <div className={styles.scheduleCardRow}>
                {/* 🚀 Ubah tag <button> menjadi <div> agar tidak bentrok interaksinya */}
                <div className={styles.scheduleCount} style={{ backgroundColor: '#facc15', color: '#111827', border: 'none', fontWeight: '900' }}>
                  {jadwal.kelasTarget}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 RENDER MODAL MONITORING JIKA DIKLIK */}
      {monitorJadwalTerpilih && (
        <ModalMonitorCBT 
          jadwalId={monitorJadwalTerpilih._id} 
          kelasTarget={monitorJadwalTerpilih.kelasTarget}
          onClose={() => setMonitorJadwalTerpilih(null)} 
        />
      )}

      {/* Animasi Radar Denyut */}
      <style>{`
        @keyframes pulseRadar {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}