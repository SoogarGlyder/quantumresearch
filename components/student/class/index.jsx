"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation"; 

// 🚀 PATH ABSOLUTE
import PaginationBar from "@/components/ui/PaginationBar"; 
import { potongDataPagination } from "@/utils/formatHelper"; 
import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants"; 
import styles from "@/components/App.module.css";

// 🚀 IMPORT TETANGGA (LOKAL)
import HeaderKelas from "./HeaderKelas";
import DaftarRiwayatKelas from "./DaftarRiwayatKelas";
import ModalGaleri from "./ModalGaleri";

export default function TabKelas({ jadwal = [], riwayat = [] }) {
  const [galeriAktif, setGaleriAktif] = useState(null);
  const searchParams = useSearchParams();
  
  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KELAS || 10;
  
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

  return (
    <div className={styles.contentArea}>
      
      <HeaderKelas />

      <DaftarRiwayatKelas 
        dataHalIni={dataHalIni} 
        onBukaCatatan={klikBukaCatatan} 
      />

      <div style={{ margin: '24px 16px 0 16px' }}>
        <PaginationBar totalPages={totalPage} style={{ justifyContent: 'space-evenly'}} />
      </div>

      <ModalGaleri 
        galeriAktif={galeriAktif} 
        onClose={() => setGaleriAktif(null)} 
      />

    </div>
  );
}