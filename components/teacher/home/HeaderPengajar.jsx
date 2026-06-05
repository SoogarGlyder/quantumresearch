"use client";

import { memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaBuildingShield } from "react-icons/fa6";
import { PANGKAT_PENGAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/teacher/home/Home.module.css";

const HeaderPengajar = memo(({ dataUser, statsPengajar }) => {
  const router = useRouter();

  const isBisaMasukAdmin =
    dataUser?.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK ||
    dataUser?.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH;

  const totalMenit    = Math.round(statsPengajar?.totalMenitKonsul || 0);
  const jamKonsul     = Math.floor(totalMenit / 60);
  const menitKonsul   = totalMenit % 60;
  const totalSesiKonsul = statsPengajar?.totalSesiKonsul || 0;

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
        <p className={styles.welcomeText}>Selamat mengajar!</p>
        <h1 className={styles.userName}>{dataUser?.nama || "Pengajar Quantum"}</h1>
        <div className={styles.containerIdNumber}>
          <span className={styles.IdNumber}>
            {dataUser?.kodePengajar} | {dataUser?.nomorPeserta}
            {dataUser?.pangkat && dataUser.pangkat !== PANGKAT_PENGAJAR.FREELANCE && (
              <span> | {dataUser.pangkat.replace("_", " ")}</span>
            )}
          </span>
        </div>
      </div>

      <div className={styles.infoContainer}>
        <h2 className={styles.infoHeader}>Ringkasan Mengajar Bulan Ini</h2>
        <div className={`${homeStyles.statGridContainer} ${homeStyles.statGrid3Col}`}>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>Total Sesi</span>
            <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatBiru}`}>
              {statsPengajar?.totalKelas || 0}
            </span>
          </div>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>Jurnal OK</span>
            <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatHijau}`}>
              {statsPengajar?.jurnalSelesai || 0}
            </span>
          </div>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>Presensi</span>
            <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatMerah}`}>
              {statsPengajar?.totalAbsensi || 0}
            </span>
          </div>
        </div>
        <div className={`${homeStyles.statGridContainer} ${homeStyles.statGrid2Col}`}>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>Durasi Konsul</span>
            <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatBiru}`}>
              {jamKonsul > 0 ? `${jamKonsul}j ` : ""}{menitKonsul}m
            </span>
          </div>
          <div className={homeStyles.statContainer}>
            <span className={homeStyles.statLabel}>Sesi Konsul</span>
            <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatHijau}`}>
              {totalSesiKonsul}
            </span>
          </div>
        </div>
      </div>

      {isBisaMasukAdmin && (
        <div>
          <button
            onClick={() => router.push("/admin")}
            className={homeStyles.tombolAdmin}
          >
            <FaBuildingShield size={18} /> Masuk Ruang Admin
          </button>
        </div>
      )}
    </div>
  );
});

HeaderPengajar.displayName = "HeaderPengajar";
export default HeaderPengajar;