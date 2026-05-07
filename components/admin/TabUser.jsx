"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import TabSiswa from "./TabSiswa";
import TabPengajar from "./TabPengajar";
import TabAdmin from "./TabAdmin"; 

import { PERAN } from "../../utils/constants";
import styles from "../../app/admin/AdminPage.module.css";
import { FaUserGraduate, FaChalkboardUser, FaUserTie } from "react-icons/fa6"; 

// FIX: Import fungsi migrasi dari adminAction
import { prosesMigrasiDataLama } from "../../actions/adminAction"; 

export default function TabUser({ dataSiswa, dataPengajar, dataAdmin, muatData, isKakakAsuh = false, isSuperAdmin = false }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const subView = searchParams.get("sub") || PERAN.SISWA.id;

  const gantiSubView = (idBaru) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sub", idBaru);
    params.delete("page"); 
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.isiTab} style={{ padding: '24px' }}>
      
      {/* 🚨 TOMBOL SINKRONISASI (HANYA MUNCUL UNTUK SUPER ADMIN PUSAT) 🚨 */}
      {isSuperAdmin && (
        <button 
          onClick={async () => {
            const yakin = window.confirm("Mulai sinkronisasi cabang untuk seluruh data lama?\n\nPastikan Anda hanya melakukan ini SATU KALI SAJA saat perpindahan sistem.");
            if (!yakin) return;
            
            // Panggil fungsi migrasi
            const res = await prosesMigrasiDataLama();
            alert(res.pesan || "Migrasi dieksekusi.");
            
            // Refresh data setelah sukses
            if (muatData) muatData(); 
          }}
          style={{
            backgroundColor: '#ef4444', color: 'white', padding: '16px 24px', 
            fontWeight: '900', borderRadius: '12px', border: '4px solid #111827',
            boxShadow: '4px 4px 0 #111827', cursor: 'pointer', marginBottom: '32px', 
            width: '100%', textTransform: 'uppercase', fontSize: '15px',
            animation: 'pulse 2s infinite',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
          }}
        >
          ⚠️ KLIK UNTUK SINKRONISASI DATABASE KE SISTEM MULTI-CABANG ⚠️
        </button>
      )}

      {!isKakakAsuh && (
        <div style={{ 
          display: 'flex', 
          backgroundColor: '#e5e7eb', 
          padding: '8px', 
          borderRadius: '16px', 
          border: '4px solid #111827', 
          boxShadow: '4px 4px 0 #111827',
          width: 'fit-content',
          margin: '0 auto 32px auto',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => gantiSubView(PERAN.SISWA.id)}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: subView === PERAN.SISWA.id ? '3px solid #111827' : '3px solid transparent',
              backgroundColor: subView === PERAN.SISWA.id ? '#facc15' : 'transparent',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: subView === PERAN.SISWA.id ? '4px 4px 0 #111827' : 'none',
              transform: subView === PERAN.SISWA.id ? 'translate(-2px, -2px)' : 'none'
            }}
          >
            <FaUserGraduate size={20} /> DATABASE {PERAN.SISWA.label.toUpperCase()}
          </button>

          <button 
            onClick={() => gantiSubView(PERAN.PENGAJAR.id)}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: subView === PERAN.PENGAJAR.id ? '3px solid #111827' : '3px solid transparent',
              backgroundColor: subView === PERAN.PENGAJAR.id ? '#2563eb' : 'transparent',
              color: subView === PERAN.PENGAJAR.id ? 'white' : '#111827',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: subView === PERAN.PENGAJAR.id ? '4px 4px 0 #111827' : 'none',
              transform: subView === PERAN.PENGAJAR.id ? 'translate(-2px, -2px)' : 'none'
            }}
          >
            <FaChalkboardUser size={20} /> DATABASE {PERAN.PENGAJAR.label.toUpperCase()}
          </button>

          {/* TOMBOL KETIGA (HANYA MUNCUL UNTUK SUPER ADMIN PUSAT) */}
          {isSuperAdmin && (
             <button 
              onClick={() => gantiSubView("admin_pusat")}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: subView === "admin_pusat" ? '3px solid #111827' : '3px solid transparent',
                backgroundColor: subView === "admin_pusat" ? '#ef4444' : 'transparent',
                color: subView === "admin_pusat" ? 'white' : '#111827',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: subView === "admin_pusat" ? '4px 4px 0 #111827' : 'none',
                transform: subView === "admin_pusat" ? 'translate(-2px, -2px)' : 'none'
              }}
            >
              <FaUserTie size={20} /> DATABASE ADMIN CABANG
            </button>
          )}
        </div>
      )}

      {/* 📦 AREA KONTEN */}
      <div key={subView} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {subView === PERAN.SISWA.id || isKakakAsuh ? (
          <TabSiswa dataSiswa={dataSiswa} muatData={muatData} isKakakAsuh={isKakakAsuh} />
        ) : subView === PERAN.PENGAJAR.id ? (
          <TabPengajar dataPengajar={dataPengajar} muatData={muatData} />
        ) : (subView === "admin_pusat" && isSuperAdmin) ? (
          // RENDER TAB ADMIN
          <TabAdmin dataAdmin={dataAdmin} muatData={muatData} /> 
        ) : null}
      </div>

    </div>
  );
}