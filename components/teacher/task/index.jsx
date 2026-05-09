"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FaLock, FaDesktop } from "react-icons/fa6";

// IMPOR API & KOMPONEN
import { ambilSemuaLatihanSoal, prosesSimpanLatihanSoal, prosesHapusLatihanSoal, ambilDaftarSiswaDropdown } from "@/actions/soalAction";
import { ambilSemuaBankSoal, hapusBankSoal } from "@/actions/quizAction";
import { potongDataPagination } from "@/utils/formatHelper"; // 🚀 FIX: Alat potong data

import { OPSI_KELAS, LIMIT_DATA } from "@/utils/constants";
import styles from "@/components/App.module.css";

// IMPOR ANAK KOMPONEN
import HeaderTugas from "./HeaderTugas";
import TabSelector from "./TabSelector"; 
import FilterTugas from "./FilterTugas"; // 🚀 FIX: Komponen pencari
import DaftarTugas from "./DaftarTugas";
import DaftarKuis from "./DaftarKuis"; 
import ModalFormTugas from "./ModalFormTugas";
import ModalKuis from "@/components/admin/ModalKuis"; 

// 🚀 FIX: Komponen Inti dipisah agar bisa dibungkus Suspense
function InnerTabTugas({ pengajarId }) { 
  const [activeTab, setActiveTab] = useState("TUGAS"); 
  const [isLayarKecil, setIsLayarKecil] = useState(false);
  
  // State untuk kotak pencarian & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGINATION_BAHAN || 3;

  useEffect(() => {
    const cekLayar = () => {
      setIsLayarKecil(window.innerWidth < 1024);
    };
    cekLayar(); 
    window.addEventListener("resize", cekLayar);
    return () => window.removeEventListener("resize", cekLayar);
  }, []);

  // Reset halaman saat ngetik atau pindah tab
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab]);

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
    if (isLayarKecil) return; 
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

  // 🚀 FITUR BARU: MESIN PENCARI TUGAS (AND Koma)
  const tugasDitampilkan = useMemo(() => {
    if (!searchQuery.trim()) return dataSoal;
    const keywords = searchQuery.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);
    return dataSoal.filter(item => {
      return keywords.every(kw => (
        (item?.judul?.toLowerCase() || "").includes(kw) ||
        (item?.tipeTarget?.toLowerCase() || "").includes(kw) ||
        (item?.target?.toLowerCase() || "").includes(kw)
      ));
    });
  }, [dataSoal, searchQuery]);

  // 🚀 FITUR BARU: MESIN PENCARI BANK SOAL CBT (AND Koma)
  const kuisDitampilkan = useMemo(() => {
    if (!searchQuery.trim()) return dataBankSoal;
    const keywords = searchQuery.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);
    return dataBankSoal.filter(bank => {
      return keywords.every(kw => (
        (bank?.judul?.toLowerCase() || "").includes(kw) ||
        (bank?.pembuatId?.nama?.toLowerCase() || "").includes(kw)
      ));
    });
  }, [dataBankSoal, searchQuery]);

  // 🚀 FIX: Potong data yang sudah difilter
  const { totalPage: totalPageTugas, dataTerpotong: dataTugasHalIni } = potongDataPagination(tugasDitampilkan, page, ITEMS_PER_PAGE);
  const { totalPage: totalPageKuis, dataTerpotong: dataKuisHalIni } = potongDataPagination(kuisDitampilkan, page, ITEMS_PER_PAGE);

  return (
    <>
      <HeaderTugas totalTugas={dataSoal?.length || 0} totalKuis={dataBankSoal?.length || 0} mode={activeTab} />
      <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Sembunyikan pencarian jika CBT terkunci karena layar kecil */}
      {!(activeTab === "BANK_SOAL" && isLayarKecil) && (
        <FilterTugas searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}

      {activeTab === "TUGAS" && (
        <DaftarTugas dataHalIni={dataTugasHalIni} totalPage={totalPageTugas} loading={loadingTugas} onEdit={klikEditTugas} onHapus={klikHapusTugas} onBukaForm={() => setIsFormOpen(true)} />
      )}

      {activeTab === "BANK_SOAL" && isLayarKecil ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px', textAlign: 'center' }}>
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
          <DaftarKuis dataHalIni={dataKuisHalIni} totalPage={totalPageKuis} loading={loadingBank} onBuatBaru={bukaModalBuatCBT} onEdit={bukaModalEditCBT} onHapus={klikHapusBankSoal} />
        )
      )}

      {isFormOpen && (
        <ModalFormTugas form={form} setForm={setForm} idEdit={idEdit} dataSiswa={dataSiswa} onSimpan={handleSimpanTugas} onBatal={batalEditTugas} loadingForm={loadingForm} />
      )}

      {isModalKuisOpen && !isLayarKecil && (
        <ModalKuis isOpen={isModalKuisOpen} onClose={tutupModalCBT} jadwal={{ _id: "MODE_BANK_SOAL", mapel: kuisAktif?.judul || "SOAL BARU", kelasTarget: "Gudang Soal" }} kuisLama={kuisAktif} adminId={pengajarId} muatData={muatBankSoal} />
      )}
    </>
  );
}

// 🚀 FIX: Komponen Utama berfungsi sebagai penangkap Loading Vercel
export default function TabTugasPengajar({ pengajarId }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Memuat Ruang Tugas...</div>}>
        <InnerTabTugas pengajarId={pengajarId} />
      </Suspense>
    </div>
  );
}