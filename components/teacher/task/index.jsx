"use client";

import { useState, useEffect, useRef } from "react";

// IMPOR API & KOMPONEN
import { ambilSemuaLatihanSoal, prosesSimpanLatihanSoal, prosesHapusLatihanSoal, ambilDaftarSiswaDropdown } from "@/actions/soalAction";
import { ambilSemuaBankSoal, hapusBankSoal } from "@/actions/quizAction";

import { OPSI_KELAS } from "@/utils/constants";
import styles from "@/components/App.module.css";

// IMPOR ANAK KOMPONEN
import HeaderTugas from "./HeaderTugas";
import TabSelector from "./TabSelector"; // 🚀 Import komponen baru kita
import DaftarTugas from "./DaftarTugas";
import DaftarKuis from "./DaftarKuis"; 
import ModalFormTugas from "./ModalFormTugas";
import ModalKuis from "@/components/admin/ModalKuis"; 

export default function TabTugasPengajar({ pengajarId }) { 
  const [activeTab, setActiveTab] = useState("TUGAS"); 

  // =========================================================
  // 1. STATE & LOGIKA TUGAS & MATERI
  // =========================================================
  const [dataSoal, setDataSoal] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [loadingTugas, setLoadingTugas] = useState(true);
  
  const hasFetchedTugas = useRef(false);
  const hasFetchedSiswa = useRef(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  
  const initialForm = { judul: "", url: "", tipeTarget: "KELAS", target: OPSI_KELAS[0] || "", isAktif: true };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!hasFetchedTugas.current) {
      muatDataTugas();
      hasFetchedTugas.current = true;
    }
    
    if (!hasFetchedSiswa.current) {
      ambilDaftarSiswaDropdown().then(res => { 
        if(res.sukses) setDataSiswa(res.data); 
      });
      hasFetchedSiswa.current = true;
    }
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
  // 2. STATE & LOGIKA BANK SOAL CBT
  // =========================================================
  const [dataBankSoal, setDataBankSoal] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  
  const hasFetchedBank = useRef(false);

  const [isModalKuisOpen, setIsModalKuisOpen] = useState(false);
  const [kuisAktif, setKuisAktif] = useState(null); 

  const muatBankSoal = async () => {
    setLoadingBank(true);
    const data = await ambilSemuaBankSoal(pengajarId || null); 
    setDataBankSoal(data || []);
    setLoadingBank(false);
  };

  useEffect(() => {
    if (activeTab === "BANK_SOAL" && !hasFetchedBank.current) {
      muatBankSoal();
      hasFetchedBank.current = true;
    }
  }, [activeTab]);

  const klikHapusBankSoal = async (id, judul) => {
    if (window.confirm(`YAKIN MENGHAPUS MASTER SOAL CBT: "${judul}"?\n\nSoal yang sudah ter-copy di kelas siswa tidak akan terpengaruh.`)) {
      const res = await hapusBankSoal(id);
      if (res.sukses) muatBankSoal(); else alert(res.pesan);
    }
  };

  const bukaModalBuatCBT = () => { setKuisAktif(null); setIsModalKuisOpen(true); };
  const bukaModalEditCBT = (item) => { setKuisAktif(item); setIsModalKuisOpen(true); };
  
  const tutupModalCBT = () => { 
    setIsModalKuisOpen(false); 
    muatBankSoal();
  };

  // =========================================================
  // RENDER UI
  // =========================================================
  return (
    <div className={styles.contentArea}>
      
      {/* 1. HEADER */}
      <HeaderTugas totalTugas={dataSoal?.length || 0} totalKuis={dataBankSoal?.length || 0} mode={activeTab} />

      {/* 2. TAB SWITCHER (Sudah jadi 1 baris bersih) */}
      <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

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