"use client";

import { useState, useEffect, useRef } from "react";
// FIX: Import FaLock dan FaDesktop untuk UI Tembok Peringatan
import { FaLock, FaDesktop } from "react-icons/fa6";

// IMPOR API & KOMPONEN
import { ambilSemuaLatihanSoal, prosesSimpanLatihanSoal, prosesHapusLatihanSoal, ambilDaftarSiswaDropdown } from "@/actions/soalAction";
import { ambilSemuaBankSoal, hapusBankSoal } from "@/actions/quizAction";

import { OPSI_KELAS } from "@/utils/constants";
import styles from "@/components/App.module.css";

// IMPOR ANAK KOMPONEN
import HeaderTugas from "./HeaderTugas";
import TabSelector from "./TabSelector"; 
import DaftarTugas from "./DaftarTugas";
import DaftarKuis from "./DaftarKuis"; 
import ModalFormTugas from "./ModalFormTugas";
import ModalKuis from "@/components/admin/ModalKuis"; 

export default function TabTugasPengajar({ pengajarId }) { 
  const [activeTab, setActiveTab] = useState("TUGAS"); 
  
  // FIX: State untuk mendeteksi layar kecil
  const [isLayarKecil, setIsLayarKecil] = useState(false);

  // =========================================================
  // 0. DETEKSI UKURAN LAYAR (KHUSUS CBT)
  // =========================================================
  useEffect(() => {
    const cekLayar = () => {
      setIsLayarKecil(window.innerWidth < 1024);
    };
    cekLayar(); 
    window.addEventListener("resize", cekLayar);
    return () => window.removeEventListener("resize", cekLayar);
  }, []);

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

  const bukaModalBuatCBT = () => { 
    if (isLayarKecil) return; // Mencegah pemaksaan buka jika layar kecil
    setKuisAktif(null); 
    setIsModalKuisOpen(true); 
  };
  
  const bukaModalEditCBT = (item) => { 
    if (isLayarKecil) return; 
    setKuisAktif(item); 
    setIsModalKuisOpen(true); 
  };
  
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

      {/* FIX: Render kondisional untuk Bank Soal CBT berdasarkan lebar layar */}
      {activeTab === "BANK_SOAL" && isLayarKecil ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#ef4444', padding: '30px', borderRadius: '24px', border: '6px solid #111827', boxShadow: '8px 8px 0 #111827', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <FaLock size={64} color="#111827" />
            <h1 style={{ margin: 0, color: 'white', fontWeight: '900', fontSize: '24px', textTransform: 'uppercase', lineHeight: '1.2' }}>Layar Terlalu Kecil</h1>
            <p style={{ margin: 0, color: '#fef08a', fontWeight: 'bold', fontSize: '15px', lineHeight: '1.5' }}>
              Fitur Rakit Soal CBT sangat kompleks dan membutuhkan ruang layar yang luas.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#111827', padding: '12px 16px', borderRadius: '12px', marginTop: '10px' }}>
              <FaDesktop color="#4ade80" size={24} />
              <span style={{ color: 'white', fontWeight: '900', fontSize: '14px', textAlign: 'left' }}>
                Silakan akses menu ini menggunakan PC, Laptop, atau Tablet (Landscape).
              </span>
            </div>
            <button 
              onClick={() => setActiveTab("TUGAS")} 
              style={{ 
                marginTop: '16px', padding: '14px 24px', backgroundColor: '#facc15', color: '#111827', 
                border: '4px solid #111827', borderRadius: '12px', fontWeight: '900', fontSize: '16px', 
                cursor: 'pointer', width: '100%', textTransform: 'uppercase' 
              }}
            >
              Kembali ke Tugas
            </button>
          </div>
        </div>
      ) : (
        activeTab === "BANK_SOAL" && (
          <DaftarKuis dataBankSoal={dataBankSoal} loading={loadingBank} onBuatBaru={bukaModalBuatCBT} onEdit={bukaModalEditCBT} onHapus={klikHapusBankSoal} />
        )
      )}

      {/* 4. AREA MODAL */}
      {isFormOpen && (
        <ModalFormTugas form={form} setForm={setForm} idEdit={idEdit} dataSiswa={dataSiswa} onSimpan={handleSimpanTugas} onBatal={batalEditTugas} loadingForm={loadingForm} />
      )}

      {/* FIX: Cegah render ModalKuis jika layar kecil, lapis pertahanan ekstra! */}
      {isModalKuisOpen && !isLayarKecil && (
        <ModalKuis isOpen={isModalKuisOpen} onClose={tutupModalCBT} jadwal={{ _id: "MODE_BANK_SOAL", mapel: kuisAktif?.judul || "SOAL BARU", kelasTarget: "Gudang Soal" }} kuisLama={kuisAktif} adminId={pengajarId} muatData={muatBankSoal} />
      )}

    </div>
  );
}