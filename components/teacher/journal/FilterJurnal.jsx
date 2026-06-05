"use client";

import { memo } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import journalStyles from "@/components/teacher/journal/Journal.module.css";

const FilterJurnal = memo(({ searchQuery, setSearchQuery, placeholder = "Cari data..." }) => (
  <div className={journalStyles.filterJurnalWrapper}>
    <span className={journalStyles.ikonCari} aria-hidden="true">
      <FaMagnifyingGlass size={18} />
    </span>
    <input
      type="text"
      placeholder={placeholder}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className={journalStyles.filterJurnalInput}
      aria-label="Cari jurnal"
    />
  </div>
));

FilterJurnal.displayName = "FilterJurnal";
export default FilterJurnal;