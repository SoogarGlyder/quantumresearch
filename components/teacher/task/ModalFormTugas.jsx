"use client";

import { memo } from "react";
import { FaXmark, FaFloppyDisk } from "react-icons/fa6";

// 🚀 FIX PATH
import { OPSI_KELAS } from "@/utils/constants";
import styles from "@/components/App.module.css";

const ModalFormTugas = memo(({ form, setForm, idEdit, dataSiswa, onSimpan, onBatal, loadingForm }) => (
  <div className={styles.wrapperGallery} style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    zIndex: 99999, backgroundColor: 'rgba(17, 24, 39, 0.8)',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  }}>
    <div className={styles.containerGallery} style={{ width: '90%', maxWidth: '448px', padding: 0, overflow: 'hidden' }}>
      
      <div className={styles.headerGallery}>
        <div className={styles.wrapperTitle}>
          <h3 className={styles.galleryTitle}>{idEdit ? "EDIT TUGAS" : "TUGAS BARU"}</h3>
          <span className={styles.galleryDate}>Manajemen Pusat Soal</span>
        </div>
        <button className={styles.galleryButton} onClick={onBatal} disabled={loadingForm}>
          <FaXmark size={20} />
        </button>
      </div>

      <div className={styles.areaGallery} style={{ padding: '24px', backgroundColor: '#f8fafc' }}>
        <form onSubmit={onSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: '900', color: '#4b5563', marginBottom: '4px', display: 'block' }}>JUDUL MATERI</label>
            <input 
              type="text" required value={form.judul} 
              onChange={e => setForm({...form, judul: e.target.value})} 
              placeholder="Cth: Latihan Logaritma Dasar" 
              className={styles.scheduleOption} 
              style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: '900', color: '#4b5563', marginBottom: '4px', display: 'block' }}>LINK (GOOGLE DRIVE/WEB)</label>
            <input 
              type="url" required value={form.url} 
              onChange={e => setForm({...form, url: e.target.value})} 
              placeholder="https://..." 
              className={styles.scheduleOption} 
              style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: '900', color: '#4b5563', marginBottom: '4px', display: 'block' }}>TARGET DISTRIBUSI</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={form.tipeTarget} 
                onChange={e => setForm({...form, tipeTarget: e.target.value, target: ""})} 
                className={styles.scheduleOption} 
                style={{ flex: 1, backgroundColor: '#fef08a' }}
              >
                <option value="KELAS">SEKELAS</option>
                <option value="SISWA">PER SISWA</option>
              </select>
              
              {form.tipeTarget === "KELAS" ? (
                <select 
                  required value={form.target} 
                  onChange={e => setForm({...form, target: e.target.value})} 
                  className={styles.scheduleOption} 
                  style={{ flex: 1 }}
                >
                  <option value="" disabled>-- PILIH --</option>
                  {OPSI_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              ) : (
                <select 
                  required value={form.target} 
                  onChange={e => setForm({...form, target: e.target.value})} 
                  className={styles.scheduleOption} 
                  style={{ flex: 1 }}
                >
                  <option value="" disabled>-- PILIH --</option>
                  {dataSiswa.map(s => <option key={s._id} value={s.username}>{s.nama}</option>)}
                </select>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '900', color: '#4b5563', marginBottom: '4px', display: 'block' }}>STATUS MATERI</label>
            <select 
              value={form.isAktif ? "aktif" : "mati"} 
              onChange={e => setForm({...form, isAktif: e.target.value === "aktif"})} 
              className={styles.scheduleOption} 
              style={{ background: form.isAktif ? '#dcfce3' : '#fca5a5' }}
            >
              <option value="aktif">🟢 AKTIF (TAMPIL DI SISWA)</option>
              <option value="mati">🔴 NON-AKTIF (SEMBUNYIKAN)</option>
            </select>
          </div>

          <button type="submit" disabled={loadingForm} className={styles.tombolSimpanBiruBaru} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
            <FaFloppyDisk size={18} /> {loadingForm ? "MENYIMPAN..." : "SIMPAN MATERI"}
          </button>
        </form>
      </div>
    </div>
  </div>
));

ModalFormTugas.displayName = "ModalFormTugas";
export default ModalFormTugas;