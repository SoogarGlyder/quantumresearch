"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import styles from "./PaginationBar.module.css";

export default function PaginationBar({ totalPages, className = "", style = {} }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const rawPage = Number(searchParams.get("page"));
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  let currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  
  if (currentPage > safeTotal) currentPage = safeTotal;

  // Jika cuma 1 halaman, sembunyikan pagination
  if (safeTotal <= 1) return null;

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    
    if (newPage > 1 && newPage <= safeTotal) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page"); 
    }

    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={`${styles.wadahPagination} ${className}`} style={style}>
      <button 
        disabled={currentPage <= 1} 
        onClick={() => handlePageChange(currentPage - 1)}
        className={styles.tombolPage}
        aria-label="Halaman Sebelumnya"
      >
        <FaChevronLeft /> Prev
      </button>

      <span className={styles.teksHalaman}>
        Hal <b>{currentPage}</b> / {safeTotal}
      </span>

      <button 
        disabled={currentPage >= safeTotal} 
        onClick={() => handlePageChange(currentPage + 1)}
        className={styles.tombolPage}
        aria-label="Halaman Selanjutnya"
      >
        Next <FaChevronRight />
      </button>
    </div>
  );
}