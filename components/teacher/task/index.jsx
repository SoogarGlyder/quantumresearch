"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { FaLock, FaDesktop } from "react-icons/fa6";

import {
  ambilSemuaLatihanSoal, prosesSimpanLatihanSoal,
  prosesHapusLatihanSoal, ambilDaftarSiswaDropdown,
} from "@/actions/soalAction";
import { ambilSemuaBankSoal, hapusBankSoal } from "@/actions/quizAction";
import { formatHelper } from "@/utils/formatHelper";
import { OPSI_KELAS, LIMIT_DATA } from "@/utils/constants";
import styles from "@/components/App.module.css";
import taskStyles from "@/components/teacher/task/Task.module.css";

import HeaderTugas    from "./HeaderTugas";
import TabSelector    from "./TabSelector";
import FilterTugas    from "./FilterTugas";
import DaftarTugas    from "./DaftarTugas";
import DaftarKuis     from "./DaftarKuis";
import ModalFormTugas from "./ModalFormTugas";
import ModalKuis      from "@/components/admin/ModalKuis";

// ============================================================================
// TIPE KONFIRMASI — menggantikan window.confirm() & alert()
// ============================================================================
const KONFIRMASI = Object.freeze({ HAPUS_TUGAS: "hapus_tugas", HAPUS_KUIS: "hapus_kuis" });

