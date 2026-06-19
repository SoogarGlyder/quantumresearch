"use client";

import { memo } from "react";
import { FaFileSignature } from "react-icons/fa6";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import classStyles from "@/components/student/class/Class.module.css";
import PaginationBar from "@/components/ui/PaginationBar";

const DaftarRiwayatKuis = memo(({ dataHalIni, totalPage, currentPage, onPageChange, onBukaPembahasan }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>Klik untuk melihat hasil & pembahasan</h3>

    {!dataHalIni || dataHalIni.length === 0 ? (
      <p className={styles.emptySchedule}>Belum ada riwayat kuis pada periode ini.</p>
    ) : (
      <>
        <div className={styles.scheduleList}>
          {/* ✅ FIX: Looping langsung ke objek kuis, tanpa destructuring {item: j} */}
          {dataHalIni.map((kuis) => (
            <div
              key={kuis._id}
              className={`${styles.scheduleCard} ${classStyles.kartuKelasKlik}`}
              // ✅ FIX: Lempar jadwalId untuk membuka pembahasan
              onClick={() => onBukaPembahasan(kuis.jadwalId)}
            >
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleDate}>
                  {timeHelper.formatTanggalLengkap(kuis.tanggal)}
                </div>
                {/* Menampilkan Skor */}
                <div className={styles.scheduleTime}>
                  Skor: <strong style={{ color: kuis.skor >= 70 ? '#059669' : '#dc2626' }}>{kuis.skor}</strong>
                </div>
              </div>

              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject}>{kuis.mapel}</p>
              </div>

              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleTeacher}>
                  <FaFileSignature className={classStyles.ikonBiru} size={14} />
                  <span>Bab: <span className={styles.teacherName}>{kuis.bab}</span></span>
                </div>
              </div>

            </div>
          ))}
        </div>

        <div className={classStyles.paginasiWrapper}>
          <PaginationBar
            totalPages={totalPage}
            currentPage={currentPage}
            onPageChange={onPageChange}
            className={classStyles.paginasiInner}
          />
        </div>
      </>
    )}
  </div>
));

DaftarRiwayatKuis.displayName = "DaftarRiwayatKuis";
export default DaftarRiwayatKuis;