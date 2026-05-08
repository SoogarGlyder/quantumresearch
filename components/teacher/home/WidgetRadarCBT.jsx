"use client";

import { useState, useEffect } from "react";
import { FaSatelliteDish, FaCircleCheck, FaChevronRight, FaClock } from "react-icons/fa6";
import { ambilKuisByJadwal } from "@/actions/quizAction"; 

// IMPORT STYLES DAN MODAL
import styles from "@/components/App.module.css";
import ModalMonitorCBT from "@/components/teacher/journal/ModalMonitorCBT";

export default function WidgetRadarCBT({ jadwalHariIni }) {
  const [kuisAktif, setKuisAktif] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [monitorJadwalTerpilih, setMonitorJadwalTerpilih] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const scanKuisHariIni = async () => {
      setLoading(true);
      
      try {
        //FIX: OPTIMASI PARALEL (Mencegah antrean loading yang lama)
        const janjiPengecekan = jadwalHariIni.map(async (jadwal) => {
          const resKuis = await ambilKuisByJadwal(jadwal._id);
          if (resKuis) {
            return { ...jadwal, kuis: resKuis };
          }
          return null;
        });

        const hasilPengecekan = await Promise.all(janjiPengecekan);
        const jadwalDenganKuis = hasilPengecekan.filter(item => item !== null);

        if (isMounted) {
          setKuisAktif(jadwalDenganKuis);
        }
      } catch (err) {
        console.error("Gagal scan kuis secara paralel:", err);
      } finally {
        if (isMounted) setLoading(false);
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
        <p className={styles.emptySchedule} style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', color: '#64748b' }}>
          📡 Memindai gelombang ujian kelas hari ini...
        </p>
      ) : kuisAktif.length === 0 ? (
        <div className={styles.emptySchedule} style={{ backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '16px' }}>
          <FaCircleCheck size={28} color="#22c55e" />
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: '900', color: '#166534', fontSize: '15px' }}>AMAN TERKENDALI</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#15803d', fontSize: '12px' }}>Tidak ada jadwal Pre-Test di kelas Anda hari ini.</p>
          </div>
        </div>
      ) : (
        <div className={styles.scheduleList}>
          {kuisAktif.map((jadwal, idx) => (
            <div 
              key={idx} 
              className={styles.scheduleCard}
              onClick={() => setMonitorJadwalTerpilih(jadwal)} 
              style={{ 
                backgroundColor: '#1e293b', 
                border: '3px solid #ef4444', 
                boxShadow: '4px 4px 0 #7f1d1d',
                cursor: 'pointer' 
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
                <div className={styles.scheduleCount} style={{ backgroundColor: '#facc15', color: '#111827', border: 'none', fontWeight: '900' }}>
                  {jadwal.kelasTarget}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {monitorJadwalTerpilih && (
        <ModalMonitorCBT 
          jadwalId={monitorJadwalTerpilih._id} 
          kelasTarget={monitorJadwalTerpilih.kelasTarget}
          onClose={() => setMonitorJadwalTerpilih(null)} 
        />
      )}

      <style>{`
        @keyframes pulseRadar {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}