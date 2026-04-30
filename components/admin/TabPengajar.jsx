"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo, useRef } from "react"; 
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import PaginationBar from "../ui/PaginationBar";
// 🚀 FIX: Import FilterInput dan Icon Pencarian
import FilterInput from "../ui/FilterInput";
import { FaMagnifyingGlass } from "react-icons/fa6";

// ⚠️ Pastikan editPengajar dan prosesBulkTambahPengajar sudah ada di teacherAction.js
import { tambahPengajarBaru, hapusPengajar, editPengajar, prosesBulkTambahPengajar } from "../../actions/teacherAction";
import { potongDataPagination } from "../../utils/formatHelper";

// 👈 Import Konstanta Sistem
import { STATUS_USER, LIMIT_DATA, VALIDASI_SISTEM, KONFIGURASI_SISTEM } from "../../utils/constants";

import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB PENGAJAR)
// ============================================================================
export default function TabPengajar({ dataPengajar = [], muatData }) {
  // --- HOOKS UNTUK URL STATE ---
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  const fileInputRef = useRef(null);

  // Ambil halaman aktif langsung dari URL
  const page = Number(searchParams.get("page")) || 1;
  
  // 🚀 STATE BARU: PENCARIAN
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE: FORM PENGAJAR (🛡️ ZERO HARDCODE STATUS) ---
  const initialFormState = { 
    nama: "", 
    nomorPeserta: "", // ID Unik
    username: "", 
    password: "",     // Disamakan dengan form siswa (sebelumnya kataSandi)
    noHp: "", 
    kodePengajar: "", 
    status: STATUS_USER.AKTIF 
  };
  
  const [formPengajar, setFormPengajar] = useState(initialFormState);
  const [idEdit, setIdEdit] = useState(null); 
  const [loadingForm, setLoadingForm] = useState(false);
  const [pesanForm, setPesanForm] = useState("");

  // --- STATE UNTUK BULK UPLOAD ---
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [hasilBulk, setHasilBulk] = useState(null);

  // 🛡️ ZERO HARDCODE LIMIT
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // 🚀 FUNGSI BARU: Membersihkan parameter 'page' dari URL saat mencari
  const resetHalamanKeSatu = () => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  // --- LOGIKA BULK UPLOAD ---
  const unduhTemplate = () => {
    const header = "nama,nomorPeserta,kodePengajar,noHp,username,password\n";
    const contoh = `Baskoro Cahhyo,PG-001,BC,08123456789,baskoro_bc,${KONFIGURASI_SISTEM.DEFAULT_PASSWORD}`;
    const blob = new Blob([header + contoh], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_pengajar_quantum.csv';
    a.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    setIsBulkLoading(true);
    setHasilBulk(null);

    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split(/\r?\n/);
      const headers = rows[0].split(",").map(h => h.trim());
      
      const jsonData = rows.slice(1)
        .filter(row => row.trim() !== "")
        .map(row => {
          const values = row.split(",");
          return headers.reduce((obj, header, i) => {
            obj[header] = values[i]?.trim();
            return obj;
          }, {});
        });

      // Panggil fungsi bulk dari action
      const res = await prosesBulkTambahPengajar(jsonData);
      setIsBulkLoading(false);
      
      if (res.sukses) {
        setHasilBulk({ pesan: res.pesan, laporan: res.laporan || [] });
        if (typeof muatData === 'function') muatData();
      } else {
        alert(res.pesan);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // --- HANDLERS: CRUD ---
  const simpanPengajar = async (e) => { 
    e.preventDefault(); 
    
    // Validasi panjang password
    if (formPengajar.password && formPengajar.password.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesanForm(`⚠️ Sandi minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`);
      return;
    }
    
    setLoadingForm(true); 
    setPesanForm("Menyimpan..."); 
    
    let payloadPengajar = { ...formPengajar };
    
    if (!payloadPengajar.username || payloadPengajar.username.trim() === "") {
      payloadPengajar.username = payloadPengajar.kodePengajar || payloadPengajar.nomorPeserta;
    }

    try {
      const laporan = idEdit 
        ? await editPengajar(idEdit, payloadPengajar) 
        : await tambahPengajarBaru(payloadPengajar); 
      
      setPesanForm(laporan.pesan); 
      
      if (laporan.sukses) { 
        batalEdit(); 
        if(typeof muatData === 'function') muatData(); 
        setTimeout(() => setPesanForm(""), 3000);
      }
    } catch (error) {
      console.error("[ERROR simpanPengajar]:", error);
      setPesanForm("Gagal menghubungi server.");
    } finally {
      setLoadingForm(false); 
    }
  };
  
  const klikEditPengajar = (pengajar) => { 
    setIdEdit(pengajar._id); 
    setFormPengajar({ 
      nama: pengajar.nama, 
      nomorPeserta: pengajar.nomorPeserta || "", 
      username: pengajar.username || "", 
      password: "", // Kosongkan password saat edit agar tidak terubah jika tidak diisi
      noHp: pengajar.noHp || "", 
      kodePengajar: pengajar.kodePengajar || "", 
      status: pengajar.status || STATUS_USER.AKTIF 
    }); 
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const batalEdit = () => { 
    setIdEdit(null); 
    setFormPengajar(initialFormState); 
    if(!pesanForm.includes("Berhasil")) setPesanForm(""); 
  };
  
  const klikHapusPengajar = async (id, nama) => { 
    if (window.confirm(`Hapus akun pengajar ${nama}? Akun ini tidak akan bisa login lagi.`)) { 
      try {
        const hasil = await hapusPengajar(id);
        if(hasil.sukses) {
          if (typeof muatData === 'function') muatData(); 
        } else {
          alert("Gagal menghapus: " + hasil.pesan);
        }
      } catch (error) {
        console.error("[ERROR Hapus Pengajar]:", error);
      }
    } 
  };

  // --- LOGIKA FILTER & PAGINATION ---
  const pengajarDitampilkan = useMemo(() => {
    let listData = [...dataPengajar];
    
    // 🚀 FILTER PENCARIAN (Berdasarkan Nama, Kode, atau Username)
    if (searchQuery) {
      const kataKunci = searchQuery.toLowerCase();
      listData = listData.filter(g => 
        (g.nama && g.nama.toLowerCase().includes(kataKunci)) ||
        (g.kodePengajar && g.kodePengajar.toLowerCase().includes(kataKunci)) ||
        (g.username && g.username.toLowerCase().includes(kataKunci))
      );
    }
    
    return listData.sort((a, b) => a.nama.localeCompare(b.nama));
  }, [dataPengajar, searchQuery]);

  const { totalPage, dataTerpotong: dataPengajarHalIni } = potongDataPagination(pengajarDitampilkan, page, ITEMS_PER_PAGE);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahSiswa}`}>
      
      {/* PANEL KIRI: FORM PENGAJAR */}
      <div className={`${styles.formPanel} ${idEdit ? styles.formPanelEdit : styles.formPanelBiasa} ${styles.flexSatu}`}>
        <h3 className={idEdit ? styles.judulFormEdit : styles.judulFormPanel}>
          {idEdit ? "✏️ Edit Akun Pengajar" : "➕ Tambah Akun Pengajar"}
        </h3>
        
        <form onSubmit={simpanPengajar}>
          <input 
            type="text" placeholder="Nama Lengkap & Gelar" required 
            value={formPengajar.nama} onChange={e => setFormPengajar({...formPengajar, nama: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" placeholder="ID Unik / No Induk" required 
            value={formPengajar.nomorPeserta} onChange={e => setFormPengajar({...formPengajar, nomorPeserta: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" placeholder="Kode Pengajar (Cth: BC)" required 
            value={formPengajar.kodePengajar} onChange={e => setFormPengajar({...formPengajar, kodePengajar: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" placeholder="Username (Opsional)" 
            value={formPengajar.username} onChange={e => setFormPengajar({...formPengajar, username: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" placeholder="Nomor WA" required 
            value={formPengajar.noHp} onChange={e => setFormPengajar({...formPengajar, noHp: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder={idEdit ? "Kosongkan jika tak diubah" : `Sandi (Min ${VALIDASI_SISTEM.MIN_PASSWORD} char)`} 
            required={!idEdit} 
            value={formPengajar.password} onChange={e => setFormPengajar({...formPengajar, password: e.target.value})} 
            className={styles.formInput} 
          />
          <select 
            value={formPengajar.status} onChange={e => setFormPengajar({...formPengajar, status: e.target.value})} 
            className={styles.formInput} 
            style={{ fontWeight: '900', color: formPengajar.status === STATUS_USER.NONAKTIF ? '#ef4444' : '#15803d' }}
          >
            <option value={STATUS_USER.AKTIF}>🟢 Status: Aktif</option>
            <option value={STATUS_USER.NONAKTIF}>🔴 Status: Tidak Aktif (Blokir)</option>
          </select>

          <div className={styles.wadahTombolAksiForm}>
            {idEdit && (
              <button type="button" onClick={batalEdit} className={styles.tombolBatalForm}>Batal</button>
            )}
            <button type="submit" disabled={loadingForm} className={idEdit ? styles.tombolSimpanKuning : styles.tombolSimpanBiruBaru}>
              {loadingForm ? "..." : "Simpan"}
            </button>
          </div>

          {pesanForm && (
            <p className={`${styles.teksPesanForm} ${pesanForm.includes("Berhasil") || pesanForm.includes("Diperbarui") ? styles.teksPesanSukses : styles.teksPesanGagal}`}>
              {pesanForm}
            </p>
          )}
        </form>

        {/* --- UI BULK ACTIONS (Hanya Muncul Saat Mode Tambah) --- */}
        {!idEdit && (
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #ccc' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#111827', fontWeight: '900' }}>🚀 Pendaftaran Massal (CSV)</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={unduhTemplate} className={styles.tombolBatalForm} style={{ fontSize: '12px', flex: 1 }}>
                Unduh Template
              </button>
              <label className={styles.tombolSimpanBiruBaru} style={{ fontSize: '12px', flex: 2, textAlign: 'center', cursor: 'pointer', backgroundColor: '#111827' }}>
                {isBulkLoading ? "Memproses..." : "Upload CSV"}
                <input type="file" ref={fileInputRef} accept=".csv" hidden onChange={handleFileUpload} disabled={isBulkLoading} />
              </label>
            </div>
            
            {hasilBulk && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '2px solid #111827' }}>
                <p style={{ fontSize: '12px', fontWeight: '900', margin: 0 }}>{hasilBulk.pesan}</p>
                {hasilBulk.laporan && hasilBulk.laporan.length > 0 && (
                  <ul style={{ fontSize: '10px', marginTop: '8px', color: '#ef4444', paddingLeft: '15px', marginBottom: 0 }}>
                    {hasilBulk.laporan.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* PANEL KANAN: TABEL PENGAJAR */}
      <div className={styles.flexDua}>
        
        {/* 🚀 HEADER & PENCARIAN */}
        <div className={styles.headerTabSiswa} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 className={styles.judulTabelKanan} style={{ margin: 0 }}>Daftar Pengajar ({pengajarDitampilkan.length})</h3>
          
          <div style={{ position: 'relative', width: '250px' }}>
            <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#6b7280' }}>
              <FaMagnifyingGlass size={14} />
            </div>
            <FilterInput 
              type="text" 
              placeholder="Cari nama, kode, username..." 
              value={searchQuery} 
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetHalamanKeSatu();
              }} 
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        <div className={styles.wadahTabel}>
          <table className={styles.tabelStyle}>
            <thead>
              <tr>
                <th>Pengajar</th>
                <th>Akses & Kode</th>
                <th>Kontak</th>
                <th className={styles.kolomAksiKecil}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataPengajarHalIni.length === 0 ? (
                <tr><td colSpan="4" className={styles.selKosong}>{searchQuery ? "Pencarian tidak ditemukan." : "Tidak ada data pengajar."}</td></tr>
              ) : (
                dataPengajarHalIni.map(g => {
                  const isNonaktif = g.status === STATUS_USER.NONAKTIF;
                  return (
                    <tr key={g._id} style={{ opacity: isNonaktif ? 0.6 : 1 }}>
                      <td>
                        <p className={styles.teksNamaSiswa} style={{ color: isNonaktif ? '#ef4444' : 'inherit' }}>
                          {g.nama} {isNonaktif && '(Nonaktif)'}
                        </p>
                        <p className={styles.teksUsernameSiswa}>ID: {g.nomorPeserta || "-"}</p>
                      </td>
                      <td>
                        <p style={{margin: 0, fontWeight: '900'}}>@{g.username}</p>
                        <span className={styles.badgeStatus} style={{backgroundColor: '#fef08a', color: '#111827', fontSize: '10px'}}>
                          Kode: {g.kodePengajar || "-"}
                        </span>
                      </td>
                      <td>
                        <p style={{margin: 0, fontSize: '13px'}}>{g.noHp || "-"}</p>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <div className={styles.wadahAksiInlineHorizontal}>
                          <button onClick={() => klikEditPengajar(g)} className={`${styles.tombolAksi} ${styles.btnEdit}`}>Edit</button> 
                          <button onClick={() => klikHapusPengajar(g._id, g.nama)} className={`${styles.tombolAksi} ${styles.btnHapus}`}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* 🚀 PaginationBar dibungkus div agar punya jarak dengan tabel */}
        <div style={{ marginTop: '24px' }}>
          <PaginationBar totalPages={totalPage} />
        </div>
        
      </div>
    </div>
  );
}