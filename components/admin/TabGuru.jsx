"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo } from "react"; 
import { useSearchParams } from "next/navigation";

import PaginationBar from "../ui/PaginationBar";
import { tambahGuruBaru, hapusGuru } from "../../actions/teacherAction";
import { potongDataPagination } from "../../utils/formatHelper";

// 👈 Import Konstanta Sistem
import { STATUS_USER, LIMIT_DATA, VALIDASI_SISTEM } from "../../utils/constants";

import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB GURU)
// ============================================================================
export default function TabGuru({ dataGuru = [], muatData }) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  
  // 🛡️ ZERO HARDCODE LIMIT
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // --- STATE: FORM GURU LENGKAP (🛡️ ZERO HARDCODE STATUS) ---
  const initialFormState = { 
    nama: "", 
    nomorPeserta: "", 
    username: "", 
    noHp: "", 
    kataSandi: "", 
    kodePengajar: "", 
    status: STATUS_USER.AKTIF 
  };
  
  const [formGuru, setFormGuru] = useState(initialFormState);
  const [loadingForm, setLoadingForm] = useState(false);
  const [pesanForm, setPesanForm] = useState("");

  // --- HANDLERS: CRUD ---
  const simpanGuru = async (e) => { 
    e.preventDefault(); 
    
    // 🛡️ Validasi Kata Sandi (jika diisi)
    if (formGuru.kataSandi && formGuru.kataSandi.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesanForm(`⚠️ Sandi minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`);
      return;
    }

    setLoadingForm(true); 
    setPesanForm("Memproses..."); 
    
    try {
      const res = await tambahGuruBaru(formGuru); 
      
      setPesanForm(res.pesan); 
      
      if (res.sukses) { 
        setFormGuru(initialFormState);
        if(typeof muatData === 'function') muatData(); 
        setTimeout(() => setPesanForm(""), 3000);
      }
    } catch (error) {
      setPesanForm("Gangguan koneksi server.");
    } finally {
      setLoadingForm(false); 
    }
  };
  
  const klikHapusGuru = async (id, nama) => { 
    if (window.confirm(`Hapus akun pengajar ${nama}? Akun ini tidak akan bisa login lagi.`)) { 
      try {
        const hasil = await hapusGuru(id);
        if(hasil.sukses) {
          if (typeof muatData === 'function') muatData(); 
        } else {
          alert("Gagal: " + hasil.pesan);
        }
      } catch (error) {
        console.error("[ERROR Hapus Guru]:", error);
      }
    } 
  };

  // --- LOGIKA FILTER & PAGINATION ---
  const guruDitampilkan = useMemo(() => {
    return [...dataGuru].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [dataGuru]);

  const { totalPage, dataTerpotong: dataGuruHalIni } = potongDataPagination(guruDitampilkan, page, ITEMS_PER_PAGE);

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.wadahSiswa}`}>
      
      {/* PANEL KIRI: FORM REGISTRASI LENGKAP */}
      <div className={`${styles.formPanel} ${styles.formPanelBiasa} ${styles.flexSatu}`}>
        <h3 className={styles.judulFormPanel}>➕ Registrasi Pengajar</h3>
        
        <form onSubmit={simpanGuru}>
          <div className={styles.wadahInputForm}>
            <label className={styles.labelForm}>Nama Lengkap *</label>
            <input 
              type="text" placeholder="Nama Lengkap & Gelar" required 
              value={formGuru.nama} onChange={e => setFormGuru({...formGuru, nama: e.target.value})} 
              className={styles.formInput} 
            />
          </div>

          <div className={styles.wadahInputForm}>
            <label className={styles.labelForm}>Nomor Peserta / ID Pegawai *</label>
            <input 
              type="text" placeholder="ID Unik Pengajar" required 
              value={formGuru.nomorPeserta} onChange={e => setFormGuru({...formGuru, nomorPeserta: e.target.value})} 
              className={styles.formInput} 
            />
          </div>

          <div className={styles.wadahInputSejajar}>
            <div className={styles.flexSatu}>
              <label className={styles.labelForm}>Username *</label>
              <input 
                type="text" placeholder="Akses Login" required 
                value={formGuru.username} onChange={e => setFormGuru({...formGuru, username: e.target.value})} 
                className={styles.formInput} 
              />
            </div>
            <div className={styles.flexSatu}>
              <label className={styles.labelForm}>Kode Pengajar *</label>
              <input 
                type="text" placeholder="Cth: MTK-01" required 
                value={formGuru.kodePengajar} onChange={e => setFormGuru({...formGuru, kodePengajar: e.target.value})} 
                className={styles.formInput} 
              />
            </div>
          </div>

          <div className={styles.wadahInputForm}>
            <label className={styles.labelForm}>Nomor WA (Aktif) *</label>
            <input 
              type="text" placeholder="08xxxxxxxxxx" required 
              value={formGuru.noHp} onChange={e => setFormGuru({...formGuru, noHp: e.target.value})} 
              className={styles.formInput} 
            />
          </div>

          <div className={styles.wadahInputForm}>
            <label className={styles.labelForm}>Kata Sandi Awal *</label>
            <input 
              type="text" 
              // 🛡️ ZERO HARDCODE PLACEHOLDER
              placeholder={`Minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter`} 
              required 
              value={formGuru.kataSandi} onChange={e => setFormGuru({...formGuru, kataSandi: e.target.value})} 
              className={styles.formInput} 
            />
          </div>

          <div className={styles.wadahInputForm}>
            <label className={styles.labelForm}>Status Akses</label>
            <select 
              value={formGuru.status} onChange={e => setFormGuru({...formGuru, status: e.target.value})} 
              className={styles.formInput} 
              style={{ fontWeight: '900', color: formGuru.status === STATUS_USER.NONAKTIF ? '#ef4444' : '#15803d' }}
            >
              {/* 🛡️ ZERO HARDCODE STATUS */}
              <option value={STATUS_USER.AKTIF}>🟢 Aktif (Bisa Login)</option>
              <option value={STATUS_USER.NONAKTIF}>🔴 Nonaktif (Blokir)</option>
            </select>
          </div>

          <button type="submit" disabled={loadingForm} className={styles.tombolSimpanBiruBaru} style={{width: '100%'}}>
            {loadingForm ? "Memproses..." : "Daftarkan Pengajar"}
          </button>

          {pesanForm && (
            <p className={`${styles.teksPesanForm} ${pesanForm.includes("Berhasil") ? styles.teksPesanSukses : styles.teksPesanGagal}`}>
              {pesanForm}
            </p>
          )}
        </form>
      </div>
      
      {/* PANEL KANAN: DATABASE TABEL */}
      <div className={styles.flexDua}>
        <div className={styles.headerTabSiswa}>
          <h3 className={styles.judulTabelKanan}>Database Pengajar ({guruDitampilkan.length})</h3>
        </div>

        <div className={styles.wadahTabel}>
          <table className={styles.tabelStyle}>
            <thead>
              <tr>
                <th>Pengajar</th>
                <th>Akses & Kode</th>
                <th>Kontak</th>
                <th style={{textAlign: 'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataGuruHalIni.length === 0 ? (
                <tr><td colSpan="4" className={styles.selKosong}>Belum ada data pengajar.</td></tr>
              ) : (
                dataGuruHalIni.map(g => {
                  // 🛡️ ZERO HARDCODE STATUS
                  const isNonaktif = g.status === STATUS_USER.NONAKTIF;
                  return (
                    <tr key={g._id} style={{ opacity: isNonaktif ? 0.6 : 1 }}>
                      <td>
                        <p className={styles.teksNamaSiswa} style={{ color: isNonaktif ? '#ef4444' : 'inherit' }}>
                          {g.nama}
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
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '800', 
                          color: isNonaktif ? '#ef4444' : '#22c55e'
                        }}>
                          {isNonaktif ? '● Terblokir' : '● Aktif'}
                        </span>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <button 
                          onClick={() => klikHapusGuru(g._id, g.nama)} 
                          className={`${styles.tombolAksi} ${styles.btnHapus}`}
                        >
                          Hapus
                        </button>
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
    </div>
  );
}