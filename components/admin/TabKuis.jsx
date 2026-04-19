"use client";

import { useState, useEffect } from "react";
import { FaPlus, FaBrain, FaPenToSquare, FaTrashCan, FaUserTie } from "react-icons/fa6"; // 🚀 Tambah ikon User

import { ambilSemuaBankSoal, hapusBankSoal } from "../../actions/quizAction";
import styles from "../../app/admin/AdminPage.module.css";

import ModalKuis from "./ModalKuis"; 

export default function TabKuis({ adminId = "admin-sistem" }) {
  const [dataBankSoal, setDataBankSoal] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalKuisOpen, setIsModalKuisOpen] = useState(false);
  const [kuisAktif, setKuisAktif] = useState(null); 

  useEffect(() => {
    muatBankSoal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const muatBankSoal = async () => {
    setLoading(true);
    // 🚀 Karena adminId = "admin-sistem", backend sekarang akan mengirimkan SEMUA soal
    const data = await ambilSemuaBankSoal(adminId); 
    setDataBankSoal(data || []);
    setLoading(false);
  };

  const klikHapusBankSoal = async (id, judul) => {
    if (window.confirm(`YAKIN MENGHAPUS MASTER SOAL: "${judul}"?\n\nSoal yang sudah ter-copy di kelas/jadwal tidak akan terpengaruh.`)) {
      const res = await hapusBankSoal(id);
      if (res.sukses) {
        muatBankSoal();
      } else {
        alert(res.pesan);
      }
    }
  };

  const bukaModalBuatCBT = () => {
    setKuisAktif(null);
    setIsModalKuisOpen(true);
  };

  const bukaModalEditCBT = (item) => {
    setKuisAktif(item);
    setIsModalKuisOpen(true);
  };

  const tutupModalCBT = () => {
    setIsModalKuisOpen(false);
    muatBankSoal(); 
  };

  return (
    <div className={styles.isiTab}>
      
      {/* HEADER TAB */}
      <div style={{ marginBottom: '24px', borderBottom: '4px solid #111827', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0, fontWeight: '900', color: '#111827', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaBrain color="#3b82f6" /> GUDANG BANK SOAL
        </h2>
        <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontWeight: 'bold', fontSize: '15px' }}>
          Pantau seluruh Master Soal CBT yang dibuat oleh semua pengajar di sini.
        </p>
      </div>

      {/* TOMBOL BUAT BARU */}
      <button 
        onClick={bukaModalBuatCBT} 
        style={{ 
          width: '100%', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
          background: '#22c55e', color: 'white', border: '4px solid #111827', borderRadius: '12px', 
          fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: '6px 6px 0 #111827', marginBottom: '32px',
          transition: 'transform 0.1s'
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'translate(2px, 2px)'}
        onMouseUp={e => e.currentTarget.style.transform = 'none'}
      >
        <FaPlus size={22} /> RAKIT PAKET SOAL BARU
      </button>

      {/* AREA DAFTAR SOAL */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', fontWeight: '900', fontSize: '18px', color: '#111827' }}>
          ⏳ MEMUAT BANK SOAL...
        </div>
      ) : dataBankSoal.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', border: '4px dashed #94a3b8', borderRadius: '16px', background: '#f8fafc' }}>
          <FaBrain size={40} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: 0, color: '#475569', fontWeight: '900', textTransform: 'uppercase' }}>Gudang Soal Masih Kosong</h3>
          <p style={{ color: '#64748b', fontWeight: 'bold', marginTop: '8px' }}>Belum ada pengajar yang membuat soal CBT.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {dataBankSoal.map((bank) => (
            <div key={bank._id} style={{ background: 'white', border: '4px solid #111827', borderRadius: '16px', padding: '20px', boxShadow: '6px 6px 0 #cbd5e1', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px 0', fontWeight: '900', fontSize: '20px', color: '#111827', textTransform: 'uppercase', lineHeight: '1.3' }}>
                  {bank.judul || "Tanpa Judul"}
                </h4>
                
                {/* 🚀 TAMBAHAN: NAMA PEMBUAT SOAL (QC ADMIN) */}
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaUserTie /> Pembuat: {bank.pembuatId?.nama || "Admin Sistem"}
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <span style={{ background: '#fef08a', color: '#854d0e', padding: '6px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '13px', border: '2px solid #a16207' }}>
                    📝 {bank.soal?.length || 0} SOAL
                  </span>
                  <span style={{ background: '#e2e8f0', color: '#475569', padding: '6px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '13px', border: '2px solid #475569' }}>
                    ⏱ {bank.durasi || 10} MENIT
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button 
                  onClick={() => bukaModalEditCBT(bank)} 
                  style={{ flex: 1, padding: '12px', background: '#facc15', color: '#111827', border: '3px solid #111827', borderRadius: '10px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '3px 3px 0 #111827' }}
                >
                  <FaPenToSquare /> EDIT
                </button>
                <button 
                  onClick={() => klikHapusBankSoal(bank._id, bank.judul)} 
                  style={{ padding: '12px 16px', background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '10px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '3px 3px 0 #111827' }}
                >
                  <FaTrashCan />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL BUILDER SOAL */}
      {isModalKuisOpen && (
        <ModalKuis 
          isOpen={isModalKuisOpen} 
          onClose={tutupModalCBT} 
          jadwal={{ _id: "MODE_BANK_SOAL", mapel: kuisAktif?.judul || "SOAL BARU", kelasTarget: "Gudang Soal" }} 
          kuisLama={kuisAktif}
          adminId={adminId} 
          muatData={muatBankSoal}
        />
      )}

    </div>
  );
}