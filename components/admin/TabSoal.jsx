"use client";

import { useState, useEffect, useMemo } from "react";
// 🚀 FIX: Import navigasi Next.js untuk Pagination
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { 
  ambilSemuaLatihanSoal, 
  prosesSimpanLatihanSoal, 
  prosesHapusLatihanSoal 
} from "../../actions/soalAction";
import { OPSI_KELAS } from "../../utils/constants";
import styles from "../../app/admin/AdminPage.module.css";
// 🚀 FIX: Tambah icon pencarian
import { FaBookOpen, FaLink, FaTrash, FaPenToSquare, FaMagnifyingGlass } from "react-icons/fa6";

// 🚀 FIX: Import amunisi UI kita
import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

export default function TabSoal({ dataSiswa = [] }) {
  // 🚀 SETUP URL-DRIVEN STATE
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dataSoal, setDataSoal] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [idEdit, setIdEdit] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  
  // 🚀 STATE FILTER PENCARIAN
  const [searchQuery, setSearchQuery] = useState("");
  const currentPage = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = 5; // Batas data per halaman

  const initialForm = {
    judul: "",
    url: "",
    tipeTarget: "KELAS",
    target: OPSI_KELAS[0] || "",
    isAktif: true
  };
  const [form, setForm] = useState(initialForm);

  // 🚀 FUNGSI PENAWAR BUG PAGINATION
  const resetHalamanKeSatu = () => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const muatData = async () => {
    setLoading(true);
    const res = await ambilSemuaLatihanSoal();
    if (res.sukses) setDataSoal(res.data);
    setLoading(false);
  };

  // 🚀 LOGIKA FILTERING & PENCARIAN DATA
  const dataFiltered = useMemo(() => {
    if (!searchQuery) return dataSoal;
    return dataSoal.filter(item => 
      item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dataSoal, searchQuery]);

  // 🚀 LOGIKA PAGINATION (MEMOTONG DATA)
  const totalPages = Math.ceil(dataFiltered.length / ITEMS_PER_PAGE) || 1;
  const dataPaginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return dataFiltered.slice(start, end);
  }, [dataFiltered, currentPage]);

  const handleSimpan = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    
    let finalTarget = form.target;
    if (form.tipeTarget === "SISWA" && !finalTarget) {
      alert("Silakan pilih siswa terlebih dahulu!");
      setLoadingForm(false);
      return;
    }

    let finalUrl = form.url;
    if (finalUrl.includes("drive.google.com") && finalUrl.includes("/view")) {
      finalUrl = finalUrl.split("/view")[0] + "/preview";
    }

    const res = await prosesSimpanLatihanSoal(idEdit, { ...form, target: finalTarget, url: finalUrl });
    
    if (res.sukses) {
      batalEdit();
      muatData();
    } else {
      alert(res.pesan);
    }
    setLoadingForm(false);
  };

  const klikEdit = (item) => {
    setIdEdit(item._id);
    setForm({
      judul: item.judul,
      url: item.url,
      tipeTarget: item.tipeTarget,
      target: item.target,
      isAktif: item.isAktif
    });
  };

  const batalEdit = () => {
    setIdEdit(null);
    setForm(initialForm);
  };

  const klikHapus = async (id, judul) => {
    if (window.confirm(`Yakin hapus link latihan: "${judul}"?`)) {
      const res = await prosesHapusLatihanSoal(id);
      if (res.sukses) muatData();
      else alert(res.pesan);
    }
  };

  const siswaUrut = [...dataSiswa].sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint}`} style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      
      {/* KIRI: FORM */}
      <div className={`${styles.formPanel} ${idEdit ? styles.formPanelEdit : styles.formPanelBiasa}`} style={{ flex: '1', minWidth: '300px', height: 'fit-content' }}>
        <h3 className={idEdit ? styles.judulFormEdit : styles.judulFormPanel}>
          {idEdit ? "✏️ Edit Latihan Soal" : "➕ Kirim Latihan Soal"}
        </h3>
        
        <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Judul Latihan</label>
            <input type="text" required value={form.judul} onChange={e => setForm({...form, judul: e.target.value})} placeholder="Cth: Latihan Trigonometri 1" className={styles.formInput} />
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>URL / Link Web</label>
            <input type="url" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="Cth: https://drive.google.com/..." className={styles.formInput} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Kirim Ke</label>
              <select value={form.tipeTarget} onChange={e => setForm({...form, tipeTarget: e.target.value, target: ""})} className={styles.formInput}>
                <option value="KELAS">Satu Kelas</option>
                <option value="SISWA">Siswa Spesifik</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Pilih Target</label>
              {form.tipeTarget === "KELAS" ? (
                <select required value={form.target} onChange={e => setForm({...form, target: e.target.value})} className={styles.formInput}>
                  <option value="" disabled>-- Pilih Kelas --</option>
                  {OPSI_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              ) : (
                <select required value={form.target} onChange={e => setForm({...form, target: e.target.value})} className={styles.formInput}>
                  <option value="" disabled>-- Pilih Siswa --</option>
                  {siswaUrut.map(s => (
                    <option key={s._id} value={s.username}>
                      {s.nama} ({s.kelas || "-"})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Status Link</label>
             <select value={form.isAktif ? "aktif" : "mati"} onChange={e => setForm({...form, isAktif: e.target.value === "aktif"})} className={styles.formInput}>
               <option value="aktif">🟢 Tampilkan di HP Siswa</option>
               <option value="mati">🔴 Matikan Sementara (Sembunyikan)</option>
             </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {idEdit && <button type="button" onClick={batalEdit} className={styles.tombolBatalForm}>Batal</button>}
            <button type="submit" disabled={loadingForm} className={idEdit ? styles.tombolSimpanKuning : styles.tombolSimpanBiruBaru} style={{ flex: 1 }}>
              {loadingForm ? "Menyimpan..." : (idEdit ? "Update Latihan" : "Kirim Latihan")}
            </button>
          </div>
        </form>
      </div>

      {/* KANAN: TABEL */}
      <div style={{ flex: '2', minWidth: '400px' }}>
        
        {/* HEADER & SEARCH BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>📚 Daftar Distribusi Soal</h3>
          
          <div style={{ position: 'relative', width: '250px' }}>
            <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#6b7280' }}>
              <FaMagnifyingGlass size={14} />
            </div>
            {/* 🚀 Menggunakan fungsi reset halaman saat mencari */}
            <FilterInput 
              value={searchQuery} 
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetHalamanKeSatu();
              }} 
              placeholder="Cari judul atau target..." 
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        <div className={styles.wadahTabel}>
          <table className={styles.tabelStyle}>
            <thead>
              <tr>
                <th>Latihan & URL</th>
                <th>Target Utama</th>
                <th style={{textAlign: 'center'}}>Status</th>
                <th style={{textAlign: 'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className={styles.selKosong}>Memuat data...</td></tr>
              ) : dataPaginated.length === 0 ? (
                <tr><td colSpan="4" className={styles.selKosong}>{searchQuery ? "Pencarian tidak ditemukan." : "Belum ada latihan soal yang dibagikan."}</td></tr>
              ) : (
                // 🚀 RENDER DATA YANG SUDAH DIPOTONG (dataPaginated)
                dataPaginated.map(item => (
                  <tr key={item._id}>
                    <td>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{item.judul}</p>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaLink /> Cek Link
                      </a>
                    </td>
                    <td>
                      <span style={{ backgroundColor: item.tipeTarget === "KELAS" ? '#dbeafe' : '#fef08a', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #111827' }}>
                        {item.tipeTarget === "KELAS" ? "KELAS" : "SISWA"}
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '900', fontSize: '14px' }}>{item.target}</p>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <span style={{ color: item.isAktif ? '#15803d' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                        {item.isAktif ? '🟢 Aktif' : '🔴 Dimatikan'}
                      </span>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <div className={styles.wadahAksiInlineHorizontal}>
                         <button onClick={() => klikEdit(item)} className={`${styles.tombolAksi} ${styles.btnEdit}`}><FaPenToSquare /></button>
                         <button onClick={() => klikHapus(item._id, item.judul)} className={`${styles.tombolAksi} ${styles.btnHapus}`}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🚀 RENDER PAGINATION BAR */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <PaginationBar totalPages={totalPages} />
        </div>
        
      </div>
    </div>
  );
}