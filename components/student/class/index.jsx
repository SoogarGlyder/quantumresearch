"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { formatHelper } from "@/utils/formatHelper";
import { timeHelper } from "@/utils/timeHelper";
import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants";
import styles from "@/components/App.module.css";
import classStyles from "@/components/student/class/Class.module.css";

import HeaderKelas       from "./HeaderKelas";
import TabSelector       from "./TabSelector";
import FilterKelas       from "./FilterKelas";
import DaftarRiwayatKelas from "./DaftarRiwayatKelas";
import ModalGaleri       from "./ModalGaleri";
import DaftarRiwayatKuis from "./DaftarRiwayatKuis";
import ModalUjianCBT     from "../home/ModalUjianCBT";
import { getRiwayatKuisSiswa, getPembahasanKuis } from "@/actions/studentAction";

function InnerTabKelas({ jadwal, riwayat, siswa, isDemoMode, riwayatKuisDemo }) {
  const [activeTab,        setActiveTab]        = useState("KELAS");
  const [galeriAktif,      setGaleriAktif]      = useState(null);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [page,             setPage]             = useState(1);
  const [riwayatKuis,      setRiwayatKuis]      = useState([]);
  const [kuisAktifReview,  setKuisAktifReview]  = useState(null);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  // ✅ FIX: pesanError menggantikan alert()
  const [pesanError, setPesanError] = useState(null);

  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGINATION_KELAS || 10;

  useEffect(() => {
    // 🎭 Mode Demo: pasang riwayatKuisDemo langsung, jangan panggil server action.
    if (isDemoMode && riwayatKuisDemo) {
      setRiwayatKuis(riwayatKuisDemo);
      return;
    }

    if (siswa?._id) {
      getRiwayatKuisSiswa(siswa._id).then((res) => {
        if (res.ok) setRiwayatKuis(res.data);
      });
    }
  }, [siswa, isDemoMode, riwayatKuisDemo]);

  // Reset halaman saat filter atau tab berubah
  useEffect(() => { setPage(1); }, [searchQuery, activeTab]);

  const { jadwalSelesai } = useMemo(
    () => pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR),
    [jadwal, riwayat]
  );

  const jadwalDitampilkan = useMemo(() => {
    let hasil = jadwalSelesai;

    if (searchQuery.trim()) {
      const kws = searchQuery.toLowerCase().split(",").map((k) => k.trim()).filter(Boolean);
      hasil = jadwalSelesai.filter(({ item: j }) => {
        // ✅ FIX: timeHelper.formatTanggalLengkap — timezone-safe
        const teksTanggal = timeHelper.formatTanggalLengkap(j.tanggal).toLowerCase();
        return kws.every(
          (kw) =>
            (j?.mapel?.toLowerCase()      || "").includes(kw) ||
            (j?.bab?.toLowerCase()        || "").includes(kw) ||
            (j?.subBab?.toLowerCase()     || "").includes(kw) ||
            (j?.kodePengajar?.toLowerCase() || "").includes(kw) ||
            teksTanggal.includes(kw)
        );
      });
    }

    // Sort terbaru di atas — string YYYY-MM-DD bisa dibandingkan langsung
    return [...hasil].sort((a, b) =>
      timeHelper.getTglJakarta(b.item.tanggal).localeCompare(
        timeHelper.getTglJakarta(a.item.tanggal)
      )
    );
  }, [jadwalSelesai, searchQuery]);

  const kuisDitampilkan = useMemo(() => {
    if (!searchQuery.trim()) return riwayatKuis;
    const kws = searchQuery.toLowerCase().split(",").map((k) => k.trim()).filter(Boolean);
    return riwayatKuis.filter((k) => {
      const teksTanggal = timeHelper.formatTanggalLengkap(k.tanggal).toLowerCase();
      return kws.every(
        (kw) =>
          (k.mapel?.toLowerCase() || "").includes(kw) ||
          (k.bab?.toLowerCase()   || "").includes(kw) ||
          teksTanggal.includes(kw)
      );
    });
  }, [riwayatKuis, searchQuery]);

  const { totalPage: totalPageKelas, dataTerpotong: dataKelasHalIni } =
    formatHelper.potongDataPagination(jadwalDitampilkan, page, ITEMS_PER_PAGE);
  const { totalPage: totalPageKuis, dataTerpotong: dataKuisHalIni } =
    formatHelper.potongDataPagination(kuisDitampilkan, page, ITEMS_PER_PAGE);

  const klikBukaCatatan = (jadwalItem) => {
    setGaleriAktif({
      mapel:  jadwalItem.mapel,
      tanggal: jadwalItem.tanggal,
      foto:   jadwalItem.galeriPapan || [],
      bab:    jadwalItem.bab,
      subBab: jadwalItem.subBab,
    });
  };

  const handleBukaPembahasan = async (jadwalId) => {
    // 🎭 Mode Demo: cari data simulasi dari riwayatKuisDemo, jangan panggil server.
    if (isDemoMode && riwayatKuisDemo) {
      const data = riwayatKuisDemo.find((k) => k.jadwalId === jadwalId);
      if (data) {
        const jawabanSimulasi = data.soal.map((s) => s.jawabanSiswaSimulasi || "");
        setJawabanPastReview(jawabanSimulasi);
        setKuisAktifReview({
          jadwalId,
          soal: data.soal.map((s, i) => ({
            ...s,
            opsi: s.opsi || [
              { label: "A", teks: "Opsi A" }, { label: "B", teks: "Opsi B" },
              { label: "C", teks: "Opsi C" }, { label: "D", teks: "Opsi D" },
            ],
            pembahasan: s.pembahasan || `<p>Ini adalah pembahasan simulasi untuk soal nomor ${i + 1}.</p>`,
          })),
        });
      }
      return;
    }

    if (!siswa) {
      setPesanError("Data siswa tidak ditemukan.");
      setTimeout(() => setPesanError(null), 3000);
      return;
    }
    const res = await getPembahasanKuis(jadwalId, siswa._id);
    if (res.ok) {
      setJawabanPastReview(res.data.jawabanSiswa);
      setKuisAktifReview({ jadwalId, soal: res.data.soal });
      setPesanError(null);
    } else {
      // ✅ FIX: state pesanError — bukan alert()
      setPesanError("Gagal memuat pembahasan: " + res.pesan);
      setTimeout(() => setPesanError(null), 3000);
    }
  };

  return (
    <>
      <HeaderKelas />
      <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
      <FilterKelas searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Pesan error — menggantikan alert() */}
      {pesanError && (
        <p className={`${styles.emptySchedule} ${classStyles.filterWrapper}`}
          style={{ color: "#b91c1c", background: "#fee2e2", border: "3px solid #ef4444" }}>
          {pesanError}
        </p>
      )}

      {activeTab === "KELAS" && (
        <DaftarRiwayatKelas
          dataHalIni={dataKelasHalIni}
          totalPage={totalPageKelas}
          currentPage={page}
          onPageChange={setPage}
          onBukaCatatan={klikBukaCatatan}
        />
      )}

      {activeTab === "KUIS" && (
        <DaftarRiwayatKuis
          dataRiwayatKuis={dataKuisHalIni}
          totalPage={totalPageKuis}
          currentPage={page}
          onPageChange={setPage}
          onBukaPembahasan={handleBukaPembahasan}
        />
      )}

      <ModalGaleri galeriAktif={galeriAktif} onClose={() => setGaleriAktif(null)} />

      {kuisAktifReview && siswa && (
        <ModalUjianCBT
          jadwalId={kuisAktifReview.jadwalId}
          kuis={kuisAktifReview}
          siswa={siswa}
          isReviewMode
          jawabanPast={jawabanPastReview}
          onClose={() => { setKuisAktifReview(null); setJawabanPastReview([]); }}
        />
      )}
    </>
  );
}

export default function TabKelas({ jadwal = [], riwayat = [], siswa, isDemoMode, riwayatKuisDemo }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={<div className={styles.messageLoading}>Memuat Riwayat...</div>}>
        <InnerTabKelas
          jadwal={jadwal}
          riwayat={riwayat}
          siswa={siswa}
          isDemoMode={isDemoMode}
          riwayatKuisDemo={riwayatKuisDemo}
        />
      </Suspense>
    </div>
  );
}