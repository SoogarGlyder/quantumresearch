"use client";

import { memo } from "react";
import styles from "@/components/App.module.css";

//FIX: Tangkap prop ringkasanFilter
const FilterKonsul = memo(({ filterBulan, setFilterBulan, opsiBulan, filterMapel, setFilterMapel, opsiMapel, ringkasanFilter }) => (
  <div className={styles.filterContainer}>
    <div className={styles.containerDropdownFilter}>
      <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={styles.filterOption}>
        <option value="">Semua Bulan</option>
        {opsiBulan.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      
      <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className={styles.filterOption}>
        <option value="">Semua Mapel</option>
        {opsiMapel.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>

    {/*FITUR BARU: Kotak Ringkasan Dinamis (Menempel dengan Filter) */}
    {ringkasanFilter && (
      <div style={{ 
        marginTop: '16px', backgroundColor: '#dbeafe', border: '3px solid #111827', 
        borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', boxShadow: '4px 4px 0 #111827', width: '100%',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>
            Total Waktu Konsul
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

FilterKonsul.displayName = "FilterKonsul";
export default FilterKonsul;