"use client";

import { useState, useEffect, useMemo, memo } from "react";
import Image from "next/image";
import { 
  ambilSemuaLatihanSoal, 
  prosesSimpanLatihanSoal, 
  prosesHapusLatihanSoal,
  ambilDaftarSiswaDropdown 
} from "../../actions/soalAction";
import { OPSI_KELAS } from "../../utils/constants";
import styles from "../App.module.css";
import { 
  FaBookOpen, FaLink, FaTrash, FaPenToSquare, 
  FaPlus, FaUserTie, FaXmark, FaFloppyDisk, FaBullseye 
} from "react-icons/fa6";

// ============================================================================
// 1. SUB-KOMPONEN: HEADER TUGAS (Neo-Brutalism Style)
// ============================================================================
const HeaderTugas = memo(({ totalTugas }) => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <div className={styles.identityContainer}>
      <p className={styles.welcomeText}>Manajemen Pusat Soal</p>
      <h1 className={styles.userName}>Bank Tugas</h1>
      <div className={styles.containerIdNumber}>
         <span className={styles.IdNumber}>Anda memiliki {totalTugas} materi yang dibagikan</span>
      </div>
    </div>
  </div>
));
HeaderTugas.displayName = "HeaderTugas";

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================
export default function TabTugasPengajar() {
  const [dataSoal, setDataSoal] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  
  const initialForm = {
    judul: "", url: "", tipeTarget: "KELAS", target: OPSI_KELAS[0] || "", isAktif: true
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    muatData();
    ambilDaftarSiswaDropdown().then(res => {
      if(res.sukses) setDataSiswa(res.data);
    });
  }, []);

  const muatData = async () => {
    setLoading(true);
    const res = await ambilSemuaLatihanSoal();
    if (res.sukses) setDataSoal(res.data);
    setLoading(false);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    
    let finalTarget = form.target;
    if (form.tipeTarget === "SISWA" && !finalTarget) {
      alert("Pilih siswa terlebih dahulu!");
      setLoadingForm(false); return;
    }

    let finalUrl = form.url;
    if (finalUrl.includes("drive.google.com") && finalUrl.includes("/view")) {
      finalUrl = finalUrl.split("/view")[0] + "/preview";
    }

    const res = await prosesSimpanLatihanSoal(idEdit, { ...form, target: finalTarget, url: finalUrl });
    if (res.sukses) {
      batalEdit();
      muatData();
    } else alert(res.pesan);
    setLoadingForm(false);
  };

  const klikEdit = (item) => {
    setIdEdit(item._id);
    setForm({ judul: item.judul, url: item.url, tipeTarget: item.tipeTarget, target: item.target, isAktif: item.isAktif });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const batalEdit = () => {
    setIdEdit(null); setForm(initialForm); setIsFormOpen(false);
  };

  const klikHapus = async (id, judul) => {
    if (window.confirm(`Yakin hapus soal: "${judul}"?`)) {
      const res = await prosesHapusLatihanSoal(id);
      if (res.sukses) muatData();
    }
  };

  return (
    <div className={styles.contentArea}>
      <HeaderTugas totalTugas={dataSoal.length} />

      {/* 🚀 TOMBOL BUAT BARU - NEO BRUTALISM */}
      {!isFormOpen && (
        <div style={{ padding: '0 16px', marginTop: '24px' }}>
          <button 
            onClick={() => setIsFormOpen(true)} 
            className={styles.tombolSimpanBiruBaru}
            style={{ width: '100%', boxShadow: '8px 8px 0 #111827' }}
          >
            <FaPlus /> BUAT TUGAS BARU
          </button>
        </div>
      )}

      {/* 🚀 FORM INPUT - MENIRU STYLE MODAL JURNAL */}
      {isFormOpen && (
        <div className={styles.contentContainer} style={{ border: '4px solid #111827', boxShadow: '8px 8px 0 #2563eb', marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className={styles.contentTitle} style={{ margin: 0 }}>
              {idEdit ? "✏️ EDIT TUGAS" : "➕ TUGAS BARU"}
            </h3>
            <button onClick={batalEdit} style={{ background: '#ef4444', color: 'white', border: '2px solid #111827', borderRadius: '8px', padding: '4px' }}>
              <FaXmark size={18} />
            </button>
          </div>

          <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" required value={form.judul} 
              onChange={e => setForm({...form, judul: e.target.value})} 
              placeholder="Judul Materi (Cth: Latihan Logaritma)" 
              className={styles.scheduleOption} 
              style={{ border: '3px solid #111827' }}
            />
            
            <input 
              type="url" required value={form.url} 
              onChange={e => setForm({...form, url: e.target.value})} 
              placeholder="Link Google Drive / Web" 
              className={styles.scheduleOption} 
              style={{ border: '3px solid #111827' }}
            />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={form.tipeTarget} 
                onChange={e => setForm({...form, tipeTarget: e.target.value, target: ""})} 
                className={styles.scheduleOption} 
                style={{ flex: 1, border: '3px solid #111827', backgroundColor: '#fef08a' }}
              >
                <option value="KELAS">SEKELAS</option>
                <option value="SISWA">PER SISWA</option>
              </select>
              
              {form.tipeTarget === "KELAS" ? (
                <select 
                  required value={form.target} 
                  onChange={e => setForm({...form, target: e.target.value})} 
                  className={styles.scheduleOption} 
                  style={{ flex: 1, border: '3px solid #111827' }}
                >
                  <option value="" disabled>-- PILIH --</option>
                  {OPSI_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              ) : (
                <select 
                  required value={form.target} 
                  onChange={e => setForm({...form, target: e.target.value})} 
                  className={styles.scheduleOption} 
                  style={{ flex: 1, border: '3px solid #111827' }}
                >
                  <option value="" disabled>-- PILIH --</option>
                  {dataSiswa.map(s => <option key={s._id} value={s.username}>{s.nama}</option>)}
                </select>
              )}
            </div>

            <select 
              value={form.isAktif ? "aktif" : "mati"} 
              onChange={e => setForm({...form, isAktif: e.target.value === "aktif"})} 
              className={styles.scheduleOption} 
              style={{ border: '3px solid #111827', background: form.isAktif ? '#dcfce3' : '#fca5a5' }}
            >
              <option value="aktif">🟢 AKTIF (MUNCUL DI HP SISWA)</option>
              <option value="mati">🔴 NON-AKTIF (SEMBUNYIKAN)</option>
            </select>

            <button type="submit" disabled={loadingForm} className={styles.tombolSimpanBiruBaru} style={{ padding: '16px' }}>
              <FaFloppyDisk /> {loadingForm ? "MENYIMPAN..." : "SIMPAN MATERI"}
            </button>
          </form>
        </div>
      )}

      {/* 🚀 DAFTAR TUGAS - MENIRU STYLE SCHEDULE CARD */}
      <div className={styles.contentContainer} style={{ marginTop: '24px' }}>
        <h3 className={styles.contentTitle}><FaBookOpen color="#2563eb" /> Daftar Materi Buatanku</h3>
        
        {loading ? (
          <div className={styles.messageLoading} style={{ borderRadius: '12px' }}>MEMUAT DATA...</div>
        ) : dataSoal.length === 0 ? (
          <p className={styles.emptySchedule}>BELUM ADA MATERI YANG DIBUAT.</p>
        ) : (
          <div className={styles.scheduleList}>
            {dataSoal.map(item => (
              <div 
                key={item._id} 
                className={styles.scheduleCard} 
                style={{ 
                  backgroundColor: item.isAktif ? '#ffffff' : '#f3f4f6', 
                  border: '3px solid #111827',
                  opacity: item.isAktif ? 1 : 0.7
                }}
              >
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleDate} style={{ color: '#2563eb' }}>
                    <FaBullseye /> {item.tipeTarget}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => klikEdit(item)} style={{ color: '#2563eb', background: 'none', border: 'none' }}><FaPenToSquare size={20}/></button>
                    <button onClick={() => klikHapus(item._id, item.judul)} style={{ color: '#ef4444', background: 'none', border: 'none' }}><FaTrash size={20}/></button>
                  </div>
                </div>

                <div className={styles.scheduleCardRow}>
                  <p className={styles.scheduleSubject} style={{ fontSize: '18px' }}>{item.judul}</p>
                </div>

                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleInfoBox} style={{ background: '#111827', border: '2px solid #111827' }}>
                    <span className={styles.scheduleInfo} style={{ color: 'white' }}>{item.target}</span>
                  </div>
                  <a 
                    href={item.url} target="_blank" rel="noreferrer" 
                    className={styles.scheduleCount} 
                    style={{ background: '#fef08a', color: '#111827', border: '2px solid #111827', textDecoration: 'none', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FaLink size={12}/> CEK LINK
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}