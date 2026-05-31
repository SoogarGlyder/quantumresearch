"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo, useRef } from "react"; 
import PaginationBar from "../ui/PaginationBar";
import FilterInput from "../ui/FilterInput";
import { FaMagnifyingGlass } from "react-icons/fa6";

import { tambahPengajarBaru, hapusPengajar, editPengajar, prosesBulkTambahPengajar } from "../../actions/teacherAction";
import { potongDataPagination, formatHelper } from "@/utils/formatHelper";

import { STATUS_USER, LIMIT_DATA, VALIDASI_SISTEM, KONFIGURASI_SISTEM, PANGKAT_PENGAJAR, OPSI_KELAS } from "../../utils/constants";
import styles from "../../app/admin/AdminPage.module.css";

//  FIX: Import Rapor Pengajar
import ModalRaporPengajar from "./ModalRaporPengajar";

// ============================================================================
// 2. MAIN COMPONENT (TAB PENGAJAR)
// ============================================================================
export default function TabPengajar({ dataPengajar = [], muatData }) {
  
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  const initialFormState = { 
    nama: "", 
    nomorPeserta: "", 
    username: "", 
    password: "",     
    noHp: "", 
    kodePengajar: "", 
    pangkat: PANGKAT_PENGAJAR.FREELANCE, 
    kelasAsuh: [], 
    status: STATUS_USER.AKTIF 
  };
  
  const [formPengajar, setFormPengajar] = useState(initialFormState);
  const [idEdit, setIdEdit] = useState(null); 
  const [loadingForm, setLoadingForm] = useState(false);
  const [pesanForm, setPesanForm] = useState("");

  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [hasilBulk, setHasilBulk] = useState(null);

  //  FIX: State untuk menyimpan data guru yang rapor-nya sedang dibuka
  const [pengajarRapor, setPengajarRapor] = useState(null);

  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  const resetHalamanKeSatu = () => {
    setPage(1);
  };

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

      const res = await prosesBulkTambahPengajar(jsonData);
      setIsBulkLoading(false);
      
      if (res.ok) {
        setHasilBulk({ pesan: res.pesan, laporan: res.laporan || [] });
        if (typeof muatData === 'function') muatData();
      } else {
        alert(res.pesan);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleKelasAsuhChange = (kelas) => {
    setFormPengajar(prev => {
      const isSelected = prev.kelasAsuh.includes(kelas);
      const newKelasAsuh = isSelected 
        ? prev.kelasAsuh.filter(k => k !== kelas) 
        : [...prev.kelasAsuh, kelas]; 
      return { ...prev, kelasAsuh: newKelasAsuh };
    });
  };

  const simpanPengajar = async (e) => { 
    e.preventDefault(); 
    
    if (formPengajar.password && formPengajar.password.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesanForm(`⚠️ Sandi minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`);
      return;
    }
    
    setLoadingForm(true); 
    setPesanForm("Menyimpan..."); 
    
    let payloadPengajar = { ...formPengajar };
    
    if (payloadPengajar.pangkat !== PANGKAT_PENGAJAR.KAKAK_ASUH) {
      payloadPengajar.kelasAsuh = [];
    }

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
      password: "", 
      noHp: pengajar.noHp || "", 
      kodePengajar: pengajar.kodePengajar || "", 
      pangkat: pengajar.pangkat || PANGKAT_PENGAJAR.FREELANCE, 
      kelasAsuh: pengajar.kelasAsuh || [], 
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

  const pengajarDitampilkan = useMemo(() => {
    let listData = [...dataPengajar];
    
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

  const { totalPage, dataTerpotong: dataPengajarHalIni } = formatHelper.potongDataPagination(pengajarDitampilkan, page, ITEMS_PER_PAGE);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahSiswa}`}>
      
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" placeholder="No Induk/ID" required 
              value={formPengajar.nomorPeserta} onChange={e => setFormPengajar({...formPengajar, nomorPeserta: e.target.value})} 
              className={styles.formInput} style={{ flex: 2 }}
            />
            <input 
              type="text" placeholder="Kode (BC)" required 
              value={formPengajar.kodePengajar} onChange={e => setFormPengajar({...formPengajar, kodePengajar: e.target.value})} 
              className={styles.formInput} style={{ flex: 1 }}
            />
          </div>
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

          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '12px' }}>Pangkat / Peran:</label>
          <select 
            value={formPengajar.pangkat} 
            onChange={e => setFormPengajar({...formPengajar, pangkat: e.target.value})} 
            className={styles.formInput} 
            style={{ 
              fontWeight: '900', 
              backgroundColor: formPengajar.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH ? '#f3e8ff' : (formPengajar.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK ? '#dbeafe' : '#f8fafc') 
            }}
          >
            <option value={PANGKAT_PENGAJAR.FREELANCE}>👨‍🏫 Pengajar Freelance</option>
            <option value={PANGKAT_PENGAJAR.TETAP}>👨‍🏫 Pengajar Tetap</option>
            <option value={PANGKAT_PENGAJAR.KAKAK_ASUH}>🦸‍♂️ Kakak Asuh (Wali Kelas)</option>
            <option value={PANGKAT_PENGAJAR.STAFF_AKADEMIK}>🛡️ Staff Akademik (Admin Cabang)</option>
          </select>

          {formPengajar.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH && (
            <div style={{ marginTop: '10px', marginBottom: '16px', padding: '12px', border: '3px solid #111827', borderRadius: '12px', backgroundColor: '#fdf4ff', boxShadow: '4px 4px 0 #111827' }}>
              <label style={{ fontSize: '13px', fontWeight: '900', display: 'block', marginBottom: '10px', color: '#111827' }}>Pilih Kelas Tanggung Jawab:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {OPSI_KELAS.map(kelas => (
                  <label key={kelas} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: 'white', padding: '6px 10px', borderRadius: '6px', border: '2px solid #cbd5e1' }}>
                    <input 
                      type="checkbox" 
                      checked={formPengajar.kelasAsuh.includes(kelas)}
                      onChange={() => handleKelasAsuhChange(kelas)}
                      style={{ accentColor: '#c084fc', transform: 'scale(1.2)' }}
                    />
                    {kelas}
                  </label>
                ))}
              </div>
              {formPengajar.kelasAsuh.length === 0 && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', fontWeight: 'bold', margin: '8px 0 0 0' }}>⚠️ Minimal pilih satu kelas asuh.</p>
              )}
            </div>
          )}

          <select 
            value={formPengajar.status} onChange={e => setFormPengajar({...formPengajar, status: e.target.value})} 
            className={styles.formInput} 
            style={{ fontWeight: '900', color: formPengajar.status === STATUS_USER.NONAKTIF ? '#ef4444' : '#15803d', marginTop: '12px' }}
          >
            <option value={STATUS_USER.AKTIF}>🟢 Status: Aktif</option>
            <option value={STATUS_USER.NONAKTIF}>🔴 Status: Tidak Aktif (Blokir)</option>
          </select>

          <div className={styles.wadahTombolAksiForm}>
            {idEdit && (
              <button type="button" onClick={batalEdit} className={styles.tombolBatalForm}>Batal</button>
            )}
            <button type="submit" disabled={loadingForm || (formPengajar.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH && formPengajar.kelasAsuh.length === 0)} className={idEdit ? styles.tombolSimpanKuning : styles.tombolSimpanBiruBaru}>
              {loadingForm ? "..." : "Simpan"}
            </button>
          </div>

          {pesanForm && (
            <p className={`${styles.teksPesanForm} ${pesanForm.includes("Berhasil") || pesanForm.includes("Diperbarui") ? styles.teksPesanSukses : styles.teksPesanGagal}`}>
              {pesanForm}
            </p>
          )}
        </form>

        {!idEdit && (
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #ccc' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#111827', fontWeight: '900' }}>Pendaftaran Massal (CSV)</h4>
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
      
      <div className={styles.flexDua}>
        
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
                <th>Otoritas & Kode</th>
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
                  
                  let bgBaris = 'transparent';
                  let bgBadge = '#e5e7eb';
                  let colorBadge = '#111827';
                  
                  if (g.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH) {
                    bgBaris = '#faf5ff'; bgBadge = '#c084fc'; colorBadge = 'white';
                  } else if (g.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK) {
                    bgBaris = '#eff6ff'; bgBadge = '#3b82f6'; colorBadge = 'white';
                  }

                  return (
                    <tr key={g._id} style={{ opacity: isNonaktif ? 0.6 : 1, backgroundColor: bgBaris }}>
                      <td>
                        <p className={styles.teksNamaSiswa} style={{ color: isNonaktif ? '#ef4444' : '#111827' }}>
                          {g.nama} {isNonaktif && '(Nonaktif)'}
                        </p>
                        <p className={styles.teksUsernameSiswa}>ID: {g.nomorPeserta || "-"}</p>
                      </td>
                      <td>
                        <p style={{margin: 0, fontWeight: '900', color: '#111827'}}>@{g.username}</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                          <span className={styles.badgeStatus} style={{backgroundColor: '#fef08a', color: '#111827', fontSize: '10px', padding: '2px 6px'}}>
                            Kode: {g.kodePengajar || "-"}
                          </span>
                          <span className={styles.badgeStatus} style={{backgroundColor: bgBadge, color: colorBadge, fontSize: '10px', padding: '2px 6px', fontWeight: '900'}}>
                            {g.pangkat?.replace('_', ' ') || "FREELANCE"}
                          </span>
                        </div>
                        {g.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH && g.kelasAsuh?.length > 0 && (
                          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9333ea', margin: '6px 0 0 0', lineHeight: '1.4' }}>
                            Asuh: {g.kelasAsuh.join(", ")}
                          </p>
                        )}
                      </td>
                      <td>
                        <p style={{margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#4b5563'}}>{g.noHp || "-"}</p>
                      </td>
                      <td style={{textAlign:'center'}}>
                        {/*  FIX: Tambahkan tombol Rapor di samping tombol Edit/Hapus */}
                        <div className={styles.wadahAksiInlineHorizontal} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button onClick={() => klikEditPengajar(g)} className={`${styles.tombolAksi} ${styles.btnEdit}`}>Edit</button> 
                          <button onClick={() => klikHapusPengajar(g._id, g.nama)} className={`${styles.tombolAksi} ${styles.btnHapus}`}>Hapus</button>
                          <button onClick={() => setPengajarRapor(g)} className={styles.tombolAksi} style={{ backgroundColor: '#3b82f6', color: 'white'}}>Rapor</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '24px' }}>
          <PaginationBar totalPages={totalPage} currentPage={page} onPageChange={setPage} />
        </div>
        
      </div>
      
      {/*  FIX: Komponen Modal Rapor di-mount di bagian paling bawah */}
      {pengajarRapor && (
        <ModalRaporPengajar 
          pengajar={pengajarRapor} 
          onClose={() => setPengajarRapor(null)} 
        />
      )}
    </div>
  );
}