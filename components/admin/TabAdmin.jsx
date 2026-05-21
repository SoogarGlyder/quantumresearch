"use client";

//FIX: Tambahkan useEffect di import
import { useState, useMemo, useEffect } from "react";
//  FIX: Import Next Navigation dihapus total
import PaginationBar from "../ui/PaginationBar";

import { simpanAkunAdmin, hapusAkunAdmin } from "../../actions/adminAction"; 
import { potongDataPagination } from "../../utils/formatHelper";

import { STATUS_USER, LIMIT_DATA, VALIDASI_SISTEM, CABANG_QUANTUM, PERAN } from "../../utils/constants"; 
import styles from "../../app/admin/AdminPage.module.css";

export default function TabAdmin({ dataAdmin = [], muatData }) {
  
  //  FIX: Jantung Pagination beralih ke RAM memori
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  const initialFormState = { 
    nama: "", 
    username: "", 
    password: "", 
    noHp: "", 
    kodeCabang: CABANG_QUANTUM.CPT.id, 
    tipeAkun: "STAFF_CABANG", 
    status: STATUS_USER.AKTIF 
  };
  
  const [formAdmin, setFormAdmin] = useState(initialFormState);
  const [idEdit, setIdEdit] = useState(null); 
  const [loadingForm, setLoadingForm] = useState(false);
  const [pesanForm, setPesanForm] = useState("");

  // ==========================================================================
  //FIX: ALARM PEMANGGIL DATA OTOMATIS
  // Begitu tab ini diklik/dibuka, langsung paksa tarik data jika tabelnya kosong
  // ==========================================================================
  useEffect(() => {
    if (dataAdmin.length === 0 && typeof muatData === 'function') {
      muatData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const simpanAdmin = async (e) => { 
    e.preventDefault(); 
    if (formAdmin.password && formAdmin.password.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesanForm(`⚠️ Sandi minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`);
      return;
    }
    
    setLoadingForm(true); 
    setPesanForm("Menyimpan..."); 

    const payload = {
      ...formAdmin,
      peran: PERAN.ADMIN.id 
    };

    try {
      const laporan = await simpanAkunAdmin(idEdit, payload);
      setPesanForm(laporan.pesan); 
      
      if (laporan.sukses) { 
        batalEdit(); 
        if(typeof muatData === 'function') muatData(); 
        setTimeout(() => setPesanForm(""), 3000);
      }
    } catch (error) {
      setPesanForm("Gagal menghubungi server.");
    } finally {
      setLoadingForm(false); 
    }
  };

  const klikEditAdmin = (admin) => { 
    setIdEdit(admin._id); 
    const tipeAkunAktif = admin.kodeCabang === CABANG_QUANTUM.PUSAT.id ? "SUPER_ADMIN" : "STAFF_CABANG";
    
    setFormAdmin({ 
      nama: admin.nama, 
      username: admin.username, 
      password: "",
      noHp: admin.noHp || "", 
      kodeCabang: admin.kodeCabang || CABANG_QUANTUM.CPT.id,
      tipeAkun: tipeAkunAktif,
      status: admin.status || STATUS_USER.AKTIF 
    }); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const batalEdit = () => { 
    setIdEdit(null); 
    setFormAdmin(initialFormState); 
    if(!pesanForm.includes("Berhasil")) setPesanForm(""); 
  };

  const klikHapusAdmin = async (id, nama) => { 
    if (window.confirm(`⚠️ PERINGATAN! Yakin menghapus akses admin untuk ${nama}?`)) { 
      const hasil = await hapusAkunAdmin(id);
      if(hasil.sukses) {
        if (typeof muatData === 'function') muatData(); 
      } else {
        alert("Gagal menghapus: " + hasil.pesan);
      }
    } 
  };

  const { totalPage, dataTerpotong: dataAdminHalIni } = potongDataPagination(dataAdmin, page, ITEMS_PER_PAGE);

  const getNamaCabang = (kode) => {
    if (kode === CABANG_QUANTUM.PUSAT.id) return CABANG_QUANTUM.PUSAT.nama;
    const cabang = Object.values(CABANG_QUANTUM).find(c => c.id === kode);
    return cabang ? cabang.nama : "Cabang Tidak Diketahui";
  };

  return (
    <div className={`${styles.isiTab} ${styles.wadahSiswa}`}>
      
      {/* PANEL KIRI: FORM */}
      <div className={`${styles.formPanel} ${idEdit ? styles.formPanelEdit : styles.formPanelBiasa} ${styles.flexSatu}`} style={{ borderColor: '#ef4444' }}>
        <h3 className={idEdit ? styles.judulFormEdit : styles.judulFormPanel}>
          {idEdit ? "✏️ Edit Admin" : "🛡️ Tambah Akses Admin"}
        </h3>
        
        <form onSubmit={simpanAdmin}>
          <input 
            type="text" 
            placeholder="Nama Lengkap" 
            required 
            value={formAdmin.nama} 
            onChange={e => setFormAdmin({...formAdmin, nama: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder="Username Login" 
            required
            value={formAdmin.username} 
            onChange={e => setFormAdmin({...formAdmin, username: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder="Nomor WA (Kontak Darurat)" 
            required 
            value={formAdmin.noHp} 
            onChange={e => setFormAdmin({...formAdmin, noHp: e.target.value})} 
            className={styles.formInput} 
          />
          <input 
            type="text" 
            placeholder={idEdit ? "Kosongkan jika sandi tak diubah" : `Sandi Login`} 
            required={!idEdit} 
            value={formAdmin.password} 
            onChange={e => setFormAdmin({...formAdmin, password: e.target.value})} 
            className={styles.formInput} 
          />

          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '12px' }}>Tingkat Otoritas:</label>
          <select 
            value={formAdmin.tipeAkun} 
            onChange={e => {
              const val = e.target.value;
              setFormAdmin({
                ...formAdmin, 
                tipeAkun: val,
                kodeCabang: val === "SUPER_ADMIN" ? CABANG_QUANTUM.PUSAT.id : CABANG_QUANTUM.CPT.id
              });
            }} 
            className={styles.formInput}
            style={{ backgroundColor: formAdmin.tipeAkun === "SUPER_ADMIN" ? '#fee2e2' : '#dbeafe', fontWeight: '900' }}
          >
            <option value="STAFF_CABANG">🛡️ Admin Cabang</option>
            <option value="SUPER_ADMIN">👑 Super Admin (Pusat)</option>
          </select>

          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '12px' }}>Penempatan Cabang:</label>
          <select 
            value={formAdmin.kodeCabang} 
            onChange={e => setFormAdmin({...formAdmin, kodeCabang: e.target.value})} 
            className={styles.formInput}
            disabled={formAdmin.tipeAkun === "SUPER_ADMIN"} 
          >
            {Object.entries(CABANG_QUANTUM).map(([key, cbg]) => (
              <option key={key} value={cbg.id}>{cbg.nama} ({cbg.id})</option>
            ))}
          </select>

          <div className={styles.wadahTombolAksiForm} style={{ marginTop: '24px' }}>
            {idEdit && <button type="button" onClick={batalEdit} className={styles.tombolBatalForm}>Batal</button>}
            <button type="submit" disabled={loadingForm} className={idEdit ? styles.tombolSimpanKuning : styles.tombolSimpanBiruBaru} style={{ backgroundColor: '#ef4444' }}>
              {loadingForm ? "..." : "Simpan Admin"}
            </button>
          </div>
          {pesanForm && (
            <p className={`${styles.teksPesanForm} ${pesanForm.includes("Berhasil") ? styles.teksPesanSukses : styles.teksPesanGagal}`}>
              {pesanForm}
            </p>
          )}
        </form>
      </div>
      
      {/* PANEL KANAN: TABEL */}
      <div className={styles.flexDua}>
        <div className={styles.headerTabSiswa}>
          <h3 className={styles.judulTabelKanan}>Daftar Pengendali Sistem ({dataAdmin.length})</h3>
        </div>

        <div className={styles.wadahTabel}>
          <table className={styles.tabelStyle}>
            <thead>
              <tr>
                <th>Akun & Kontak</th>
                <th>Otoritas & Cabang</th>
                <th className={styles.kolomAksiKecil}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataAdminHalIni.length === 0 ? (
                <tr><td colSpan="3" className={styles.selKosong}>Data admin kosong.</td></tr>
              ) : (
                dataAdminHalIni.map(a => {
                  const isSuper = a.kodeCabang === CABANG_QUANTUM.PUSAT.id;
                  return (
                    <tr key={a._id} style={{ backgroundColor: isSuper ? '#fff1f2' : 'transparent' }}>
                      <td>
                        <p className={styles.teksNamaSiswa} style={{ color: isSuper ? '#ef4444' : '#111827' }}>
                          {isSuper ? '👑 ' : '🛡️ '} {a.nama}
                        </p>
                        <p className={styles.teksUsernameSiswa}>@{a.username} | WA: {a.noHp}</p>
                      </td>
                      <td>
                        <div style={{ fontWeight: '900', color: isSuper ? '#ef4444' : '#2563eb' }}>
                          {isSuper ? 'SUPER ADMIN PUSAT' : 'ADMIN CABANG'}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
                          🏢 {getNamaCabang(a.kodeCabang)}
                        </div>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <div className={styles.wadahAksiInlineHorizontal}>
                          <button onClick={() => klikEditAdmin(a)} className={`${styles.tombolAksi} ${styles.btnEdit}`}>Edit</button> 
                          <button onClick={() => klikHapusAdmin(a._id, a.nama)} className={`${styles.tombolAksi} ${styles.btnHapus}`}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {/*  FIX: Pasang kabel Pagination RAM */}
        <PaginationBar totalPages={totalPage} currentPage={page} onPageChange={setPage} />
      </div>
      
    </div>
  );
}