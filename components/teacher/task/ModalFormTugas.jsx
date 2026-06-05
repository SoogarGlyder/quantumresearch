"use client";

import { memo } from "react";
import { FaXmark, FaFloppyDisk } from "react-icons/fa6";
import { OPSI_KELAS } from "@/utils/constants";
import styles from "@/components/App.module.css";
import taskStyles from "@/components/teacher/task/Task.module.css";

const ModalFormTugas = memo(({
  form, setForm, idEdit, dataSiswa,
  onSimpan, onBatal, loadingForm, pesanForm,
}) => (
  <div className={styles.wrapperGallery}>
    <div className={styles.containerGallery}>

      <div className={styles.headerGallery}>
        <div className={styles.wrapperTitle}>
          <h3 className={styles.galleryTitle}>{idEdit ? "EDIT TUGAS" : "TUGAS BARU"}</h3>
          <span className={styles.galleryDate}>Manajemen Pusat Soal</span>
        </div>
        <button className={styles.galleryButton} onClick={onBatal} disabled={loadingForm} aria-label="Tutup form">
          <FaXmark size={20} />
        </button>
      </div>

      <div className={`${styles.areaGallery} ${taskStyles.formBody}`}>
        <form onSubmit={onSimpan} className={taskStyles.formStack}>

          <div>
            <label className={taskStyles.labelForm}>JUDUL MATERI</label>
            <input
              type="text" required value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              placeholder="Cth: Latihan Logaritma Dasar"
              className={`${styles.fill} ${taskStyles.inputIosFix}`}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </div>

          <div>
            <label className={taskStyles.labelForm}>LINK (GOOGLE DRIVE / WEB)</label>
            <input
              type="url" required value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className={`${styles.fill} ${taskStyles.inputIosFix}`}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </div>

          <div>
            <label className={taskStyles.labelForm}>TARGET DISTRIBUSI</label>
            <div className={taskStyles.grupTarget}>
              <select
                value={form.tipeTarget}
                onChange={(e) => setForm({ ...form, tipeTarget: e.target.value, target: "" })}
                className={`${styles.fill} ${taskStyles.selectTipe}`}
              >
                <option value="KELAS">SEKELAS</option>
                <option value="SISWA">PER SISWA</option>
              </select>

              {form.tipeTarget === "KELAS" ? (
                <select
                  required value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className={`${styles.fill} ${taskStyles.selectTarget}`}
                >
                  <option value="" disabled>-- PILIH --</option>
                  {OPSI_KELAS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              ) : (
                <select
                  required value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className={`${styles.fill} ${taskStyles.selectTarget}`}
                >
                  <option value="" disabled>-- PILIH --</option>
                  {dataSiswa.map((s) => <option key={s._id} value={s.username}>{s.nama}</option>)}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className={taskStyles.labelForm}>STATUS MATERI</label>
            <select
              value={form.isAktif ? "aktif" : "mati"}
              onChange={(e) => setForm({ ...form, isAktif: e.target.value === "aktif" })}
              className={`${styles.fill} ${form.isAktif ? taskStyles.selectAktif : taskStyles.selectNonaktif}`}
            >
              <option value="aktif">🟢 AKTIF (TAMPIL DI SISWA)</option>
              <option value="mati">🔴 NON-AKTIF (SEMBUNYIKAN)</option>
            </select>
          </div>

          {pesanForm && (
            <div className={`${styles.messageLoading} ${pesanForm.ok ? "" : taskStyles.cbtBtnDanger}`}
              style={{ padding: 12, borderRadius: 10, fontWeight: 900, textAlign: "center", color: pesanForm.ok ? "#111827" : "white" }}>
              {pesanForm.teks}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingForm}
            className={`${styles.tombolSimpanBiruBaru} ${taskStyles.tombolSimpanForm}`}
          >
            <FaFloppyDisk size={18} /> {loadingForm ? "MENYIMPAN..." : "SIMPAN MATERI"}
          </button>
        </form>
      </div>
    </div>
  </div>
));

ModalFormTugas.displayName = "ModalFormTugas";
export default ModalFormTugas;