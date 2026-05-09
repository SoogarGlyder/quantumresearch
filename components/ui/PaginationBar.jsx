"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import styles from "./PaginationBar.module.css";

// 🚀 FIX: Komponen kini menerima currentPage dan onPageChange dari Induk
export default function PaginationBar({ 
  currentPage = 1, 
  totalPages, 
  onPageChange, 
  className = "", 
  style = {} 
}) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  
  // Pastikan currentPage tidak melebihi total halaman 
  let safeCurrentPage = Number(currentPage);
  if (isNaN(safeCurrentPage) || safeCurrentPage < 1) safeCurrentPage = 1;
  if (safeCurrentPage > safeTotal) safeCurrentPage = safeTotal;

  // Jika cuma 1 halaman, sembunyikan pagination
  if (safeTotal <= 1) return null;

  return (
    <div className={`${styles.wadahPagination} ${className}`} style={style}>
      <button 
        disabled={safeCurrentPage <= 1} 
        onClick={() => onPageChange(safeCurrentPage - 1)}
        className={styles.tombolPage}
        aria-label="Halaman Sebelumnya"
      >
        <FaChevronLeft /> Prev
      </button>

      <span className={styles.teksHalaman}>
        <b>{safeCurrentPage}</b> / {safeTotal}
      </span>

      <button 
        disabled={safeCurrentPage >= safeTotal} 
        onClick={() => onPageChange(safeCurrentPage + 1)}
        className={styles.tombolPage}
        aria-label="Halaman Selanjutnya"
      >
        Next <FaChevronRight />
      </button>
    </div>
  );
}