// ============================================================================
// SUB-KOMPONEN: PERINGATAN LAYAR KECIL
// ============================================================================
function LayarKecilWarning({ onKembali }) {
  return (
    <div className={taskStyles.wrapperLayarKecil}>
      <div className={taskStyles.kartuLayarKecil}>
        <FaLock size={64} color="#111827" />
        <h1 className={taskStyles.judulLayarKecil}>Layar Terlalu Kecil</h1>
        <p className={taskStyles.subLayarKecil}>
          Fitur Rakit Soal CBT sangat kompleks dan membutuhkan ruang layar yang luas.
        </p>
        <div className={taskStyles.infoDesktopBox}>
          <FaDesktop color="#4ade80" size={24} />
          <span className={taskStyles.infoDesktopTeks}>
            Silakan akses menu ini menggunakan PC, Laptop, atau Tablet (Landscape).
          </span>
        </div>
        <button onClick={onKembali} className={taskStyles.tombolKembaliTugas}>
          Kembali ke Tugas
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
function InnerTabTugas({ pengajarId }) {
  const [activeTab,    setActiveTab]    = useState("TUGAS");
  const [isLayarKecil, setIsLayarKecil] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [page,         setPage]         = useState(1);

  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGINATION_BAHAN || 3;

  useEffect(() => {
    const cekLayar = () => setIsLayarKecil(window.innerWidth < 1024);
    cekLayar();
    window.addEventListener("resize", cekLayar);
    return () => window.removeEventListener("resize", cekLayar);
  }, []);

  useEffect(() => { setPage(1); }, [searchQuery, activeTab]);

  const [dataSoal,     setDataSoal]     = useState([]);
  const [dataSiswa,    setDataSiswa]    = useState([]);
  const [loadingTugas, setLoadingTugas] = useState(true);
  const hasFetchedTugas = useRef(false);
  const hasFetchedSiswa = useRef(false);

  const initialForm = { judul: "", url: "", tipeTarget: "KELAS", target: OPSI_KELAS[0] || "", isAktif: true };
  const [isFormOpen,   setIsFormOpen]   = useState(false);
  const [idEdit,       setIdEdit]       = useState(null);
  const [form,         setForm]         = useState(initialForm);
  const [loadingForm,  setLoadingForm]  = useState(false);
  const [pesanForm,    setPesanForm]    = useState(null);

  const [dataBankSoal,    setDataBankSoal]    = useState([]);
  const [loadingBank,     setLoadingBank]     = useState(false);
  const [isModalKuisOpen, setIsModalKuisOpen] = useState(false);
  const [kuisAktif,       setKuisAktif]       = useState(null);
  const hasFetchedBank = useRef(false);

  const [konfirmasi, setKonfirmasi] = useState(null);

  useEffect(() => {
    if (!hasFetchedTugas.current) { muatDataTugas(); hasFetchedTugas.current = true; }
    if (!hasFetchedSiswa.current) {
      ambilDaftarSiswaDropdown().then((res) => { if (res.ok) setDataSiswa(res.data); });
      hasFetchedSiswa.current = true;
    }
  }, []);

  useEffect(() => {
    if (activeTab === "BANK_SOAL" && !hasFetchedBank.current) {
      muatBankSoal();
      hasFetchedBank.current = true;
    }
  }, [activeTab]);

  const muatDataTugas = async () => {
    setLoadingTugas(true);
    const res = await ambilSemuaLatihanSoal();
    if (res.ok) setDataSoal(res.data || []);
    setLoadingTugas(false);
  };

  const muatBankSoal = async () => {
    setLoadingBank(true);
    const data = await ambilSemuaBankSoal(pengajarId || null);
    setDataBankSoal(data || []);
    setLoadingBank(false);
  };

  const handleSimpanTugas = async (e) => {
    e.preventDefault();
    if (form.tipeTarget === "SISWA" && !form.target) {
      setPesanForm({ teks: "Pilih siswa terlebih dahulu!", ok: false });
      return;
    }

    setLoadingForm(true);
    let finalUrl = form.url;
    if (finalUrl.includes("drive.google.com") && finalUrl.includes("/view")) {
      finalUrl = finalUrl.split("/view")[0] + "/preview";
    }

    const res = await prosesSimpanLatihanSoal(idEdit, { ...form, url: finalUrl });
    if (res.ok) {
      batalEditTugas();
      muatDataTugas();
    } else {
      setPesanForm({ teks: res.pesan, ok: false });
    }
    setLoadingForm(false);
  };

  const klikEditTugas = (item) => {
    setIdEdit(item._id);
    setForm({ judul: item.judul, url: item.url, tipeTarget: item.tipeTarget, target: item.target, isAktif: item.isAktif });
    setPesanForm(null);
    setIsFormOpen(true);
  };

  const batalEditTugas = () => {
    setIdEdit(null);
    setForm(initialForm);
    setPesanForm(null);
    setIsFormOpen(false);
  };

  const eksekusiHapus = async () => {
    if (!konfirmasi) return;
    const { tipe, id } = konfirmasi;
    setKonfirmasi(null);

    if (tipe === KONFIRMASI.HAPUS_TUGAS) {
      const res = await prosesHapusLatihanSoal(id);
      if (res.ok) muatDataTugas();
    } else {
      const res = await hapusBankSoal(id);
      if (res.ok) muatBankSoal();
    }
  };

  const bukaModalBuatCBT = () => { if (!isLayarKecil) { setKuisAktif(null); setIsModalKuisOpen(true); } };
  const bukaModalEditCBT = (item) => { if (!isLayarKecil) { setKuisAktif(item); setIsModalKuisOpen(true); } };
  const tutupModalCBT    = () => { setIsModalKuisOpen(false); muatBankSoal(); };

  const tugasDitampilkan = useMemo(() => {
    if (!searchQuery.trim()) return dataSoal;
    const kws = searchQuery.toLowerCase().split(",").map((k) => k.trim()).filter(Boolean);
    return dataSoal.filter((item) =>
      kws.every(
        (kw) =>
          (item?.judul?.toLowerCase() || "").includes(kw) ||
          (item?.tipeTarget?.toLowerCase() || "").includes(kw) ||
          (item?.target?.toLowerCase() || "").includes(kw)
      )
    );
  }, [dataSoal, searchQuery]);

  const kuisDitampilkan = useMemo(() => {
    if (!searchQuery.trim()) return dataBankSoal;
    const kws = searchQuery.toLowerCase().split(",").map((k) => k.trim()).filter(Boolean);
    return dataBankSoal.filter((bank) =>
      kws.every(
        (kw) =>
          (bank?.judul?.toLowerCase() || "").includes(kw) ||
          (bank?.pembuatId?.nama?.toLowerCase() || "").includes(kw)
      )
    );
  }, [dataBankSoal, searchQuery]);

  const { totalPage: totalPageTugas, dataTerpotong: dataTugasHalIni } =
    formatHelper.potongDataPagination(tugasDitampilkan, page, ITEMS_PER_PAGE);
  const { totalPage: totalPageKuis, dataTerpotong: dataKuisHalIni } =
    formatHelper.potongDataPagination(kuisDitampilkan, page, ITEMS_PER_PAGE);

  return (
    <>
      <HeaderTugas
        totalTugas={dataSoal.length}
        totalKuis={dataBankSoal.length}
        mode={activeTab}
      />
      <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

      {!(activeTab === "BANK_SOAL" && isLayarKecil) && (
        <FilterTugas searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}

      {activeTab === "TUGAS" && (
        <DaftarTugas
          dataHalIni={dataTugasHalIni}
          totalPage={totalPageTugas}
          currentPage={page}
          onPageChange={setPage}
          loading={loadingTugas}
          onEdit={klikEditTugas}
          onHapus={(id, judul) => setKonfirmasi({ tipe: KONFIRMASI.HAPUS_TUGAS, id, judul })}
          onBukaForm={() => { setPesanForm(null); setIsFormOpen(true); }}
        />
      )}

      {activeTab === "BANK_SOAL" && (
        isLayarKecil
          ? <LayarKecilWarning onKembali={() => setActiveTab("TUGAS")} />
          : (
            <DaftarKuis
              dataHalIni={dataKuisHalIni}
              totalPage={totalPageKuis}
              currentPage={page}
              onPageChange={setPage}
              loading={loadingBank}
              onBuatBaru={bukaModalBuatCBT}
              onEdit={bukaModalEditCBT}
              onHapus={(id, judul) => setKonfirmasi({ tipe: KONFIRMASI.HAPUS_KUIS, id, judul })}
            />
          )
      )}

      {isFormOpen && (
        <ModalFormTugas
          form={form} setForm={setForm}
          idEdit={idEdit} dataSiswa={dataSiswa}
          onSimpan={handleSimpanTugas}
          onBatal={batalEditTugas}
          loadingForm={loadingForm}
          pesanForm={pesanForm}
        />
      )}

      {isModalKuisOpen && !isLayarKecil && (
        <ModalKuis
          isOpen={isModalKuisOpen}
          onClose={tutupModalCBT}
          jadwal={{ _id: "MODE_BANK_SOAL", mapel: kuisAktif?.judul || "SOAL BARU", kelasTarget: "Gudang Soal" }}
          kuisLama={kuisAktif}
          adminId={pengajarId}
          muatData={muatBankSoal}
        />
      )}

      {konfirmasi && (
        <div className={styles.wrapperGallery}>
          <div className={styles.containerGallery} style={{ maxWidth: 360 }}>
            <div style={{ padding: 24, textAlign: "center" }}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 900, textTransform: "uppercase" }}>
                {konfirmasi.tipe === KONFIRMASI.HAPUS_KUIS ? "Hapus Paket Soal?" : "Hapus Tugas?"}
              </h3>
              <p style={{ fontSize: 14, color: "#4b5563", fontWeight: 600, margin: "0 0 20px" }}>
                Yakin hapus <b>{konfirmasi.judul}</b>? Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className={taskStyles.cbtBtnGroup}>
                <button onClick={() => setKonfirmasi(null)} className={`${taskStyles.cbtBtn} ${taskStyles.cbtBtnBatal}`}>Batal</button>
                <button onClick={eksekusiHapus} className={`${taskStyles.cbtBtn} ${taskStyles.cbtBtnDanger}`}>Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TabTugasPengajar({ pengajarId }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={<div className={styles.messageLoading}>Memuat Ruang Tugas...</div>}>
        <InnerTabTugas pengajarId={pengajarId} />
      </Suspense>
    </div>
  );
}