"use client";

import { useState, useEffect } from "react";
import { FaBookOpen, FaBrain } from "react-icons/fa6";

// IMPOR API & KOMPONEN
import { ambilSemuaLatihanSoal, prosesSimpanLatihanSoal, prosesHapusLatihanSoal, ambilDaftarSiswaDropdown } from "@/actions/soalAction";
import { ambilSemuaBankSoal, hapusBankSoal } from "@/actions/quizAction";

import { OPSI_KELAS } from "@/utils/constants";
import styles from "@/components/App.module.css";

// IMPOR ANAK KOMPONEN
import HeaderTugas from "./HeaderTugas";
import DaftarTugas from "./DaftarTugas";
import DaftarKuis from "./DaftarKuis"; 
import ModalFormTugas from "./ModalFormTugas";
import ModalKuis from "@/components/admin/ModalKuis"; 

export default function TabTugasPengajar({ pengajarId }) { 
  const [activeTab, setActiveTab] = useState("TUGAS"); 

  // =========================================================
  // 1. STATE & LOGIKA TUGAS & MATERI (LAMA)
  // =========================================================
  const [dataSoal, setDataSoal] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [loadingTugas, setLoadingTugas] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  
  const initialForm = { judul: "", url: "", tipeTarget: "KELAS", target: OPSI_KELAS[0] || "", isAktif: true };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    muatDataTugas();
    ambilDaftarSiswaDropdown().then(res => { if(res.sukses) setDataSiswa(res.data); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const muatDataTugas = async () => {
    setLoadingTugas(true);
    const res = await ambilSemuaLatihanSoal();
    if (res.sukses) setDataSoal(res.data || []); 
    setLoadingTugas(false);
  };

  const handleSimpanTugas = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    let finalTarget = form.target;
    if (form.tipeTarget === "SISWA" && !finalTarget) { alert("Pilih siswa terlebih dahulu!"); setLoadingForm(false); return; }
    let finalUrl = form.url;
    if (finalUrl.includes("drive.google.com") && finalUrl.includes("/view")) { finalUrl = finalUrl.split("/view")[0] + "/preview"; }

    const res = await prosesSimpanLatihanSoal(idEdit, { ...form, target: finalTarget, url: finalUrl });
    if (res.sukses) { batalEditTugas(); muatDataTugas(); } else { alert(res.pesan); }
    setLoadingForm(false);
  };

  const klikEditTugas = (item) => {
    setIdEdit(item._id);
    setForm({ judul: item.judul, url: item.url, tipeTarget: item.tipeTarget, target: item.target, isAktif: item.isAktif });
    setIsFormOpen(true);
  };

  const batalEditTugas = () => { setIdEdit(null); setForm(initialForm); setIsFormOpen(false); };

  const klikHapusTugas = async (id, judul) => {
    if (window.confirm(`Yakin hapus tugas/materi: "${judul}"?`)) {
      const res = await prosesHapusLatihanSoal(id);
      if (res.sukses) muatDataTugas();
    }
  };

  // =========================================================
  // 2. STATE & LOGIKA BANK SOAL CBT (BARU)
  // =========================================================
  const [dataBankSoal, setDataBankSoal] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  
  const [isModalKuisOpen, setIsModalKuisOpen] = useState(false);
  const [kuisAktif, setKuisAktif] = useState(null); 

  const muatBankSoal = async () => {
    setLoadingBank(true);
    const data = await ambilSemuaBankSoal(pengajarId || null); 
    setDataBankSoal(data || []);
    setLoadingBank(false);
  };

  useEffect(() => {
    if (activeTab === "BANK_SOAL") muatBankSoal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const klikHapusBankSoal = async (id, judul) => {
    if (window.confirm(`YAKIN MENGHAPUS MASTER SOAL CBT: "${judul}"?\n\nSoal yang sudah ter-copy di kelas siswa tidak akan terpengaruh.`)) {
      const res = await hapusBankSoal(id);
      if (res.sukses) muatBankSoal(); else alert(res.pesan);
    }
  };

  const bukaModalBuatCBT = () => { setKuisAktif(null); setIsModalKuisOpen(true); };
  const bukaModalEditCBT = (item) => { setKuisAktif(item); setIsModalKuisOpen(true); };
  const tutupModalCBT = () => { setIsModalKuisOpen(false); muatBankSoal(); };

  // =========================================================
  // RENDER UI
  // =========================================================
  return (
    <div className={styles.contentArea}>
      
      {/* 1. HEADER (Di Paling Atas) */}
      <HeaderTugas totalTugas={dataSoal?.length || 0} totalKuis={dataBankSoal?.length || 0} mode={activeTab} />

      {/* 2. TAB SWITCHER (Tepat di Bawah Header) */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10, borderBottom: '4px solid #111827' }}>
        <button 
          onClick={() => setActiveTab("TUGAS")}
          style={{ flex: 1, padding: '12px', fontWeight: '900', fontSize: '15px', borderRadius: '10px', border: '3px solid #111827', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s',
            background: activeTab === "TUGAS" ? '#facc15' : '#fff', color: '#111827',
            boxShadow: activeTab === "TUGAS" ? '4px 4px 0 #111827' : 'none', transform: activeTab === "TUGAS" ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaBookOpen size={18} /> TUGAS & MATERI
        </button>
        <button 
          onClick={() => setActiveTab("BANK_SOAL")}
          style={{ flex: 1, padding: '12px', fontWeight: '900', fontSize: '15px', borderRadius: '10px', border: '3px solid #111827', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s',
            background: activeTab === "BANK_SOAL" ? '#3b82f6' : '#fff', color: activeTab === "BANK_SOAL" ? 'white' : '#111827',
            boxShadow: activeTab === "BANK_SOAL" ? '4px 4px 0 #111827' : 'none', transform: activeTab === "BANK_SOAL" ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaBrain size={18} /> BANK SOAL CBT
        </button>
      </div>

      {/* 3. AREA KONTEN */}
      {activeTab === "TUGAS" && (
        <DaftarTugas dataSoal={dataSoal} loading={loadingTugas} onEdit={klikEditTugas} onHapus={klikHapusTugas} onBukaForm={() => setIsFormOpen(true)} />
      )}

      {activeTab === "BANK_SOAL" && (
        <DaftarKuis dataBankSoal={dataBankSoal} loading={loadingBank} onBuatBaru={bukaModalBuatCBT} onEdit={bukaModalEditCBT} onHapus={klikHapusBankSoal} />
      )}

      {/* 4. AREA MODAL */}
      {isFormOpen && (
        <ModalFormTugas form={form} setForm={setForm} idEdit={idEdit} dataSiswa={dataSiswa} onSimpan={handleSimpanTugas} onBatal={batalEditTugas} loadingForm={loadingForm} />
      )}

      {isModalKuisOpen && (
        <ModalKuis isOpen={isModalKuisOpen} onClose={tutupModalCBT} jadwal={{ _id: "MODE_BANK_SOAL", mapel: kuisAktif?.judul || "SOAL BARU", kelasTarget: "Gudang Soal" }} kuisLama={kuisAktif} adminId={pengajarId} muatData={muatBankSoal} />
      )}

    </div>
  );
}