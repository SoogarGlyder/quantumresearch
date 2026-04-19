"use client";

import { memo } from "react";
import { FaBrain, FaPlus, FaUserTie, FaPenToSquare, FaTrashCan } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const DaftarKuis = memo(({ dataBankSoal, loading, onBuatBaru, onEdit, onHapus }) => (
  <div style={{ padding: '24px 16px' }}>
    
    <div style={{ marginBottom: '20px', background: '#e0e7ff', padding: '16px', borderRadius: '12px', border: '3px solid #3b82f6' }}>
      <h3 style={{ margin: '0 0 5px 0', color: '#1d4ed8', fontWeight: '900' }}>Gudang Master Soal CBT</h3>
      <p style={{ margin: 0, color: '#1e40af', fontSize: '13px', fontWeight: 'bold' }}>Buat soal di sini, lalu pasang ke kelas mana pun melalui Jurnal Kelas.</p>
    </div>

    <button 
      onClick={onBuatBaru} 
      style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#22c55e', color: 'white', border: '4px solid #111827', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '4px 4px 0 #111827', marginBottom: '30px' }}
    >
      <FaPlus size={18} /> RAKIT SOAL CBT BARU
    </button>

    {loading ? (
      <div style={{ textAlign: 'center', padding: '40px', fontWeight: '900', color: '#111827' }}>MEMUAT BANK SOAL...</div>
    ) : (!dataBankSoal || dataBankSoal.length === 0) ? (
      <div style={{ textAlign: 'center', padding: '40px', border: '3px dashed #cbd5e1', borderRadius: '15px', color: '#64748b', fontWeight: 'bold' }}>
        Belum ada master soal CBT. Silakan buat baru.
      </div>
    ) : (
      <div style={{ display: 'grid', gap: '16px' }}>
        {dataBankSoal.map((bank) => (
          <div key={bank._id} style={{ background: 'white', border: '4px solid #111827', borderRadius: '15px', padding: '16px', boxShadow: '4px 4px 0 #cbd5e1', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px 0', fontWeight: '900', fontSize: '18px', color: '#111827', textTransform: 'uppercase', lineHeight: '1.3' }}>
                {bank.judul || "Tanpa Judul"}
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaUserTie /> Oleh: {bank.pembuatId?.nama || "Admin Sistem"}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span style={{ background: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', border: '2px solid #a16207' }}>📝 {bank.soal?.length || 0} SOAL</span>
                <span style={{ background: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', border: '2px solid #475569' }}>⏱ {bank.durasi || 10} MENIT</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button onClick={() => onEdit(bank)} style={{ flex: 1, padding: '10px', background: '#facc15', color: '#111827', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <FaPenToSquare /> EDIT
              </button>
              <button onClick={() => onHapus(bank._id, bank.judul)} style={{ padding: '10px 15px', background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                <FaTrashCan />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

DaftarKuis.displayName = "DaftarKuis";
export default DaftarKuis;