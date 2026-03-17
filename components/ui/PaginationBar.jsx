"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import styles from "./PaginationBar.module.css";

export default function PaginationBar({ currentPage, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  
  return (
    <div className={styles.wadahPagination}>
      
      {/* Tombol Mundur */}
      <button 
        disabled={currentPage === 1} 
        onClick={() => setPage(currentPage - 1)}
        className={styles.tombolPage}
        aria-label="Halaman Sebelumnya"
      >
        <FaChevronLeft /> Prev
      </button>

      {/* Indikator Posisi */}
      <span className={styles.teksHalaman}>
        Hal {currentPage} / {totalPages}
      </span>

      {/* Tombol Maju */}
      <button 
        disabled={currentPage === totalPages} 
        onClick={() => setPage(currentPage + 1)}
        className={styles.tombolPage}
        aria-label="Halaman Selanjutnya"
      >
        Next <FaChevronRight />
      </button>

    </div>
  );
}