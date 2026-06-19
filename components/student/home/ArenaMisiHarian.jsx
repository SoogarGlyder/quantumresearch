"use client";

import { memo } from "react";
import { FaListCheck, FaGift, FaCircleCheck } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/student/home/Home.module.css";

const ArenaMisiHarian = memo(({ misiHarian, loadingMisi, onKlaim, pesanKlaim }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>
      <FaListCheck color="#8b5cf6" /> Misi Hari Ini
    </h3>

    {/* Notifikasi klaim — menggantikan alert() */}
    {pesanKlaim && (
      <div className={`${homeStyles.titleBadge} ${pesanKlaim.ok ? "" : homeStyles.nilaiStatMerah}`}
        style={{ marginBottom: 12, fontSize: 13 }}>
        {pesanKlaim.teks}
      </div>
    )}

    {loadingMisi ? (
      <div className={homeStyles.loadingMisi}>Mencari misi baru...</div>
    ) : misiHarian.length === 0 ? (
      <div className={homeStyles.loadingMisi}>Belum ada misi hari ini.</div>
    ) : (
      <div className={homeStyles.missionList}>
        {misiHarian.map((misi, index) => {
          const kartuClass = misi.diklaim
            ? homeStyles.misiDiklaim
            : misi.selesai
            ? homeStyles.misiSelesai
            : homeStyles.misiAktif;

          return (
            <div key={misi.kodeMisi || index} className={`${homeStyles.missionCard} ${kartuClass}`}>
              <div className={homeStyles.missionCardHeader}>
                <span
                  className={`${homeStyles.missionCardTitle} ${misi.diklaim ? homeStyles.judulMisiDiklaim : ""}`}
                >
                  {misi.judul}
                </span>
                <span className={homeStyles.nilaiStatBiru}
                  style={{ fontWeight: "bold", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                  <FaGift /> +{misi.expBonus} EXP
                </span>
              </div>

              <div className={homeStyles.misiFooter}>
                <span className={homeStyles.missionCardProgress}>
                  {misi.progress}/{misi.target}
                </span>

                {misi.diklaim ? (
                  <span className={homeStyles.badgeDiklaim}>
                    <FaCircleCheck /> Diklaim
                  </span>
                ) : misi.selesai ? (
                  <button onClick={() => onKlaim(misi._id)} className={homeStyles.tombolKlaim}>
                    Klaim Hadiah
                  </button>
                ) : (
                  <span className={homeStyles.tagBerjalan}>Sedang Berjalan</span>
                )}
              </div>

              {!misi.diklaim && (
                <div className={homeStyles.progressBarMisi}>
                  <div
                    className={`${homeStyles.progressBarFill} ${misi.selesai ? homeStyles.fillSelesai : homeStyles.fillAktif}`}
                    style={{ width: `${(misi.progress / misi.target) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
));

ArenaMisiHarian.displayName = "ArenaMisiHarian";
export default ArenaMisiHarian;