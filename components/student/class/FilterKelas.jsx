"use client";

import { memo } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import classStyles from "@/components/student/class/Class.module.css";

const FilterKelas = memo(({ searchQuery, setSearchQuery }) => (
  <div className={classStyles.filterWrapper}>
    <span className={classStyles.filterIkonCari} aria-hidden="true">
      <FaMagnifyingGlass size={18} />
    </span>
    <input
      type="text"
      placeholder="Cari mapel, bab, sub-bab, atau isi jurnal..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className={classStyles.filterInput}
      aria-label="Cari riwayat kelas"
    />
  </div>
));

FilterKelas.displayName = "FilterKelas";
export default FilterKelas;