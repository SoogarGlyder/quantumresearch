"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 

import { potongDataPagination } from "@/utils/formatHelper"; 
import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants"; 
import styles from "@/components/App.module.css";

import HeaderKelas from "./HeaderKelas";
import TabSelector from "./TabSelector"; 
import DaftarRiwayatKelas from "./DaftarRiwayatKelas";
import ModalGaleri from "./ModalGaleri";

import DaftarRiwayatKuis from "./DaftarRiwayatKuis";
import ModalUjianCBT from "../home/ModalUjianCBT"; 
import { getRiwayatKuisSiswa, getPembahasanKuis } from "@/actions/studentAction";

// 🚀 FIX: Komponen Inti dipisah agar bisa dibungkus Suspense
function InnerTabKelas({ jadwal, riwayat, siswa }) {
  const [activeTab, setActiveTab] = useState("KELAS"); 
  const [galeriAktif, setGaleriAktif] = useState(null);
  
  const searchParams = useSearchParams();
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

  const { jadwalSelesai } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);
  
  const { totalPage: totalPageKelas, dataTerpotong: dataKelasHalIni } = potongDataPagination(jadwalSelesai, page, ITEMS_PER_PAGE);
  const { totalPage: totalPageKuis, dataTerpotong: dataKuisHalIni } = potongDataPagination(riwayatKuis, page, ITEMS_PER_PAGE);

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

// 🚀 FIX: Komponen Utama berfungsi sebagai penangkap Loading Vercel
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