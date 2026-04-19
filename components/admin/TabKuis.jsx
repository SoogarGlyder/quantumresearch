"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
// 🚀 PERBAIKAN: Mengganti FaSearch menjadi FaMagnifyingGlass
import { FaPlus, FaBrain, FaPenToSquare, FaTrashCan, FaUserTie, FaMagnifyingGlass } from "react-icons/fa6"; 

import { ambilSemuaBankSoal, hapusBankSoal } from "../../actions/quizAction";
import styles from "../../app/admin/AdminPage.module.css";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";
import ModalKuis from "./ModalKuis"; 

// 🚀 PERBAIKAN: Menghapus ID Dummy. Sekarang wajib menerima ID asli dari Session!
export default function TabKuis({ adminId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dataBankSoal, setDataBankSoal] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalKuisOpen, setIsModalKuisOpen] = useState(false);
  const [kuisAktif, setKuisAktif] = useState(null); 

  // 🚀 AMBIL STATE DARI URL UNTUK FILTER & PAGINATION
  const searchQuery = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = 5; // Bebas disesuaikan (misal: 10 atau 20)

  useEffect(() => {
    // Pastikan adminId sudah ada sebelum menarik data
    if (adminId) {
      muatBankSoal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const muatBankSoal = async () => {
    setLoading(true);
    const data = await ambilSemuaBankSoal(adminId); 
    setDataBankSoal(data || []);
    setLoading(false);
  };

  // 🚀 LOGIKA PENCARIAN & UPDATE URL
  const handleSearch = (e) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    
    params.set("page", "1"); 
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 🚀 LOGIKA FILTERING DATA
  const dataFiltered = useMemo(() => {
    if (!searchQuery) return dataBankSoal;
    return dataBankSoal.filter(bank => 
      bank.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.pembuatId?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dataBankSoal, searchQuery]);

  // 🚀 LOGIKA PAGINATION (MEMOTONG DATA)
  const totalPages = Math.ceil(dataFiltered.length / ITEMS_PER_PAGE);
  const dataPaginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return dataFiltered.slice(start, end);
  }, [dataFiltered, currentPage]);

  // =======================================================
  // AKSI-AKSI
  // =======================================================
  const klikHapusBankSoal = async (id, judul) => {
    if (window.confirm(`YAKIN MENGHAPUS MASTER SOAL: "${judul}"?\n\nSoal yang sudah ter-copy di kelas/jadwal tidak akan terpengaruh.`)) {
      const res = await hapusBankSoal(id);
      if (res.sukses) muatBankSoal(); else alert(res.pesan);
    }
  };

  const bukaModalBuatCBT = () => { setKuisAktif(null); setIsModalKuisOpen(true); };
  const bukaModalEditCBT = (item) => { setKuisAktif(item); setIsModalKuisOpen(true); };
  const tutupModalCBT = () => { setIsModalKuisOpen(false); muatBankSoal(); };

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

      {/* TOOLBAR: SEARCH & TOMBOL BUAT */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
           <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
             {/* 🚀 Menggunakan FaMagnifyingGlass */}
             <FaMagnifyingGlass size={18} />
           </div>
           <FilterInput 
             value={searchQuery} 
             onChange={handleSearch} 
             placeholder="Cari judul soal atau nama pembuat..." 
             style={{ width: '100%', padding: '16px 16px 16px 45px', border: '3px solid #111827', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', boxShadow: '4px 4px 0 #111827' }}
           />
        </div>

        <button 
          onClick={bukaModalBuatCBT} 
          style={{ 
            padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
            background: '#22c55e', color: 'white', border: '3px solid #111827', borderRadius: '12px', 
            fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '4px 4px 0 #111827', transition: 'transform 0.1s'
          }}
        >
          <FaPlus size={18} /> RAKIT SOAL CBT
        </button>
      </div>

      {/* AREA DAFTAR SOAL (MODE TABEL) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', fontWeight: '900', fontSize: '18px', color: '#111827' }}>
          ⏳ MEMUAT BANK SOAL...
        </div>
      ) : dataFiltered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', border: '4px dashed #94a3b8', borderRadius: '16px', background: '#f8fafc' }}>
          <FaBrain size={40} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: 0, color: '#475569', fontWeight: '900', textTransform: 'uppercase' }}>{searchQuery ? "PENCARIAN TIDAK DITEMUKAN" : "GUDANG KOSONG"}</h3>
          <p style={{ color: '#64748b', fontWeight: 'bold', marginTop: '8px' }}>
            {searchQuery ? `Tidak ada soal dengan kata kunci "${searchQuery}"` : "Belum ada pengajar yang membuat soal CBT."}
          </p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: 'white', border: '4px solid #111827', borderRadius: '16px', boxShadow: '6px 6px 0 #cbd5e1', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '16px', borderBottom: '4px solid #111827', borderRight: '3px solid #111827', textAlign: 'center', width: '60px', fontWeight: '900', color: '#111827' }}>NO</th>
                  <th style={{ padding: '16px', borderBottom: '4px solid #111827', borderRight: '3px solid #111827', textAlign: 'left', fontWeight: '900', color: '#111827' }}>JUDUL MASTER SOAL</th>
                  <th style={{ padding: '16px', borderBottom: '4px solid #111827', borderRight: '3px solid #111827', textAlign: 'left', fontWeight: '900', color: '#111827' }}>PEMBUAT</th>
                  <th style={{ padding: '16px', borderBottom: '4px solid #111827', borderRight: '3px solid #111827', textAlign: 'center', width: '150px', fontWeight: '900', color: '#111827' }}>INFO KUIS</th>
                  <th style={{ padding: '16px', borderBottom: '4px solid #111827', textAlign: 'center', width: '220px', fontWeight: '900', color: '#111827' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {dataPaginated.map((bank, index) => (
                  <tr key={bank._id} style={{ borderBottom: index === dataPaginated.length - 1 ? 'none' : '3px solid #111827', transition: '0.2s' }}>
                    
                    <td style={{ padding: '16px', borderRight: '3px solid #111827', textAlign: 'center', fontWeight: '900', color: '#111827', fontSize: '16px' }}>
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    
                    <td style={{ padding: '16px', borderRight: '3px solid #111827', fontWeight: '900', fontSize: '16px', color: '#1d4ed8', textTransform: 'uppercase' }}>
                      {bank.judul || "Tanpa Judul"}
                    </td>
                    
                    <td style={{ padding: '16px', borderRight: '3px solid #111827', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: '#e2e8f0', padding: '6px', borderRadius: '50%', color: '#64748b' }}>
                          <FaUserTie size={14} />
                        </div>
                        {bank.pembuatId?.nama || "Admin Sistem"}
                      </div>
                    </td>
                    
                    <td style={{ padding: '16px', borderRight: '3px solid #111827', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ background: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', border: '2px solid #a16207' }}>
                          📝 {bank.soal?.length || 0} SOAL
                        </span>
                        <span style={{ background: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', border: '2px solid #475569' }}>
                          ⏱ {bank.durasi || 10} MNT
                        </span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => bukaModalEditCBT(bank)} 
                          style={{ flex: 1, padding: '10px', background: '#facc15', color: '#111827', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', boxShadow: '3px 3px 0 #111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <FaPenToSquare /> EDIT
                        </button>
                        <button 
                          onClick={() => klikHapusBankSoal(bank._id, bank.judul)} 
                          style={{ padding: '10px 14px', background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', boxShadow: '3px 3px 0 #111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RENDER PAGINATION BAR */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PaginationBar totalPages={totalPages} />
          </div>
        </>
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