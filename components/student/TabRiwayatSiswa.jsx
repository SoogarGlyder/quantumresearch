"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo } from "react"; 
import Image from "next/image"; 

// 👈 Import Konstanta Lengkap
import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR } from "../../utils/constants";
import { formatTanggal, hitungDurasiMenit, formatJam } from "../../utils/formatHelper";

import { FaFilter, FaBoxOpen, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import styles from "../StudentApp.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB RIWAYAT KONSUL)
// ============================================================================
export default function TabRiwayat({ riwayat = [] }) {
  
  const [filterBulan, setFilterBulan] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [idTerbuka, setIdTerbuka] = useState(null);

  // --- HELPER TIMEZONE LOKAL (🛡️ ZERO HARDCODE) ---
  const dapatkanLabelBulan = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString('id-ID', { 
      timeZone: PERIODE_BELAJAR.TIMEZONE, 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // --- HANDLERS ---
  const toggleDetail = (id) => {
    setIdTerbuka(prevId => prevId === id ? null : id);
  };

  // Filter khusus untuk tipe sesi Konsul
  const riwayatKonsul = useMemo(() => {
    return riwayat.filter(r => r.jenisSesi === TIPE_SESI.KONSUL);
  }, [riwayat]);
  
  const opsiBulan = useMemo(() => {
    return [...new Set(riwayatKonsul.map(r => dapatkanLabelBulan(r.waktuMulai)))];
  }, [riwayatKonsul]);
  
  const opsiMapel = useMemo(() => {
    return [...new Set(riwayatKonsul.map(r => r.namaMapel || "Umum"))];
  }, [riwayatKonsul]);

  const konsulDitampilkan = useMemo(() => {
    return riwayatKonsul.filter(r => {
      const labelBulanIni = dapatkanLabelBulan(r.waktuMulai);
      const namaMapelIni = r.namaMapel || "Umum";

      const matchBulan = filterBulan ? labelBulanIni === filterBulan : true;
      const matchMapel = filterMapel ? namaMapelIni === filterMapel : true;
      
      return matchBulan && matchMapel;
    });
  }, [riwayatKonsul, filterBulan, filterMapel]);


  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={styles.wadahTabRiwayat}>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER HALAMAN */}
      {/* ------------------------------------------------------------- */}
      <div className={`${styles.headerHalaman} ${styles.stickyTop}`}>
        <div className={styles.hiasanBulat1}></div>
        <div className={styles.hiasanBulat2}></div>
        <div className={styles.wadahLogoTengah}>
          <div className={styles.kotakLogo}>
            <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} className={styles.logoScannerPudar} priority />
          </div>
        </div>
        <h1 className={styles.judulHalaman}>Record Konsul</h1>
      </div>
      
      {/* ------------------------------------------------------------- */}
      {/* FILTER DATA */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.wadahFilter}>
        <div className={styles.headerFilter}>
           <FaFilter color="#111827" size={14} />
           <span className={styles.labelFilter}>Filter Data:</span>
        </div>
        <div className={styles.wadahDropdownFilter}>
          
          <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={styles.opsiFilter}>
            <option value="">Semua Bulan</option>
            {opsiBulan.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          
          <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className={styles.opsiFilter}>
            <option value="">Semua Mapel</option>
            {opsiMapel.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DAFTAR RIWAYAT KONSUL (ACCORDION) */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.wadahDaftarRiwayat}>
        {konsulDitampilkan.length === 0 ? (
          
          <div className={styles.wadahKosong} style={{ padding: '40px', textAlign: 'center' }}>
            <FaBoxOpen className={styles.ikonKosong} />
            <p className={styles.teksKosong}>Belum ada record konsul.</p>
          </div>
          
        ) : (
          
          konsulDitampilkan.map(sesi => {
            // 🛡️ ZERO HARDCODE: Cek Status Selesai
            const isSelesai = sesi.status === STATUS_SESI.SELESAI.id;
            const isOpen = idTerbuka === sesi._id;

            return (
              <div 
                key={sesi._id} 
                className={`${styles.kartuRiwayat} ${styles.kartuRiwayatClickable}`}
                onClick={() => toggleDetail(sesi._id)}
              >
                
                <div className={styles.barisAtasRiwayat}>
                    <div>
                      <p className={styles.teksTanggalRiwayat}>
                        {formatTanggal(sesi.waktuMulai)}
                      </p>
                      <h3 className={`${styles.judulRiwayat} ${styles.judulRiwayatUkuran}`}>
                        {sesi.namaMapel || "Umum"}
                      </h3>
                    </div>
                    
                    <div className={styles.wadahStatusKanan} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span 
                        className={styles.badgeStatus} 
                        style={{
                          backgroundColor: isSelesai ? '#4ade80' : '#facc15',
                          color: '#111827'
                        }}
                      >
                        {/* Kapitalisasi status untuk tampilan UI yang rapi */}
                        {sesi.status.charAt(0).toUpperCase() + sesi.status.slice(1)}
                      </span>
                      
                      {isSelesai && (
                        <p className={styles.teksDurasiRiwayat}>
                          ⏱️ {hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)}m
                        </p>
                      )}
                      
                      <div style={{ marginTop: '12px', color: '#111827', transition: 'transform 0.2s' }}>
                        {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                      </div>
                    </div>
                </div>

                {isOpen && (
                  <div className={styles.detailRiwayat}>
                      <div className={styles.barisWaktuDetail} style={{ backgroundColor: '#dbeafe' }}>
                        <span>Mulai</span>
                        <span>{formatJam(sesi.waktuMulai)} WIB</span>
                      </div>
                      <div className={styles.barisWaktuDetail} style={{ backgroundColor: isSelesai ? '#dcfce3' : '#fef08a' }}>
                        <span>Selesai</span>
                        <span>{isSelesai ? `${formatJam(sesi.waktuSelesai)} WIB` : 'Sedang Berjalan...'}</span>
                      </div>
                  </div>
                )}
                
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}