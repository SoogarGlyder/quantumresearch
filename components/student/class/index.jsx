"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { potongDataPagination } from "@/utils/formatHelper"; 
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
  
  // State untuk kotak pencarian
  const [searchQuery, setSearchQuery] = useState("");
  
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KELAS || 10;
  
  const [riwayatKuis, setRiwayatKuis] = useState([]);
  const [kuisAktifReview, setKuisAktifReview] = useState(null);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  
  useEffect(() => {
    if (siswa?._id) {
      getRiwayatKuisSiswa(siswa._id).then(res => {
        if (res.sukses) setRiwayatKuis(res.data);
      });
    }
  }, [siswa]);

  // Reset halaman ke 1 saat siswa mengetik sesuatu di kotak pencarian atau pindah tab
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab]);

  const { jadwalSelesai } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);
  
  // 🚀 FITUR BARU: Mesin Pencari Kelas (Multi-Keyword AND + Sorting Terbaru)
  const jadwalDitampilkan = useMemo(() => {
    let dataHasilFilter = jadwalSelesai;

    if (searchQuery.trim()) {
      // Pecah query berdasarkan koma, bersihkan spasi, dan buang yang kosong
      const keywords = searchQuery.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);

      dataHasilFilter = jadwalSelesai.filter(bungkusan => {
        const j = bungkusan.item; 
        
        // Terjemahkan tanggal ke teks bahasa Indonesia (contoh: "jumat, 8 mei 2026")
        const teksTanggal = j?.tanggal ? new Date(j.tanggal).toLocaleDateString('id-ID', { 
          timeZone: PERIODE_BELAJAR.TIMEZONE, 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }).toLowerCase() : "";

        // Wajibkan SEMUA keyword terpenuhi
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

    // Urutkan dari yang terbaru ke terlama (Descending)
    return [...dataHasilFilter].sort((a, b) => {
      return new Date(b.item.tanggal).getTime() - new Date(a.item.tanggal).getTime();
    });

  }, [jadwalSelesai, searchQuery]);

  // 🚀 FITUR BARU: Mesin Pencari Kuis (Multi-Keyword AND)
  const kuisDitampilkan = useMemo(() => {
    if (!searchQuery.trim()) return riwayatKuis; 
    
    const keywords = searchQuery.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);

    return riwayatKuis.filter(k => {
      
      // Terjemahkan tanggal kuis
      const teksTanggal = k?.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID', { 
        timeZone: PERIODE_BELAJAR.TIMEZONE, 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).toLowerCase() : "";

      // Wajibkan SEMUA keyword terpenuhi
      return keywords.every(kw => {
        return (
          (k.mapel?.toLowerCase() || "").includes(kw) ||
          (k.bab?.toLowerCase() || "").includes(kw) ||
          teksTanggal.includes(kw)
        );
      });
    });
  }, [riwayatKuis, searchQuery]);

  // Masukkan data yang SUDAH DIFILTER ke dalam pemotong Pagination
  const { totalPage: totalPageKelas, dataTerpotong: dataKelasHalIni } = potongDataPagination(jadwalDitampilkan, page, ITEMS_PER_PAGE);
  const { totalPage: totalPageKuis, dataTerpotong: dataKuisHalIni } = potongDataPagination(kuisDitampilkan, page, ITEMS_PER_PAGE);

  const klikBukaCatatan = (jadwalItem) => {
    setGaleriAktif({ mapel: jadwalItem.mapel, tanggal: jadwalItem.tanggal, foto: jadwalItem.galeriPapan || [], bab: jadwalItem.bab, subBab: jadwalItem.subBab });
  };

  const handleBukaPembahasan = async (jadwalId) => {
    if (!siswa) return alert("Data siswa tidak ditemukan.");
    const res = await getPembahasanKuis(jadwalId, siswa._id);
    if (res.sukses) {
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
      
      {/* Kotak Pencarian Di Bawah Selector Tab */}
      <FilterKelas searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {activeTab === "KELAS" && (
        <DaftarRiwayatKelas 
          dataHalIni={dataKelasHalIni} 
          totalPage={totalPageKelas}
          onBukaCatatan={klikBukaCatatan} 
        />
      )}

      {activeTab === "KUIS" && (
        <DaftarRiwayatKuis 
          dataRiwayatKuis={dataKuisHalIni} 
          totalPage={totalPageKuis}
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

// Komponen Utama berfungsi sebagai penangkap Loading Vercel
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