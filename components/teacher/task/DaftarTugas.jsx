"use client";

import { memo } from "react";
import { FaBookOpen, FaBullseye, FaPenToSquare, FaTrash, FaLink, FaPlus } from "react-icons/fa6";
import PaginationBar from "@/components/ui/PaginationBar";
import styles from "@/components/App.module.css";
import taskStyles from "@/components/teacher/task/Task.module.css";

const formatNamaTarget = (targetData) => {
  if (!targetData) return "-";
  if (Array.isArray(targetData)) {
    return targetData.map((t) => String(t).split(" ").slice(0, 2).join(" ")).join(", ");
  }
  return String(targetData).split(" ").slice(0, 2).join(" ");
};

const DaftarTugas = memo(({
  dataHalIni, totalPage, currentPage, onPageChange,
  loading, onEdit, onHapus, onBukaForm,
}) => (
  <div className={styles.contentContainer}>
    <div className={taskStyles.wrapperTombolBuat}>
      <button onClick={onBukaForm} className={`${styles.tombolSimpanBiruBaru} ${taskStyles.tombolBuatTugas}`}>
        <FaPlus size={18} /> BUAT TUGAS BARU
      </button>
    </div>

    <h3 className={styles.contentTitle}>
      <FaBookOpen className={taskStyles.ikonBiru} /> Daftar Materi Buatanku
    </h3>

    {loading ? (
      <div className={`${styles.messageLoading} ${taskStyles.loadingBlock}`}>MEMUAT DATA...</div>
    ) : !dataHalIni?.length ? (
      <p className={styles.emptySchedule}>BELUM ADA MATERI YANG DIBUAT.</p>
    ) : (
      <>
        <div className={styles.scheduleList}>
          {dataHalIni.map((item) => (
            <div
              key={item._id}
              className={`${styles.scheduleCard} ${item.isAktif ? taskStyles.kartuTugasAktif : taskStyles.kartuTugasNonaktif}`}
            >
              <div className={styles.scheduleCardRow}>
                <div className={`${styles.scheduleDate} ${taskStyles.scheduleDateBiru}`}>
                  <FaBullseye style={{ marginRight: 6 }} /> {item.tipeTarget}
                </div>
                <div className={taskStyles.wrapperTombolAksi}>
                  <button onClick={() => onEdit(item)} className={taskStyles.tombolAksiEdit} aria-label={`Edit ${item.judul}`}>
                    <FaPenToSquare size={20} />
                  </button>
                  <button onClick={() => onHapus(item._id, item.judul)} className={taskStyles.tombolAksiHapus} aria-label={`Hapus ${item.judul}`}>
                    <FaTrash size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject}>{item.judul}</p>
              </div>

              <div className={styles.scheduleCardRow}>
                <div className={`${styles.scheduleInfoBox} ${taskStyles.tagTarget}`}>
                  <span className={`${styles.scheduleInfo} ${taskStyles.tagTargetTeks}`}>
                    {formatNamaTarget(item.target)}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.scheduleCount} ${taskStyles.linkCekTugas}`}
                >
                  CEK LINK <FaLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className={taskStyles.paginasiWrapper}>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPage}
            onPageChange={onPageChange}
            className={taskStyles.paginasiInner}
          />
        </div>
      </>
    )}
  </div>
));

DaftarTugas.displayName = "DaftarTugas";
export default DaftarTugas;