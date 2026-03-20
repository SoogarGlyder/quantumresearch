"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import styles from "./PaginationBar.module.css";

export default function PaginationBar({ totalPages }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 1. Ambil halaman aktif dari URL (default ke 1 jika tidak ada)
  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null;

  // 2. Fungsi sakti untuk mengubah URL tanpa reload halaman
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page"); // Bersihkan URL jika balik ke hal 1
    }

    // Update URL secara halus (shallow routing)
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.wadahPagination}>
      
      {/* Tombol Mundur */}
      <button 
        disabled={currentPage <= 1} 
        onClick={() => handlePageChange(currentPage - 1)}
        className={styles.tombolPage}
        aria-label="Halaman Sebelumnya"
      >
        <FaChevronLeft /> Prev
      </button>

      {/* Indikator Posisi */}
      <span className={styles.teksHalaman}>
        Hal <b>{currentPage}</b> / {totalPages}
      </span>

      {/* Tombol Maju */}
      <button 
        disabled={currentPage >= totalPages} 
        onClick={() => handlePageChange(currentPage + 1)}
        className={styles.tombolPage}
        aria-label="Halaman Selanjutnya"
      >
        Next <FaChevronRight />
      </button>

    </div>
  );
}