"use client";

import { memo } from "react";
import { FaBrain, FaPlus, FaUserTie, FaPenToSquare, FaTrashCan } from "react-icons/fa6";
import PaginationBar from "@/components/ui/PaginationBar";
import styles from "@/components/App.module.css";
import taskStyles from "@/components/teacher/task/Task.module.css";

const DaftarKuis = memo(({
  dataHalIni, totalPage, currentPage, onPageChange,
  loading, onBuatBaru, onEdit, onHapus,
}) => (
  <div className={taskStyles.wrapperDaftarKuis}>
    <button onClick={onBuatBaru} className={taskStyles.tombolBuatKuis}>
      <FaPlus size={18} /> RAKIT SOAL CBT BARU
    </button>

    <h3 className={styles.contentTitle}>
      <FaBrain className={taskStyles.ikonHijau} /> Daftar Bank Soal Buatanku
    </h3>

    {loading ? (
      <div className={taskStyles.loadingKuis}>MEMUAT BANK SOAL...</div>
    ) : !dataHalIni?.length ? (
      <div className={taskStyles.emptyKuis}>
        Belum ada master soal CBT. Silakan buat baru.
      </div>
    ) : (
      <>
        <div className={taskStyles.gridBankSoal}>
          {dataHalIni.map((bank) => (
            <div key={bank._id} className={taskStyles.kartuBankSoal}>
              <div>
                <h4 className={taskStyles.judulBankSoal}>
                  {bank.judul || "Tanpa Judul"}
                </h4>
                <p className={taskStyles.pembuatBankSoal}>
                  <FaUserTie /> Oleh: {bank.pembuatId?.nama || "Admin Sistem"}
                </p>
                <div className={taskStyles.chipGroup}>
                  <span className={taskStyles.chipSoal}>
                    📝 {bank.soal?.length || 0} SOAL
                  </span>
                  <span className={taskStyles.chipDurasi}>
                    ⏱ {bank.durasiMenit || 10} MENIT
                  </span>
                </div>
              </div>

              <div className={taskStyles.grupTombolBank}>
                <button onClick={() => onEdit(bank)} className={taskStyles.tombolEditBank}>
                  <FaPenToSquare /> EDIT
                </button>
                <button onClick={() => onHapus(bank._id, bank.judul)} className={taskStyles.tombolHapusBank} aria-label={`Hapus ${bank.judul}`}>
                  <FaTrashCan />
                </button>
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

DaftarKuis.displayName = "DaftarKuis";
export default DaftarKuis;