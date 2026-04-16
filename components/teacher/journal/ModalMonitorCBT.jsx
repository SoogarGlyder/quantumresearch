"use client";

import { useState, useEffect } from "react";
import { 
  FaXmark, FaRotateRight, FaClock, FaCheckDouble, 
  FaTriangleExclamation, FaSkull, FaPowerOff, FaSatelliteDish 
} from "react-icons/fa6";

import { getStatusKuisLive, resetUjianSiswa, forceSubmitUjianSiswa } from "@/actions/teacherAction"; 
import styles from "@/components/App.module.css";

export default function ModalMonitorCBT({ jadwalId, kelasTarget, onClose }) {
  const [dataSiswaLive, setDataSiswaLive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchLiveStatus = async () => {
    try {
      const res = await getStatusKuisLive(jadwalId);
      if (res.sukses) {
        setDataSiswaLive(res.data);
        const now = new Date();
        setLastUpdate(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      }
    } catch (err) {
      console.error("Gagal memuat status live:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 10000); 
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalId]);

  const handleForceSubmit = async (siswaId, nama) => {
    const konfirmasi = window.confirm(`⚡ PERINGATAN!\n\nAnda yakin ingin menutup paksa akses ujian ${nama}? \n\nSiswa ini akan langsung mendapat NILAI 0 dan layarnya akan terkunci.`);
    if (!konfirmasi) return;

    setIsProcessing(true);
    const res = await forceSubmitUjianSiswa(jadwalId, siswaId, nama);
    alert(res.pesan);
    if (res.sukses) await fetchLiveStatus(); 
    setIsProcessing(false);
  };

  const handleResetSiswa = async (siswaId, nama) => {
    const konfirmasi = window.confirm(`💀 BAHAYA!\n\nAnda yakin ingin MENGHAPUS seluruh jawaban dan nilai milik ${nama}? \n\nSiswa harus mengulang ujian dari awal.`);
    if (!konfirmasi) return;

    setIsProcessing(true);
    const res = await resetUjianSiswa(jadwalId, siswaId);
    alert(res.pesan);
    if (res.sukses) await fetchLiveStatus(); 
    setIsProcessing(false);
  };

  const totalSiswa = dataSiswaLive.length;
  const jumlahSelesai = dataSiswaLive.filter(s => s.status === "SELESAI").length;
  const jumlahMengerjakan = dataSiswaLive.filter(s => s.status === "MENGERJAKAN").length;
  const jumlahBelum = dataSiswaLive.filter(s => s.status === "BELUM_MULAI").length;

  return (
    <div className={styles.wrapperGallery} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 99999, backgroundColor: '#f8fafc', overflowY: 'auto', paddingBottom: '40px'
    }}>
      <div className={styles.containerGallery}>
        
        {/* 🚀 HEADER MODAL */}
        <div className={styles.headerGallery}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
              RADAR CBT
            </h3>
            <span className={styles.galleryDate}>
              {kelasTarget} • Update: {lastUpdate}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.galleryButton} onClick={fetchLiveStatus} disabled={isProcessing}>
              <FaRotateRight size={18} />
            </button>
            <button className={styles.galleryButton} onClick={onClose}>
              <FaXmark size={20} />
            </button>
          </div>
        </div>

        <div className={styles.areaGallery}>
          {/* 🚀 STATISTIK TOP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '3px solid #111827', textAlign: 'center', boxShadow: '4px 4px 0 #111827' }}>
              <h4 style={{ margin: 0, color: '#111827', fontSize: '11px', fontWeight: '900' }}>TOTAL SISWA</h4>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#2563eb' }}>{totalSiswa}</span>
            </div>
            <div style={{ background: '#fef08a', padding: '16px', borderRadius: '12px', border: '3px solid #111827', textAlign: 'center', boxShadow: '4px 4px 0 #111827' }}>
              <h4 style={{ margin: 0, color: '#111827', fontSize: '11px', fontWeight: '900' }}>AKTIF KELAS</h4>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#b45309' }}>{jumlahMengerjakan}</span>
            </div>
            <div style={{ background: '#dcfce3', padding: '16px', borderRadius: '12px', border: '3px solid #111827', textAlign: 'center', boxShadow: '4px 4px 0 #111827' }}>
              <h4 style={{ margin: 0, color: '#111827', fontSize: '11px', fontWeight: '900' }}>SELESAI (SUBMIT)</h4>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#166534' }}>{jumlahSelesai}</span>
            </div>
            <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', border: '3px solid #111827', textAlign: 'center', boxShadow: '4px 4px 0 #111827' }}>
              <h4 style={{ margin: 0, color: '#111827', fontSize: '11px', fontWeight: '900' }}>BELUM MASUK</h4>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#475569' }}>{jumlahBelum}</span>
            </div>
          </div>

          {/* 🚀 LIST SISWA */}
          {loading ? (
             <div className={styles.messageLoading} style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '12px' }}>
               <h3 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase' }}>Menyadap Data Kelas...</h3>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dataSiswaLive.map((siswa, idx) => {
                const isSelesai = siswa.status === "SELESAI";
                const isMengerjakan = siswa.status === "MENGERJAKAN";
                
                let bgRow = '#f8fafc';
                let statusIkon = <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>BELUM MASUK</span>;
                
                if (isSelesai) {
                  bgRow = '#dcfce3'; 
                  statusIkon = <span style={{ color: '#166534', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheckDouble /> SKOR: {siswa.skor}</span>;
                } else if (isMengerjakan) {
                  bgRow = '#fef08a'; 
                  // 🚀 UBAH LABEL DI SINI MENJADI LEBIH RELEVAN
                  statusIkon = <span style={{ color: '#b45309', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}><FaClock /> AKTIF (BISA UJIAN)</span>;
                }

                return (
                  <div key={idx} style={{ background: bgRow, padding: '16px', borderRadius: '12px', border: '3px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '4px 4px 0 #111827' }}>
                    
                    {/* Info Siswa */}
                    <div style={{ flex: '1 1 auto' }}>
                      <h4 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '15px', fontWeight: '900', textTransform: 'uppercase' }}>
                        {idx + 1}. {siswa.nama}
                      </h4>
                      {statusIkon}
                    </div>

                    {/* Anti-Cheat & God Mode */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      
                      {siswa.pelanggaran > 0 && !isSelesai && (
                        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 8px', border: '2px solid #ef4444', borderRadius: '6px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaTriangleExclamation /> {siswa.pelanggaran}x
                        </div>
                      )}

                      {/* God Mode Buttons */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                         {isMengerjakan && (
                           <button 
                             onClick={() => handleForceSubmit(siswa.id, siswa.nama)} 
                             disabled={isProcessing}
                             title="Tutup Paksa Akses Ujian (Beri Nilai 0)" 
                             style={{ background: '#ef4444', border: '2px solid #111827', color: 'white', width: '36px', height: '36px', borderRadius: '8px', cursor: isProcessing ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '2px 2px 0 #111827' }}>
                             <FaPowerOff size={14} />
                           </button>
                         )}
                         {isSelesai && (
                           <button 
                             onClick={() => handleResetSiswa(siswa.id, siswa.nama)} 
                             disabled={isProcessing}
                             title="Hapus / Reset Nilai Siswa" 
                             style={{ background: '#111827', border: '2px solid #111827', color: 'white', width: '36px', height: '36px', borderRadius: '8px', cursor: isProcessing ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '2px 2px 0 #475569' }}>
                             <FaSkull size={14} />
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}