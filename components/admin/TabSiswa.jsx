"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo } from "react"; 
// 👇 Import navigasi Next.js untuk URL State
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import PaginationBar from "../ui/PaginationBar";

import { editAkunSiswa, hapusAkunSiswa } from "../../actions/adminAction";
import { prosesTambahSiswa } from "../../actions/authAction";
import { potongDataPagination } from "../../utils/formatHelper";
import { OPSI_KELAS } from "../../utils/constants"; 

import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB SISWA)
// ============================================================================
export default function TabSiswa({ dataSiswa = [], muatData }) {
  // --- HOOKS UNTUK URL STATE (Poin 9) ---
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

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
    status: "aktif" 
  };
  
  const [formSiswa, setFormSiswa] = useState(initialFormState);
  const [idEdit, setIdEdit] = useState(null); 
  const [loadingForm, setLoadingForm] = useState(false);
  const [pesanForm, setPesanForm] = useState("");

  // --- STATE: FILTER ---
  const [filterKelas, setFilterKelas] = useState("");
  const ITEMS_PER_PAGE = 20;

  // SINKRONISASI FILTER: Jika filter kelas berubah, reset halaman ke 1 di URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filterKelas]);

  // --- HANDLERS: CRUD ---
  const simpanSiswa = async (e) => { 
    e.preventDefault(); 
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
      status: siswa.status || "aktif" 
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

  // Menggunakan 'page' yang ditarik dari URL
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
            placeholder={idEdit ? "Kosongkan jika tidak ubah sandi" : "Kata Sandi"} 
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
            style={{ fontWeight: '900', color: formSiswa.status === 'tidak aktif' ? '#ef4444' : '#15803d' }}
          >
            <option value="aktif">🟢 Status: Aktif</option>
            <option value="tidak aktif">🔴 Status: Tidak Aktif (Blokir Login)</option>
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
      </div>
      
      {/* PANEL KANAN: TABEL SISWA */}
      <div className={styles.flexDua}>
        <div className={styles.headerTabSiswa}>
          <h3 className={styles.judulTabelKanan}>Daftar Siswa ({siswaDitampilkan.length})</h3>
          <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className={styles.filterSelectMurni}>
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
                <th>Kelas & Status</th>
                <th className={styles.kolomAksiKecil}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataSiswaHalIni.length === 0 ? (
                <tr><td colSpan="4" className={styles.selKosong}>Tidak ada data siswa.</td></tr>
              ) : (
                dataSiswaHalIni.map(s => {
                  const isNonaktif = s.status === 'tidak aktif';
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
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          backgroundColor: isNonaktif ? '#fee2e2' : '#dcfce3', 
                          color: isNonaktif ? '#b91c1c' : '#15803d', 
                          border: `1px solid ${isNonaktif ? '#ef4444' : '#22c55e'}`,
                          display: 'inline-block',
                          marginTop: '4px'
                        }}>
                          {isNonaktif ? '🔴 Tidak Aktif' : '🟢 Aktif'}
                        </span>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <div className={styles.wadahAksiInlineHorizontal}>
                          <button onClick={() => klikEditSiswa(s)} className={`${styles.tombolAksi} ${styles.btnEdit}`}>Edit</button> 
                          <button onClick={() => klikHapusSiswa(s._id, s.nama)} className={`${styles.tombolAksi} ${styles.btnHapus}`}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* PaginationBar mandiri membaca URL */}
        <PaginationBar totalPages={totalPage} />
      </div>
    </div>
  );
}