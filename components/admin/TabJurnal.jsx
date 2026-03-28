"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";
import DetailJurnal from "./DetailJurnal";
import BrutalToast from "../ui/BrutalToast";

import { ambilDetailJurnal, simpanJurnal } from "../../actions/adminAction";
import { formatTanggal, formatYYYYMMDD, potongDataPagination } from "../../utils/formatHelper";
import { OPSI_KELAS, LIMIT_DATA } from "../../utils/constants";

import { FaBookBookmark, FaMagnifyingGlass } from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (DAFTAR JURNAL)
// ============================================================================
export default function TabJurnal({ dataJadwal = [], muatData }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // --- FILTER & PENCARIAN ---
  const [filterBulan, setFilterBulan] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [cariTopik, setCariTopik] = useState(""); 
  
  // --- STATE JURNAL TERPILIH ---
  const [selectedJadwalId, setSelectedJadwalId] = useState(null);
  const [detailJadwal, setDetailJadwal] = useState(null);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [formJurnal, setFormJurnal] = useState({ bab: "", subBab: "", galeriLink: "", fotoBersama: "" });
  
  // --- STATE UI & NOTIFIKASI ---
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [pesan, setPesan] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Reset pagination ke halaman 1 jika filter berubah
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filterBulan, filterKelas, cariTopik, pathname, replace, searchParams]);

  // --- HANDLER BUKA JURNAL ---
  const bukaJurnal = async (idJadwal) => {
    setSelectedJadwalId(idJadwal);
    setLoadingJurnal(true);
    setPesan("Menghubungi server...");

    const hasil = await ambilDetailJurnal(idJadwal);
    
    // 🛡️ Masuk ke .data dulu baru ambil jadwal & dataSiswa
    if (hasil.sukses && hasil.data) {
      const { jadwal, dataSiswa: listSiswa } = hasil.data;

      setDetailJadwal(jadwal);
      setDataSiswa(listSiswa);
      setFormJurnal({
        bab: jadwal.bab || "",
        subBab: jadwal.subBab || "",
        galeriLink: jadwal.galeriPapan?.join(", ") || "",
        fotoBersama: jadwal.fotoBersama || "" 
      });
      setPesan("");
    } else {
      setPesan(hasil.pesan || "Gagal memuat detail jurnal.");
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
    
    if (hasil.sukses) {
      if (typeof muatData === 'function') muatData();
      setToastMsg("✅ JURNAL BERHASIL DISIMPAN!");
    } else {
      setPesan(hasil.pesan);
    }
    setLoadingJurnal(false);
  };

  // --- MEMILAH DATA JADWAL UNTUK TABEL ---
  const jadwalTersedia = useMemo(() => {
    const hariIni = formatYYYYMMDD(new Date());
    let jadwal = (dataJadwal || []).filter(j => j.tanggal <= hariIni); 
    
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

  const { totalPage, dataTerpotong: jadwalHalIni } = potongDataPagination(jadwalTersedia, page, ITEMS_PER_PAGE);

  const renderDenganToast = (konten) => (
    <>
      {konten}
      {toastMsg && (
        <BrutalToast 
          pesan={toastMsg} 
          tipe="sukses" 
          onClose={() => {
            setToastMsg("");
            tutupJurnal();
          }} 
        />
      )}
    </>
  );

  // --- RENDER JIKA ADA JURNAL TERPILIH (DETAIL) ---
  if (selectedJadwalId) {
    if (loadingJurnal && !detailJadwal) {
      return renderDenganToast(
        <div className={styles.isiTab}>
          <p className={styles.messageProcess}>Mengumpulkan Arsip Kelas...</p>
        </div>
      );
    }

    return renderDenganToast(
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

  // --- RENDER TABEL UTAMA ---
  return renderDenganToast(
    <div className={`${styles.isiTab} ${styles.SembunyiPrint}`}>
      <div className={styles.headerTabWrapper}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}><FaBookBookmark /> Jurnal Kelas</h2>
      </div>

      <div className={styles.filterBar}>
        <span className={styles.labelFilter}>Filter:</span>
        <FilterInput type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />
        
        <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className={styles.filterSelectMurni}>
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

      <PaginationBar totalPages={totalPage} />
    </div>
  );
}