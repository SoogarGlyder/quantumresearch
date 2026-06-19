"use client";

import { memo } from "react";
import Image from "next/image";
import { FaStar, FaTrophy } from "react-icons/fa6";
import { GAMIFIKASI } from "@/utils/constants";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/student/home/Home.module.css";

const HeaderSiswa = memo(({ siswa, statsBulanIni, streakKonsul, onBukaKlasemen }) => {
  const expSaatIni       = siswa.totalExp || 0;
  const expPerLevel      = 500;
  const levelSiswa       = Math.floor(expSaatIni / expPerLevel) + 1;
  const expSisaUntukNaik = expSaatIni % expPerLevel;
  const persenLevel      = Math.round((expSisaUntukNaik / expPerLevel) * 100);
  const lencanaSiswa     = siswa.koleksiLencana || [];

  return (
    <div className={`${styles.appHeader} header-aman-poni`}>
      <div className={styles.shapeRed} />
      <div className={styles.shapeYellow} />

      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <Image
            src="/logo-qr-panjang.png"
            alt="Logo Quantum Research"
            width={1000}
            height={40}
            style={{ width: "100%", height: "auto" }}
            priority
          />
        </div>
      </div>

      <div className={styles.identityContainer}>
        <div style={{ width: "100%" }}>
          <p className={styles.welcomeText}>Selamat datang!</p>
          <h1 className={styles.userName}>{siswa.nama}</h1>

          {/* XP Progress Bar */}
          <div className={homeStyles.xpBarWrapper}>
            <div className={homeStyles.xpBarHeader}>
              <span className={homeStyles.xpLevelBadge}>
                <FaStar color="#facc15" /> Level {levelSiswa}
              </span>
              <span>{expSisaUntukNaik} / {expPerLevel} EXP</span>
            </div>
            <div className={homeStyles.xpBarTrack}>
              {/* Dynamic width — data-driven, bukan styling preferensi */}
              <div className={homeStyles.xpBarFill} style={{ width: `${persenLevel}%` }} />
            </div>
          </div>

          {/* Badge Lencana */}
          {lencanaSiswa.length > 0 && (
            <div className={homeStyles.areaLencana}>
              {lencanaSiswa.map((lencana, index) => {
                const info = GAMIFIKASI.KAMUS_LENCANA?.[lencana.idLencana];
                if (!info) return null;
                return (
                  <div
                    key={index}
                    className={homeStyles.badgeLencana}
                    style={{ backgroundColor: info.warna }}
                    title={`Didapat: ${timeHelper.formatTanggalLengkap(lencana.tanggalDidapat)}`}
                  >
                    {info.ikon} {info.nama}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`${styles.containerIdNumber} ${homeStyles.containerIdNumber}`}>
          <span className={styles.IdNumber}>
            {siswa.username} | {siswa.nomorPeserta}
          </span>
        </div>
      </div>

      <div className={styles.infoContainer}>
        <h2 className={styles.infoHeader}>Pencapaian Bulan Ini</h2>
        <div className={homeStyles.titleBadge}>{statsBulanIni.gelar}</div>

        <div className={homeStyles.statGridContainer}>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>⏱️ Belajar</span>
            <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatBiru}`}>
              {statsBulanIni.jamKonsul}j {statsBulanIni.menitSisa}m
            </span>
          </div>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>✅ Kehadiran</span>
            <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatHijau}`}>
              {statsBulanIni.persenHadir}%{" "}
              <span style={{ fontSize: 11, color: "#64748b" }}>
                ({statsBulanIni.kelasHadir}/{statsBulanIni.jadwalWajibBulanIni})
              </span>
            </span>
          </div>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>📚 Terambis</span>
            <span className={homeStyles.statValue} style={{ fontSize: 14 }}>
              {statsBulanIni.mapelTerambis}
            </span>
          </div>
          <div className={homeStyles.statContainer}>
            {siswa.kelas?.includes("12") || siswa.kelas?.toLowerCase().includes("alumni") ? (
              <>
                <span className={homeStyles.statLabel}>⏳ UTBK 2026</span>
                <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatMerah}`}>
                  H-{statsBulanIni.selisihHariUTBK}
                </span>
              </>
            ) : (
              <>
                <span className={homeStyles.statLabel}>🔥 Streak Konsul</span>
                <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatMerah}`}>
                  {streakKonsul} Hari
                </span>
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