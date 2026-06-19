"use client";

import { useState, useEffect } from "react";
import { FaTrophy, FaCrown, FaMedal } from "react-icons/fa6";
import { dapatkanKlasemenBulanIni } from "@/actions/klasemenAction";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/student/home/Home.module.css";

export default function ModalKlasemen({ onClose, kelasSiswa, klasemenDemo }) {
  const [dataKlasemen,   setDataKlasemen]   = useState([]);
  const [loadingKlasemen, setLoadingKlasemen] = useState(true);
  const [filterAktif,    setFilterAktif]    = useState("Semua Kelas");

  useEffect(() => {
    // 🎭 Mode Demo: data sudah disuntik dari parent, jangan panggil server action.
    if (klasemenDemo) {
      setDataKlasemen(klasemenDemo);
      setLoadingKlasemen(false);
      return;
    }

    let isMounted = true;
    setLoadingKlasemen(true);

    dapatkanKlasemenBulanIni(filterAktif).then((hasil) => {
      if (!isMounted) return;
      // ✅ FIX: hasil.sukses → hasil.ok
      if (hasil.ok) setDataKlasemen(hasil.data);
      setLoadingKlasemen(false);
    });

    return () => { isMounted = false; };
  }, [filterAktif, klasemenDemo]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalKonten} onClick={(e) => e.stopPropagation()}>
        <button className={styles.tombolTutupModal} onClick={onClose}>✕</button>

        <h2 className={homeStyles.judulKlasemen}>
          <FaTrophy color="#facc15" /> Top 10 Ambis
        </h2>

        {/* Filter Tabs */}
        <div className={homeStyles.filterTabWrapper}>
          <button
            onClick={() => setFilterAktif("Semua Kelas")}
            className={`${homeStyles.tombolFilter} ${filterAktif === "Semua Kelas" ? homeStyles.tombolFilterAktif : homeStyles.tombolFilterNonaktif}`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setFilterAktif(kelasSiswa || "-")}
            className={`${homeStyles.tombolFilter} ${filterAktif !== "Semua Kelas" ? homeStyles.tombolFilterAktif : homeStyles.tombolFilterNonaktif}`}
          >
            🎓 Kelas Saya
          </button>
        </div>

        {loadingKlasemen ? (
          <div className={homeStyles.wadahKlasemen}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${styles.messageLoading} ${homeStyles.skeletonKlasemen}`} />
            ))}
          </div>
        ) : dataKlasemen.length === 0 ? (
          <div className={homeStyles.emptyKlasemen}>
            <p className={homeStyles.emptyKlasemenIkon}>📭</p>
            <p className={homeStyles.emptySchedule}>Belum ada data konsul untuk kategori ini.</p>
          </div>
        ) : (
          <div className={homeStyles.wadahKlasemen}>
            {dataKlasemen.map((sis) => {
              const peringkatClass =
                sis.peringkat === 1 ? homeStyles.juara1 :
                sis.peringkat === 2 ? homeStyles.juara2 :
                sis.peringkat === 3 ? homeStyles.juara3 : "";

              return (
                <div key={sis.idSiswa} className={`${homeStyles.kartuPeringkat} ${peringkatClass}`}>
                  <div className={homeStyles.kiriPeringkat}>
                    <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
                      {sis.peringkat === 1 ? <FaCrown color="white" size={28} /> :
                       sis.peringkat === 2 ? <FaMedal color="#64748b" size={24} /> :
                       sis.peringkat === 3 ? <FaMedal color="#b45309" size={24} /> :
                       <span className={homeStyles.angkaPeringkat}>{sis.peringkat}</span>}
                    </div>
                    <div className={homeStyles.infoPeringkat}>
                      <p className={homeStyles.namaPeringkat}>{sis.nama || "Siswa Quantum"}</p>
                      <span
                        className={homeStyles.gelarPeringkat}
                        style={{ backgroundColor: "#111827", color: "white", border: "none" }}
                      >
                        {sis.kelas || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className={homeStyles.kananPeringkat}>
                    <div className={homeStyles.waktuPeringkat}>
                      {sis.jam}j {sis.menit}m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}