"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
//  FIX: useSearchParams dan router Next.js dihapus

import { formatHelper } from "@/utils/formatHelper"; 
import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants"; 
import styles from "@/components/App.module.css";

import HeaderKelas from "./HeaderKelas";
import TabSelector from "./TabSelector"; 
import FilterKelas from "./FilterKelas"; 
import DaftarRiwayatKelas from "./DaftarRiwayatKelas";
import ModalGaleri from "./ModalGaleri";

import DaftarRiwayatKuis from "./DaftarRiwayatKuis";
import ModalUjianCBT from "../home/ModalUjianCBT"; 
import { getRiwayatKuisSiswa, getPembahasanKuis } from "@/actions/studentAction";

function InnerTabKelas({ jadwal, riwayat, siswa }) {
  const [activeTab, setActiveTab] = useState("KELAS"); 
  const [galeriAktif, setGaleriAktif] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  //  FIX: Jantung Pagination beralih ke RAM (0 Lag)
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGINATION_KELAS || 10;
  
  const [riwayatKuis, setRiwayatKuis] = useState([]);
  const [kuisAktifReview, setKuisAktifReview] = useState(null);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  
  useEffect(() => {
    if (siswa?._id) {
      getRiwayatKuisSiswa(siswa._id).then(res => {
        if (res.ok) setRiwayatKuis(res.data);
      });
    }
  }, [siswa]);

  //  FIX: Reset halaman ke 1 menjadi instan tanpa URL
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab]);

  const { jadwalSelesai } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);
  
  const jadwalDitampilkan = useMemo(() => {
    let dataHasilFilter = jadwalSelesai;

    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);

      dataHasilFilter = jadwalSelesai.filter(bungkusan => {
        const j = bungkusan.item; 
        const teksTanggal = j?.tanggal ? new Date(j.tanggal).toLocaleDateString('id-ID', { 
          timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        }).toLowerCase() : "";

        return keywords.every(kw => {
          return (
            (j?.mapel?.toLowerCase() || "").includes(kw) ||
            (j?.bab?.toLowerCase() || "").includes(kw) ||
            (j?.subBab?.toLowerCase() || "").includes(kw) ||
            (j?.jurnal?.toLowerCase() || "").includes(kw) ||
            (j?.kodePengajar?.toLowerCase() || "").includes(kw) ||
            teksTanggal.includes(kw)
          );
        });
      });
    }

    return [...dataHasilFilter].sort((a, b) => {
      return new Date(b.item.tanggal).getTime() - new Date(a.item.tanggal).getTime();
    });
  }, [jadwalSelesai, searchQuery]);

  const kuisDitampilkan = useMemo(() => {
    if (!searchQuery.trim()) return riwayatKuis; 
    
    const keywords = searchQuery.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);

    return riwayatKuis.filter(k => {
      const teksTanggal = k?.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID', { 
        timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
      }).toLowerCase() : "";

      return keywords.every(kw => {
        return (
          (k.mapel?.toLowerCase() || "").includes(kw) ||
          (k.bab?.toLowerCase() || "").includes(kw) ||
          teksTanggal.includes(kw)
        );
      });
    });
  }, [riwayatKuis, searchQuery]);

  const { totalPage: totalPageKelas, dataTerpotong: dataKelasHalIni } = formatHelper.potongDataPagination(jadwalDitampilkan, page, ITEMS_PER_PAGE);
  const { totalPage: totalPageKuis, dataTerpotong: dataKuisHalIni } = formatHelper.potongDataPagination(kuisDitampilkan, page, ITEMS_PER_PAGE);

  const klikBukaCatatan = (jadwalItem) => {
    setGaleriAktif({ mapel: jadwalItem.mapel, tanggal: jadwalItem.tanggal, foto: jadwalItem.galeriPapan || [], bab: jadwalItem.bab, subBab: jadwalItem.subBab });
  };

  const handleBukaPembahasan = async (jadwalId) => {
    if (!siswa) return alert("Data siswa tidak ditemukan.");
    const res = await getPembahasanKuis(jadwalId, siswa._id);
    if (res.ok) {
      setJawabanPastReview(res.data.jawabanSiswa);
      setKuisAktifReview({ jadwalId, soal: res.data.soal });
    } else {
      alert("Gagal memuat pembahasan: " + res.pesan);
    }
  };

  return (
    <>
      <HeaderKelas />
      <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <FilterKelas searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {activeTab === "KELAS" && (
        <DaftarRiwayatKelas 
          dataHalIni={dataKelasHalIni} 
          totalPage={totalPageKelas}
          currentPage={page}        //  FIX: Kirim kabel
          onPageChange={setPage}    //  FIX: Kirim kabel
          onBukaCatatan={klikBukaCatatan} 
        />
      )}

      {activeTab === "KUIS" && (
        <DaftarRiwayatKuis 
          dataRiwayatKuis={dataKuisHalIni} 
          totalPage={totalPageKuis}
          currentPage={page}        //  FIX: Kirim kabel
          onPageChange={setPage}    //  FIX: Kirim kabel
          onBukaPembahasan={handleBukaPembahasan} 
        />
      )}

      <ModalGaleri galeriAktif={galeriAktif} onClose={() => setGaleriAktif(null)} />

      {kuisAktifReview && siswa && (
        <ModalUjianCBT 
          jadwalId={kuisAktifReview.jadwalId} kuis={kuisAktifReview} siswa={siswa}
          isReviewMode={true} jawabanPast={jawabanPastReview} 
          onClose={() => { setKuisAktifReview(null); setJawabanPastReview([]); }} 
        />
      )}
    </>
  );
}

export default function TabKelas({ jadwal = [], riwayat = [], siswa }) {
  return (
    <div className={styles.contentArea}>
      <Suspense fallback={
        <div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Memuat Riwayat...</div>
      }>
        <InnerTabKelas jadwal={jadwal} riwayat={riwayat} siswa={siswa} />
      </Suspense>
    </div>
  );
}