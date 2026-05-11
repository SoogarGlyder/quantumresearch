"use client";

import { memo, Suspense, useState } from "react";
// 🚀 FIX: useSearchParams dihapus dan diganti dengan useState dari React
import { FaBookOpen, FaPen, FaUserTie } from "react-icons/fa6";

// PATH ABSOLUTE
import { potongDataPagination } from "@/utils/formatHelper";
import PaginationBar from "@/components/ui/PaginationBar";
import { LIMIT_DATA } from "@/utils/constants"; 
import styles from "@/components/App.module.css";

const InnerLatihanHariIni = memo(({ latihanHariIni = [], setUrlMitra }) => {
  
  // 🚀 FIX: Jantung Pagination kini murni pakai RAM (0 Lag)
  const [page, setPage] = useState(1);
  
  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGNATION_BAHAN || 3; 

  // Pastikan data selalu berupa array
  const daftarLatihan = Array.isArray(latihanHariIni) ? latihanHariIni : (latihanHariIni ? [latihanHariIni] : []);

  // Potong data sesuai halaman aktif
  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(daftarLatihan, page, ITEMS_PER_PAGE);

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaBookOpen color="#2563eb" /> Bahan Belajar
      </h3>
      
      <div className={styles.missionList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dataHalIni.length > 0 ? (
          <>
            {dataHalIni.map((latihan, index) => (
              <div 
                key={latihan._id || index} 
                className={styles.missionCard} 
                style={{ 
                  cursor: 'pointer', 
                  padding: '0', 
                  overflow: 'hidden',
                  border: '3px solid #111827', 
                  boxShadow: '4px 4px 0 #111827', 
                  borderRadius: '12px'
                }} 
                onClick={() => setUrlMitra(latihan.url)}
              >
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb', border: '2px solid #2563eb' }}>
                        <FaPen size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                          {latihan.judul}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                          <FaUserTie size={12} color="#475569" /> {latihan.namaPembuat || "Admin Quantum"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 🚀 FIX: Pemasangan kabel currentPage dan onPageChange */}
            <div style={{ marginTop: '-12px', display: 'flex', justifyContent: 'center' }}>
               <PaginationBar 
                 totalPages={totalPage} 
                 currentPage={page} 
                 onPageChange={setPage} 
                 style={{ justifyContent: 'space-evenly', width: '100%' }} 
               />
            </div>
          </>
        ) : (
          <p className={styles.emptySchedule} style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', color: '#64748b' }}>
            Tidak ada bahan belajar tambahan untuk hari ini. Ayo Konsul!
          </p>
        )}
      </div>
    </div>
  );
});

InnerLatihanHariIni.displayName = "InnerLatihanHariIni";

// Komponen Utama berfungsi sebagai pelindung Suspense
export default function LatihanHariIni(props) {
  return (
    <Suspense fallback={
      <div className={styles.contentContainer} style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontWeight: 'bold' }}>
        Memuat Bahan Belajar...
      </div>
    }>
      <InnerLatihanHariIni {...props} />
    </Suspense>
  );
}