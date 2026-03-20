"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react";
// 👇 Import navigasi Next.js
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";
import DetailJurnal from "./DetailJurnal";

import { ambilDetailJurnal, simpanJurnal } from "../../actions/adminAction";
import { formatTanggal, formatYYYYMMDD, potongDataPagination } from "../../utils/formatHelper";
import { OPSI_KELAS } from "../../utils/constants";

import { FaBookBookmark, FaMagnifyingGlass } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (DAFTAR JURNAL)
// ============================================================================
export default function TabJurnal({ dataJadwal, muatData }) {
  // --- HOOKS UNTUK URL STATE (Poin 9) ---
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Ambil halaman aktif langsung dari URL (Default ke 1)
  const page = Number(searchParams.get("page")) || 1;

  const [filterBulan, setFilterBulan] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [cariTopik, setCariTopik] = useState(""); 
  const ITEMS_PER_PAGE = 20;

  const [selectedJadwalId, setSelectedJadwalId] = useState(null);
  const [detailJadwal, setDetailJadwal] = useState(null);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [formJurnal, setFormJurnal] = useState({ bab: "", subBab: "", galeriLink: "", fotoBersama: "" });
  
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [pesan, setPesan] = useState("");

  // SINKRONISASI FILTER: Jika kriteria pencarian berubah, reset URL page ke 1
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filterBulan, filterKelas, cariTopik]);

  const jadwalTersedia = useMemo(() => {
    const hariIni = formatYYYYMMDD(new Date());

    let jadwal = dataJadwal.filter(j => j.tanggal <= hariIni); 
    
    if (filterBulan) jadwal = jadwal.filter(j => j.tanggal.startsWith(filterBulan));
    if (filterKelas) jadwal = jadwal.filter(j => j.kelasTarget === filterKelas);
    if (cariTopik) {
      const keyword = cariTopik.toLowerCase();
      jadwal = jadwal.filter(j => 
        (j.bab && j.bab.toLowerCase().includes(keyword)) || 
        (j.subBab && j.subBab.toLowerCase().includes(keyword)) ||
        (j.mapel && j.mapel.toLowerCase().includes(keyword))
      );
    }

    return jadwal.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [dataJadwal, filterBulan, filterKelas, cariTopik]);

  // Menggunakan 'page' yang ditarik dari URL
  const { totalPage, dataTerpotong: jadwalHalIni } = potongDataPagination(jadwalTersedia, page, ITEMS_PER_PAGE);

  const bukaJurnal = async (idJadwal) => {
    setSelectedJadwalId(idJadwal);
    setLoadingJurnal(true);
    setPesan("Menghubungi server...");

    const hasil = await ambilDetailJurnal(idJadwal);
    if (hasil.sukses) {
      setDetailJadwal(hasil.jadwal);
      setDataSiswa(hasil.dataSiswa);
      setFormJurnal({
        bab: hasil.jadwal.bab || "",
        subBab: hasil.jadwal.subBab || "",
        galeriLink: hasil.jadwal.galeriPapan?.join(", ") || "",
        fotoBersama: hasil.jadwal.fotoBersama || "" 
      });
      setPesan("");
    } else {
      setPesan(hasil.pesan);
    }
    setLoadingJurnal(false);
  };

  const tutupJurnal = () => {
    setSelectedJadwalId(null);
    setDetailJadwal(null);
    setDataSiswa([]);
    setPesan("");
  };

  const prosesSimpanJurnal = async (e) => {
    e.preventDefault();
    setLoadingJurnal(true);
    setPesan("Menyimpan ke database...");

    const arrayGaleri = formJurnal.galeriLink.trim() !== "" ? formJurnal.galeriLink.split(",").map(link => link.trim()) : [];
    const payloadJurnal = { bab: formJurnal.bab, subBab: formJurnal.subBab, galeriPapan: arrayGaleri, fotoBersama: formJurnal.fotoBersama };

    const hasil = await simpanJurnal(selectedJadwalId, payloadJurnal, dataSiswa);
    setPesan(hasil.pesan);

    if (hasil.sukses) {
      if (typeof muatData === 'function') muatData();
      setTimeout(() => tutupJurnal(), 1500);
    } else {
      setLoadingJurnal(false);
    }
  };

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  if (selectedJadwalId) {
    if (loadingJurnal && !detailJadwal) {
      return (
        <div className={styles.isiTab}>
          <p className={styles.teksPesanMemproses}>Mengumpulkan Arsip Kelas...</p>
        </div>
      );
    }

    return (
      <DetailJurnal 
        detailJadwal={detailJadwal} 
        dataSiswa={dataSiswa} 
        setDataSiswa={setDataSiswa}
        formJurnal={formJurnal}
        setFormJurnal={setFormJurnal}
        tutupJurnal={tutupJurnal}
        prosesSimpanJurnal={prosesSimpanJurnal}
        loadingJurnal={loadingJurnal}
        pesan={pesan}
      />
    );
  }

  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint}`}>
      
      {/* HEADER & FILTER */}
      <div className={styles.headerTabWrapper}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}><FaBookBookmark /> Jurnal Kelas & LMS</h2>
      </div>

      <div className={styles.filterBar}>
        <span className={styles.labelFilter}>Filter:</span>
        <FilterInput type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />
        
        <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className={styles.filterSelect}>
          <option value="">Semua Kelas</option>
          {OPSI_KELAS.map(opsi => <option key={opsi} value={opsi}>{opsi}</option>)}
        </select>
        
        <div className={styles.wadahCari}>
          <div className={styles.iconCari}><FaMagnifyingGlass /></div>
          <input 
            type="text" 
            placeholder="Cari Bab / Materi..." 
            value={cariTopik} 
            onChange={(e) => setCariTopik(e.target.value)} 
            className={styles.inputCari}
          />
        </div>
        
        <button onClick={() => { setFilterBulan(""); setFilterKelas(""); setCariTopik(""); }} className={styles.btnReset}>Reset</button>
      </div>

      {/* TABEL JURNAL */}
      <div className={styles.wadahTabel}>
        <table className={styles.tabelStyle}>
          <thead>
            <tr>
              <th>Tanggal & Waktu</th>
              <th>Mapel & Kelas</th>
              <th>Bab Tersimpan</th>
              <th style={{textAlign: 'center'}}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {jadwalHalIni.length === 0 ? (
              <tr><td colSpan="4" className={styles.selKosong}>Belum ada kelas yang selesai.</td></tr>
            ) : (
              jadwalHalIni.map(j => (
                <tr key={j._id} onClick={() => bukaJurnal(j._id)} className={styles.barisTabelKlik}>
                  <td>
                    <p className={styles.teksTanggal}>{formatTanggal(j.tanggal)}</p>
                    <p className={styles.teksJamPudar}>{j.jamMulai} - {j.jamSelesai}</p>
                  </td>
                  <td>
                    <p className={styles.teksMapel}>{j.mapel}</p>
                    <p className={styles.teksKelas}>{j.kelasTarget}</p>
                  </td>
                  <td>
                    {j.bab ? (
                      <span style={{ fontWeight: '900', color: '#2563eb' }}>{j.bab}</span> 
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic', fontWeight: 'bold' }}>Belum diisi</span>
                    )}
                  </td>
                  <td style={{textAlign: 'center'}}>
                    <button className={styles.tombolAksi} style={{ backgroundColor: '#111827', color: 'white' }}>Isi / Cetak</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PaginationBar sekarang mandiri membaca URL */}
      <PaginationBar totalPages={totalPage} />
    </div>
  );
}