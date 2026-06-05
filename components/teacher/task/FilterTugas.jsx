"use client";

import { memo } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import taskStyles from "@/components/teacher/task/Task.module.css";

const FilterTugas = memo(({ searchQuery, setSearchQuery }) => (
  <div className={taskStyles.filterWrapper}>
    <span className={taskStyles.filterIkonCari} aria-hidden="true">
      <FaMagnifyingGlass size={18} />
    </span>
    <input
      type="text"
      placeholder="Cari judul, target kelas, atau pembuat..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className={taskStyles.filterInput}
      aria-label="Cari tugas atau bank soal"
    />
  </div>
));

FilterTugas.displayName = "FilterTugas";
export default FilterTugas;