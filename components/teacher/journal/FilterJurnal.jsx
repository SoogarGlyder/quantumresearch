"use client";

import { memo } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";

const FilterJurnal = memo(({ searchQuery, setSearchQuery }) => (
  <div style={{ margin: '16px 16px -8px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: '14px', left: '16px', color: '#6b7280' }}>
      <FaMagnifyingGlass size={18} />
    </div>
    <input
      type="text"
      placeholder="Cari mapel, kelas, tanggal, atau status jurnal..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 16px 12px 42px',
        borderRadius: '12px',
        border: '3px solid #111827',
        fontSize: '15px',
        fontWeight: '900',
        color: '#111827',
        boxShadow: '3px 3px 0 #111827',
        outline: 'none',
        backgroundColor: '#ffffff'
      }}
    />
  </div>
));

FilterJurnal.displayName = "FilterJurnal";
export default FilterJurnal;