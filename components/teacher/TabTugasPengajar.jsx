"use client";

import { useState, useEffect, memo } from "react";
import Image from "next/image";
import { 
  ambilSemuaLatihanSoal, 
  prosesSimpanLatihanSoal, 
  prosesHapusLatihanSoal,
  ambilDaftarSiswaDropdown 
} from "../../actions/soalAction";
import { OPSI_KELAS } from "../../utils/constants";
import styles from "../App.module.css";
import { FaPlus } from "react-icons/fa6";

// 🚀 IMPORT MODUL-MODUL KITA
import ModalFormTugas from "./ModalFormTugas";
import DaftarTugas from "./DaftarTugas";

// ============================================================================
// 1. SUB-KOMPONEN: HEADER TUGAS
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
// 2. MAIN COMPONENT (State Management)
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
    if (res.sukses) setDataSoal(res.data || []); // 🛡️ Fallback undefined
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
    } else {
      alert(res.pesan);
    }
    setLoadingForm(false);
  };

  const klikEdit = (item) => {
    setIdEdit(item._id);
    setForm({ judul: item.judul, url: item.url, tipeTarget: item.tipeTarget, target: item.target, isAktif: item.isAktif });
    setIsFormOpen(true);
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
      
      <HeaderTugas totalTugas={dataSoal?.length || 0} />

      {/* 🚀 TOMBOL UTAMA UNTUK BUKA MODAL */}
      <div style={{ padding: '0 16px', marginTop: '24px' }}>
        <button 
          onClick={() => setIsFormOpen(true)} 
          className={styles.tombolSimpanBiruBaru}
          style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <FaPlus size={18} /> BUAT TUGAS BARU
        </button>
      </div>

      <DaftarTugas 
        dataSoal={dataSoal} 
        loading={loading} 
        onEdit={klikEdit} 
        onHapus={klikHapus} 
      />

      {/* 🚀 RENDER MODAL FORM JIKA AKTIF */}
      {isFormOpen && (
        <ModalFormTugas 
          form={form} 
          setForm={setForm} 
          idEdit={idEdit} 
          dataSiswa={dataSiswa} 
          onSimpan={handleSimpan} 
          onBatal={batalEdit} 
          loadingForm={loadingForm} 
        />
      )}

    </div>
  );
}