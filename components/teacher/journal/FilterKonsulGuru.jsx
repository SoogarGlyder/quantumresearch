"use client";

import { memo } from "react";
import styles from "@/components/App.module.css";

const FilterKonsulGuru = memo(({ 
  filterBulan, setFilterBulan, opsiBulan = [], 
  filterMapel, setFilterMapel, opsiMapel = [], 
  filterKelas, setFilterKelas, opsiKelas = [], 
  ringkasanFilter 
}) => (
  <div className={styles.filterContainer} style={{ padding: '16px' }}>
    
    <div className={styles.containerDropdownFilter} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      
      <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={styles.filterOption} style={{ flex: '1 1 30%', minWidth: '100px' }}>
        <option value="">Semua Bulan</option>
        {opsiBulan.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      
      <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className={styles.filterOption} style={{ flex: '1 1 30%', minWidth: '100px' }}>
        <option value="">Semua Mapel</option>
        {opsiMapel.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

    </div>

    <div className={styles.containerDropdownFilter} style={{ paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      
      {/*  FIX: Dropdown Pengajar diubah menjadi Dropdown Kelas */}
      <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className={styles.filterOption} style={{ flex: '1 1 30%', minWidth: '100px' }}>
        <option value="">Semua Kelas</option>
        {opsiKelas.map(k => <option key={k} value={k}>{k}</option>)}
      </select>

    </div>

    {ringkasanFilter && (
      <div style={{ 
        marginTop: '16px', backgroundColor: '#dbeafe', border: '3px solid #111827', 
        borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', boxShadow: '4px 4px 0 #111827', width: '100%',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>
            Total Durasi Bimbingan
          </p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#111827' }}>
            {ringkasanFilter.jam > 0 ? `${ringkasanFilter.jam} Jam ` : ""}
            {ringkasanFilter.menit} Menit
          </h3>
        </div>
        <div style={{ 
          backgroundColor: '#1e3a8a', color: '#facc15', border: '2px solid #111827', 
          padding: '8px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '13px', 
          boxShadow: '2px 2px 0 #111827' 
        }}>
          {ringkasanFilter.totalSesiSelesai} Sesi
        </div>
      </div>
    )}
  </div>
));

FilterKonsulGuru.displayName = "FilterKonsulGuru";
export default FilterKonsulGuru;