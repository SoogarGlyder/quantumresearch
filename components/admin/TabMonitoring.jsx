"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import TabKelas from "./TabKelas";
import TabKonsul from "./TabKonsul";
import TabAbsenStaf from "./TabAbsenStaf";

import { TIPE_SESI } from "../../utils/constants";
import styles from "../../app/admin/AdminPage.module.css";
import { FaChalkboardUser, FaLightbulb, FaUserShield } from "react-icons/fa6";

// 🚀 FIX: Tambahkan dataPengajar di dalam props ini 👇
export default function TabMonitoring({ dataRiwayat, dataJadwal, dataSiswa, dataAbsenStaf, dataPengajar, muatData, bulanAktif }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const subView = searchParams.get("sub") || TIPE_SESI.KELAS;

  const gantiSubView = (idBaru) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sub", idBaru);
    params.delete("page"); 
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.isiTab} style={{ padding: '24px' }}>
      
      {/* 🎚️ DONGLE SWITCHER (Neo-Brutalism Style) */}
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
        {/* BUTTON: ABSENSI KELAS */}
        <button 
          onClick={() => gantiSubView(TIPE_SESI.KELAS)}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === TIPE_SESI.KELAS ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === TIPE_SESI.KELAS ? '#facc15' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === TIPE_SESI.KELAS ? '4px 4px 0 #111827' : 'none',
            transform: subView === TIPE_SESI.KELAS ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaChalkboardUser size={20} /> ABSENSI KELAS
        </button>

        {/* BUTTON: KONSUL SISWA */}
        <button 
          onClick={() => gantiSubView(TIPE_SESI.KONSUL)}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === TIPE_SESI.KONSUL ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === TIPE_SESI.KONSUL ? '#4ade80' : 'transparent',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === TIPE_SESI.KONSUL ? '4px 4px 0 #111827' : 'none',
            transform: subView === TIPE_SESI.KONSUL ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaLightbulb size={20} /> KONSUL SISWA
        </button>

        {/* BUTTON: MONITORING STAF */}
        <button 
          onClick={() => gantiSubView("staf")}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: subView === "staf" ? '3px solid #111827' : '3px solid transparent',
            backgroundColor: subView === "staf" ? '#3b82f6' : 'transparent',
            color: subView === "staf" ? 'white' : '#111827',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: subView === "staf" ? '4px 4px 0 #111827' : 'none',
            transform: subView === "staf" ? 'translate(-2px, -2px)' : 'none'
          }}
        >
          <FaUserShield size={20} /> MONITORING STAF
        </button>
      </div>

      {/* 📦 AREA TAMPILAN (Animasi Fade In) */}
      <div key={subView} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {/* 🚀 FIX: Oper bulanAktif ke masing-masing Tab */}
        {subView === TIPE_SESI.KELAS && (
          <TabKelas dataRiwayat={dataRiwayat} dataJadwal={dataJadwal} dataSiswa={dataSiswa} muatData={muatData} bulanAktif={bulanAktif} />
        )}
        
        {subView === TIPE_SESI.KONSUL && (
          <TabKonsul dataRiwayat={dataRiwayat} bulanAktif={bulanAktif} />
        )}

        {subView === "staf" && (
          <TabAbsenStaf dataAbsenStaf={dataAbsenStaf} dataPengajar={dataPengajar} muatData={muatData} bulanAktif={bulanAktif} />
        )}
      </div>

    </div>
  );
}