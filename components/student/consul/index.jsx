"use client";

import { useState, useMemo, useEffect } from "react"; 
import { useSearchParams, usePathname, useRouter } from "next/navigation"; 
import { FaBoxOpen } from "react-icons/fa6";

// 🚀 PATH ABSOLUTE
import PaginationBar from "@/components/ui/PaginationBar"; 
import { potongDataPagination } from "@/utils/formatHelper"; 
import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants";
import styles from "@/components/App.module.css";

// 🚀 IMPORT TETANGGA LOKAL
import HeaderKonsul from "./HeaderKonsul";
import FilterKonsul from "./FilterKonsul";
import RecordCard from "./RecordCard";

export default function TabKonsulSiswa({ riwayat = [] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_KONSUL || 10;

  const [filterBulan, setFilterBulan] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [idTerbuka, setIdTerbuka] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBulan, filterMapel]);

  const dapatkanLabelBulan = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString('id-ID', { 
      timeZone: PERIODE_BELAJAR.TIMEZONE, 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const toggleDetail = (id) => setIdTerbuka(prevId => prevId === id ? null : id);

  const riwayatKonsul = useMemo(() => {
    const konsulMurni = riwayat.filter(r => r.jenisSesi === TIPE_SESI.KONSUL);

    const konsulExtra = riwayat
      .filter(r => r.jenisSesi === TIPE_SESI.KELAS && r.konsulExtraMenit > 0 && r.waktuSelesai)
      .map(r => {
        const waktuSelesaiObj = new Date(r.waktuSelesai);
        const waktuMulaiObj = new Date(waktuSelesaiObj.getTime() - r.konsulExtraMenit * 60000);

        return {
          ...r,
          _id: `${r._id}_extra`, 
          jenisSesi: TIPE_SESI.KONSUL, 
          namaMapel: `${r.namaMapel || "Umum"} (Extra)`, 
          waktuMulai: waktuMulaiObj.toISOString(),
          waktuSelesai: r.waktuSelesai
        };
      });

    const gabungan = [...konsulMurni, ...konsulExtra];
    gabungan.sort((a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai));

    return gabungan;
  }, [riwayat]);

  const opsiBulan = useMemo(() => [...new Set(riwayatKonsul.map(r => dapatkanLabelBulan(r.waktuMulai)))], [riwayatKonsul]);
  const opsiMapel = useMemo(() => [...new Set(riwayatKonsul.map(r => r.namaMapel || "Umum"))], [riwayatKonsul]);

  const konsulDitampilkan = useMemo(() => {
    return riwayatKonsul.filter(r => {
      const matchBulan = filterBulan ? dapatkanLabelBulan(r.waktuMulai) === filterBulan : true;
      const matchMapel = filterMapel ? (r.namaMapel || "Umum") === filterMapel : true;
      return matchBulan && matchMapel;
    });
  }, [riwayatKonsul, filterBulan, filterMapel]);

  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(konsulDitampilkan, page, ITEMS_PER_PAGE);

  return (
    <div className={styles.contentArea}>
      
      <HeaderKonsul />
      
      <FilterKonsul 
        filterBulan={filterBulan} 
        setFilterBulan={setFilterBulan} 
        opsiBulan={opsiBulan} 
        filterMapel={filterMapel} 
        setFilterMapel={setFilterMapel} 
        opsiMapel={opsiMapel} 
      />

      <div className={styles.containerRecord}>
        {dataHalIni.length === 0 ? (
          <div className={styles.wadahKosong} style={{ marginTop: '24px', padding: '40px', textAlign: 'center' }}>
            <FaBoxOpen className={styles.emptyIcon} />
            <p className={styles.emptyText}>Belum ada record konsul.</p>
          </div>
        ) : (
          dataHalIni.map(sesi => (
            <RecordCard 
              key={sesi._id} 
              sesi={sesi} 
              isOpen={idTerbuka === sesi._id} 
              onToggle={toggleDetail} 
            />
          ))
        )}

        <div style={{ marginTop: '24px'}}>
          <PaginationBar totalPages={totalPage} style={{ justifyContent: 'space-evenly'}}/>
        </div>

      </div>
    </div>
  );
}