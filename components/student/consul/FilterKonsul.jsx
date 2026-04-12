"use client";

import { memo } from "react";
import styles from "@/components/App.module.css";

const FilterKonsul = memo(({ filterBulan, setFilterBulan, opsiBulan, filterMapel, setFilterMapel, opsiMapel }) => (
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
  </div>
));

FilterKonsul.displayName = "FilterKonsul";
export default FilterKonsul;