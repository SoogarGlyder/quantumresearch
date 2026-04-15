"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; 

import PaginationBar from "@/components/ui/PaginationBar"; 
import { potongDataPagination } from "@/utils/formatHelper"; 
import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants"; 
import styles from "@/components/App.module.css";

import HeaderKelas from "./HeaderKelas";
import DaftarRiwayatKelas from "./DaftarRiwayatKelas";
import ModalGaleri from "./ModalGaleri";

// 🚀 IMPORT UNTUK KUIS CBT
import DaftarRiwayatKuis from "./DaftarRiwayatKuis";
import ModalUjianCBT from "../home/ModalUjianCBT"; 
import { getRiwayatKuisSiswa, getPembahasanKuis } from "@/actions/studentAction";

export default function TabKelas({ jadwal = [], riwayat = [], siswa }) {
  const [galeriAktif, setGaleriAktif] = useState(null);
  const searchParams = useSearchParams();
  
  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KELAS || 10;
  
  // STATE KHUSUS RIWAYAT KUIS
  const [riwayatKuis, setRiwayatKuis] = useState([]);
  const [kuisAktifReview, setKuisAktifReview] = useState(null);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  
  // 🚀 Ambil data riwayat kuis
  useEffect(() => {
    // Pastikan `siswa._id` ada sebelum menembak ke server
    if (siswa?._id) {
      getRiwayatKuisSiswa(siswa._id).then(res => {
        if (res.sukses) setRiwayatKuis(res.data);
      });
    } else {
      console.warn("⚠️ Data 'siswa' belum dikirim ke TabKelas!");
    }
  }, [siswa]);

  const { jadwalSelesai } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);

  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(jadwalSelesai, page, ITEMS_PER_PAGE);

  const klikBukaCatatan = (jadwalItem) => {
    setGaleriAktif({
      mapel: jadwalItem.mapel,
      tanggal: jadwalItem.tanggal,
      foto: jadwalItem.galeriPapan || [], 
      bab: jadwalItem.bab,
      subBab: jadwalItem.subBab
    });
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
    <div className={styles.contentArea}>
      
      <HeaderKelas />

      {/* RENDER DAFTAR RIWAYAT ABSENSI/KELAS */}
      <DaftarRiwayatKelas 
        dataHalIni={dataHalIni} 
        onBukaCatatan={klikBukaCatatan} 
      />

      <div>
        <PaginationBar totalPages={totalPage} style={{ justifyContent: 'space-evenly'}} />
      </div>

      {/* RENDER DAFTAR RIWAYAT KUIS (Jika ada isinya) */}
      {riwayatKuis.length > 0 && (
        <DaftarRiwayatKuis 
          dataRiwayatKuis={riwayatKuis} 
          onBukaPembahasan={handleBukaPembahasan} 
        />
      )}

      <ModalGaleri 
        galeriAktif={galeriAktif} 
        onClose={() => setGaleriAktif(null)} 
      />

      {/* MODAL PEMBAHASAN CBT */}
      {kuisAktifReview && siswa && (
        <ModalUjianCBT 
          jadwalId={kuisAktifReview.jadwalId}
          kuis={kuisAktifReview} 
          siswa={siswa}
          isReviewMode={true} 
          jawabanPast={jawabanPastReview} 
          onClose={() => {
            setKuisAktifReview(null); 
            setJawabanPastReview([]);
          }} 
        />
      )}

    </div>
  );
}