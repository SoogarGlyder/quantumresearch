"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import PaginationBar from "../ui/PaginationBar";
import ModalRaporSiswa from "./ModalRaporSiswa";

import { editAkunSiswa, hapusAkunSiswa } from "../../actions/adminAction";
import { prosesTambahSiswa, prosesBulkTambahSiswa } from "../../actions/authAction";
import { potongDataPagination } from "../../utils/formatHelper";

import { OPSI_KELAS, STATUS_USER, LIMIT_DATA, VALIDASI_SISTEM, KONFIGURASI_SISTEM } from "../../utils/constants"; 

import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB SISWA)
// ============================================================================
export default function TabSiswa({ dataSiswa = [], muatData }) {
  // --- HOOKS UNTUK URL STATE ---
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  const fileInputRef = useRef(null);

  // Ambil halaman aktif langsung dari URL (Default ke 1)
  const page = Number(searchParams.get("page")) || 1;
  
  // --- STATE: FORM SISWA ---
  const initialFormState = { 
    nama: "", 
    nomorPeserta: "", 
    username: "", 
    password: "", 
    noHp: "", 
    kelas: "", 
    jadwalKelas: "", 
    jamKelas: "", 
    status: STATUS_USER.AKTIF 
  };
  
  const [formSiswa, setFormSiswa] = useState(initialFormState);
  const [idEdit, setIdEdit] = useState(null); 
  const [loadingForm, setLoadingForm] = useState(false);
  const [pesanForm, setPesanForm] = useState("");

  // --- STATE UNTUK BULK UPLOAD ---
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [hasilBulk, setHasilBulk] = useState(null);

  // --- STATE: FILTER & CETAK RAPOR ---
  const [filterKelas, setFilterKelas] = useState("");
  const [siswaCetak, setSiswaCetak] = useState(null);
  
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // ============================================================================
  // 🚀 PERBAIKAN: HANDLER GANTI FILTER (PENGGANTI useEffect)
  // ============================================================================
  const handleGantiFilterKelas = (e) => {
    setFilterKelas(e.target.value);
    
    // Setiap kali filter diubah, bersihkan parameter 'page' dari URL agar kembali ke halaman 1
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  // --- LOGIKA BULK UPLOAD ---
  const unduhTemplate = () => {
    const header = "nama,nomorPeserta,noHp,kelas,username,password\n";
    const contoh = `Budi Santoso,QTM-001,08123456789,10 SMA,budi_qtm,${KONFIGURASI_SISTEM.DEFAULT_PASSWORD}`;
    const blob = new Blob([header + contoh], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_siswa_quantum.csv';
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

      const res = await prosesBulkTambahSiswa(jsonData);
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
  const simpanSiswa = async (e) => { 
    e.preventDefault(); 
    
    if (formSiswa.password && formSiswa.password.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesanForm(`⚠️ Sandi minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`);
      return;
    }
    
    setLoadingForm(true); 
    setPesanForm("Menyimpan..."); 
    
    let payloadSiswa = { ...formSiswa };
    
    if (!payloadSiswa.username || payloadSiswa.username.trim() === "") {
      payloadSiswa.username = payloadSiswa.nomorPeserta;
    }

    try {
      const laporan = idEdit 
        ? await editAkunSiswa(idEdit, payloadSiswa) 
        : await prosesTambahSiswa(payloadSiswa); 
      
      setPesanForm(laporan.pesan); 
      
      if (laporan.sukses) { 
        batalEdit(); 
        if(typeof muatData === 'function') muatData(); 
        setTimeout(() => setPesanForm(""), 3000);
      }
    } catch (error) {
      console.error("[ERROR simpanSiswa]:", error);
      setPesanForm("Gagal menghubungi server.");
    } finally {
      setLoadingForm(false); 
    }
  };
  
  const klikEditSiswa = (siswa) => { 
    setIdEdit(siswa._id); 
    setFormSiswa({ 
      nama: siswa.nama, 
      nomorPeserta: siswa.nomorPeserta || "", 
      username: siswa.username || "", 
      password: "",
      noHp: siswa.noHp || "", 
      kelas: (!siswa.kelas || siswa.kelas === "-") ? "" : siswa.kelas, 
      jadwalKelas: (!siswa.jadwalKelas || siswa.jadwalKelas === "-") ? "" : siswa.jadwalKelas, 
      jamKelas: (!siswa.jamKelas || siswa.jamKelas === "-") ? "" : siswa.jamKelas,
      status: siswa.status || STATUS_USER.AKTIF 
    }); 
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const batalEdit = () => { 
    setIdEdit(null); 
    setFormSiswa(initialFormState); 
    if(!pesanForm.includes("Berhasil")) setPesanForm(""); 
  };
  
  const klikHapusSiswa = async (id, nama) => { 
    if (window.confirm(`Yakin menghapus siswa ${nama}? Semua riwayat belajarnya juga akan hilang!`)) { 
      try {
        const hasil = await hapusAkunSiswa(id);
        if(hasil.sukses) {
          if (typeof muatData === 'function') muatData(); 
        } else {
          alert("Gagal menghapus: " + hasil.pesan);
        }
      } catch (error) {
        console.error("[ERROR Hapus Siswa]:", error);
      }
    } 
  };

  // --- LOGIKA FILTER SISWA ---
  const siswaDitampilkan = useMemo(() => {
    let siswa = [...dataSiswa];
    
    if (filterKelas) {
      siswa = siswa.filter(s => s.kelas === filterKelas);
    }
    
    siswa.sort((a, b) => {
      const npA = a.nomorPeserta || "";
      const npB = b.nomorPeserta || "";
      return npA.localeCompare(npB, undefined, { numeric: true, sensitivity: 'base' });
    });

    return siswa;
  }, [dataSiswa, filterKelas]);

  const { totalPage, dataTerpotong: dataSiswaHalIni } = potongDataPagination(siswaDitampilkan, page, ITEMS_PER_PAGE);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahSiswa}`}>
      
      {/* PANEL KIRI: FORM SISWA */}
      <div className={`${styles.formPanel} ${idEdit ? styles.formPanelEdit : styles.formPanelBiasa} ${styles.flexSatu}`}>
        <h3 className={idEdit ? styles.judulFormEdit : styles.judulFormPanel}>
          {idEdit ? "✏️ Edit Akun Siswa" : "➕ Tambah Akun Siswa"}
        </h3>
        
        <form onSubmit={simpanSiswa}>
          <input 
            type="text" 
            placeholder="Nama Lengkap" 
            required 
            value={formSiswa.nama} 
            onChange={e => setFormSiswa({...formSiswa, nama: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder="No Peserta Resmi" 
            required 
            value={formSiswa.nomorPeserta} 
            onChange={e => setFormSiswa({...formSiswa, nomorPeserta: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder="Username (Opsional, def: No Peserta)" 
            value={formSiswa.username} 
            onChange={e => setFormSiswa({...formSiswa, username: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder="Nomor WA" 
            required 
            value={formSiswa.noHp} 
            onChange={e => setFormSiswa({...formSiswa, noHp: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder={idEdit ? "Kosongkan jika tak diubah" : `Sandi (Min ${VALIDASI_SISTEM.MIN_PASSWORD} char, Def: No HP)`} 
            required={!idEdit} 
            value={formSiswa.password} 
            onChange={e => setFormSiswa({...formSiswa, password: e.target.value})} 
            className={styles.formInput} 
          />
          <select 
            value={formSiswa.kelas} 
            onChange={e => setFormSiswa({...formSiswa, kelas: e.target.value})} 
            className={styles.formInput}
          >
            <option value="">-- Pilih Kelas --</option>
            {OPSI_KELAS.map((opsiKls) => (
              <option key={opsiKls} value={opsiKls}>{opsiKls}</option>
            ))}
          </select>
          <select 
            value={formSiswa.status} 
            onChange={e => setFormSiswa({...formSiswa, status: e.target.value})} 
            className={styles.formInput} 
            style={{ fontWeight: '900', color: formSiswa.status === STATUS_USER.NONAKTIF ? '#ef4444' : '#15803d' }}
          >
            <option value={STATUS_USER.AKTIF}>🟢 Status: Aktif</option>
            <option value={STATUS_USER.NONAKTIF}>🔴 Status: Tidak Aktif (Blokir Login)</option>
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
            <p className={`${styles.teksPesanForm} ${pesanForm.includes("Berhasil") ? styles.teksPesanSukses : styles.teksPesanGagal}`}>
              {pesanForm}
            </p>
          )}
        </form>

        {/* --- UI BULK ACTIONS --- */}
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
      
      {/* PANEL KANAN: TABEL SISWA */}
      <div className={styles.flexDua}>
        <div className={styles.headerTabSiswa}>
          <h3 className={styles.judulTabelKanan}>Daftar Siswa ({siswaDitampilkan.length})</h3>
          {/* 🚀 PERBAIKAN: Menggunakan handleGantiFilterKelas di sini */}
          <select value={filterKelas} onChange={handleGantiFilterKelas} className={styles.filterSelectMurni}>
            <option value="">Semua Kelas</option>
            {OPSI_KELAS.map((opsiKls) => (
              <option key={opsiKls} value={opsiKls}>{opsiKls}</option>
            ))}
          </select>
        </div>

        <div className={styles.wadahTabel}>
          <table className={styles.tabelStyle}>
            <thead>
              <tr>
                <th>Akun</th>
                <th>Kontak</th>
                <th>Kelas</th>
                <th className={styles.kolomAksiKecil}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataSiswaHalIni.length === 0 ? (
                <tr><td colSpan="4" className={styles.selKosong}>Tidak ada data siswa.</td></tr>
              ) : (
                dataSiswaHalIni.map(s => {
                  const isNonaktif = s.status === STATUS_USER.NONAKTIF;
                  return (
                    <tr key={s._id} style={{ opacity: isNonaktif ? 0.6 : 1 }}>
                      <td>
                        <p className={styles.teksNamaSiswa} style={{ color: isNonaktif ? '#ef4444' : 'inherit' }}>
                          {s.nama} {isNonaktif && '(Nonaktif)'}
                        </p>
                        <p className={styles.teksUsernameSiswa}>ID: {s.nomorPeserta || "-"} | @{s.username}</p>
                      </td>
                      <td>{s.noHp}</td>
                      <td>
                        <p style={{ margin: 0, fontWeight: '900' }}>{s.kelas || "-"}</p>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <div className={styles.wadahAksiInlineHorizontal}>
                          <button onClick={() => klikEditSiswa(s)} className={`${styles.tombolAksi} ${styles.btnEdit}`}>Edit</button> 
                          <button onClick={() => klikHapusSiswa(s._id, s.nama)} className={`${styles.tombolAksi} ${styles.btnHapus}`}>Hapus</button>
                          <button onClick={() => setSiswaCetak(s)} className={`${styles.tombolAksi} ${styles.btnCetak}`} style={{ backgroundColor: '#111827', color: 'white' }}>Cetak</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        <PaginationBar totalPages={totalPage} />
      </div>

      {siswaCetak && (
        <ModalRaporSiswa siswa={siswaCetak} onClose={() => setSiswaCetak(null)} />
      )}
      
    </div>
  );
}