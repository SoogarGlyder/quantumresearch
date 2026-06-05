"use client";

import { useState, useEffect } from "react";
import { FaSatelliteDish, FaCircleCheck } from "react-icons/fa6";
import { ambilKuisByJadwal } from "@/actions/quizAction";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/teacher/home/Home.module.css";
import ModalMonitorCBT from "@/components/teacher/home/ModalMonitorCBT";

export default function WidgetRadarCBT({ jadwalHariIni }) {
  const [kuisAktif, setKuisAktif] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [monitorTerpilih, setMonitorTerpilih] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const scanKuisHariIni = async () => {
      setLoading(true);
      try {
        const hasil = await Promise.all(
          jadwalHariIni.map(async (jadwal) => {
            const resKuis = await ambilKuisByJadwal(jadwal._id);
            return resKuis ? { ...jadwal, kuis: resKuis } : null;
          })
        );
        if (isMounted) setKuisAktif(hasil.filter(Boolean));
      } catch (err) {
        console.error("[WidgetRadarCBT] Gagal scan kuis:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (jadwalHariIni?.length > 0) {
      scanKuisHariIni();
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [jadwalHariIni]);

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaSatelliteDish className={homeStyles.ikonMerah} /> Monitoring Pre-Test
      </h3>

      {loading ? (
        <p className={`${homeStyles.emptySchedule} ${homeStyles.emptyScheduleMendatang}`}>
          Memindai jadwal ujian kelas hari ini...
        </p>
      ) : kuisAktif.length === 0 ? (
        <div className={`${homeStyles.emptySchedule} ${homeStyles.statusAman}`}>
          <FaCircleCheck size={28} className={homeStyles.ikonHijau} />
          <div>
            <p className={homeStyles.statusAmanJudul}>AMAN TERKENDALI</p>
            <p className={homeStyles.statusAmanSub}>
              Tidak ada jadwal Pre-Test di kelas Anda hari ini.
            </p>
          </div>
        </div>
      ) : (
        <div className={homeStyles.scheduleList}>
          {kuisAktif.map((jadwal, idx) => (
            <div
              key={idx}
              onClick={() => setMonitorTerpilih(jadwal)}
              className={`${homeStyles.scheduleCard} ${homeStyles.kartuKuisAktif}`}
            >
              <div className={homeStyles.scheduleCardRow}>
                <div className={`${homeStyles.scheduleDate} ${homeStyles.scheduleDateRadar}`}>
                  Monitoring
                </div>
                <div className={homeStyles.scheduleTime}>
                  {jadwal.jamMulai} - {jadwal.jamSelesai}
                </div>
              </div>
              <div className={homeStyles.scheduleCardRow}>
                <p className={`${homeStyles.scheduleSubject} ${homeStyles.scheduleSubjectRadar}`}>
                  {jadwal.mapel}
                </p>
              </div>
              <div className={homeStyles.scheduleCardRow}>
                <div className={`${homeStyles.scheduleCount} ${homeStyles.scheduleCountRadar}`}>
                  {jadwal.kelasTarget}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {monitorTerpilih && (
        <ModalMonitorCBT
          jadwalId={monitorTerpilih._id}
          kelasTarget={monitorTerpilih.kelasTarget}
          onClose={() => setMonitorTerpilih(null)}
        />
      )}
    </div>
  );
}