"use client";

import { useState } from "react";
import { FaXmark, FaFloppyDisk } from "react-icons/fa6";
import { prosesSimpanAbsenManual } from "../../actions/adminAction";
import styles from "../../app/admin/AdminPage.module.css";

export default function ModalAbsen({ isOpen, onClose, dataPengajar = [], muatData }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pengajarId: "",
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: "Input Manual Admin (Otomatis 12:00-20:00)"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pengajarId) return alert("Pilih Pengajar!");
    
    setLoading(true);
    const res = await prosesSimpanAbsenManual(form);
    if (res.sukses) {
      alert(res.pesan);
      muatData(); // Refresh tabel setelah simpan
      onClose();
    } else {
      alert(res.pesan);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', border: '4px solid #111827', boxShadow: '12px 12px 0 #111827', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px', background: '#2563eb', borderBottom: '4px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <h3 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase', fontSize: '16px' }}>➕ Suntik Absen Manual</h3>
          <FaXmark onClick={onClose} cursor="pointer" size={24} />
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#6b7280', marginBottom: '4px' }}>NAMA PENGAJAR</label>
            <select 
              required 
              className={styles.formInput} 
              value={form.pengajarId}
              onChange={e => setForm({...form, pengajarId: e.target.value})}
              style={{ width: '100%', border: '3px solid #111827' }}
            >
              <option value="">-- Pilih Nama --</option>
              {dataPengajar.map(p => <option key={p._id} value={p._id}>{p.nama} ({p.kodePengajar})</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#6b7280', marginBottom: '4px' }}>TANGGAL KERJA</label>
            <input 
              type="date" required className={styles.formInput}
              value={form.tanggal}
              onChange={e => setForm({...form, tanggal: e.target.value})}
              style={{ width: '100%', border: '3px solid #111827' }}
            />
          </div>

          <div style={{ backgroundColor: '#fef9c3', padding: '10px', borderRadius: '8px', border: '2px solid #111827', fontSize: '12px', fontWeight: 'bold' }}>
            💡 Jam akan otomatis diisi:<br/>
            <span style={{ color: '#2563eb' }}>12:00 WIB s/d 20:00 WIB</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#6b7280', marginBottom: '4px' }}>KETERANGAN</label>
            <input 
              type="text" placeholder="Cth: Masuk saat Libur Nasional"
              className={styles.formInput}
              value={form.keterangan}
              onChange={e => setForm({...form, keterangan: e.target.value})}
              style={{ width: '100%', border: '3px solid #111827' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.tombolSimpanBiruBaru} 
            style={{ width: '100%', padding: '14px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? "MEMPROSES..." : <><FaFloppyDisk /> SIMPAN PRESENSI</>}
          </button>
        </form>
      </div>
    </div>
  );
}