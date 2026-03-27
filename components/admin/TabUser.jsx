"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import TabSiswa from "./TabSiswa";
import TabPengajar from "./TabPengajar";

import { PERAN } from "../../utils/constants";
import styles from "../../app/admin/AdminPage.module.css";
import { FaUserGraduate, FaChalkboardUser } from "react-icons/fa6";

export default function TabUser({ dataSiswa, dataPengajar, muatData }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 🚀 LOGIKA STICKY: Ambil sub-tab dari URL, default ke SISWA
  const subView = searchParams.get("sub") || PERAN.SISWA.id;

  const gantiSubView = (idBaru) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sub", idBaru);
    params.delete("page"); // Reset pagination
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.isiTab} style={{ padding: '24px' }}>
      
      {/* 🎚️ DONGLE USER SWITCHER (Neo-Brutalism Style) */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#e5e7eb', 
        padding: '8px', 
        borderRadius: '16px', 
        border: '4px solid #111827', 
        boxShadow: '4px 4px 0 #111827',
        width: 'fit-content',
        margin: '0 auto 32px auto',
        gap: '8px'
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
      </div>

      {/* 📦 AREA KONTEN (Animasi Fade In) */}
      <div key={subView} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {subView === PERAN.SISWA.id ? (
          <TabSiswa 
            dataSiswa={dataSiswa} 
            muatData={muatData} 
          />
        ) : (
          <TabPengajar 
            dataPengajar={dataPengajar} 
            muatData={muatData} 
          />
        )}
      </div>

    </div>
  );
}