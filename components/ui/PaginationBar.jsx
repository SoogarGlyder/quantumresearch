"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import styles from "./PaginationBar.module.css";

export default function PaginationBar({ totalPages }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 🛡️ PENAWAR: Pastikan angka valid dan tidak tembus batas
  const rawPage = Number(searchParams.get("page"));
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  let currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  
  // Jangan biarkan user berada di halaman 5 jika total halaman cuma 2
  if (currentPage > safeTotal) currentPage = safeTotal;

  // Jika cuma 1 halaman, sembunyikan pagination
  if (safeTotal <= 1) return null;

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    
    // Validasi ulang sebelum ubah URL
    if (newPage > 1 && newPage <= safeTotal) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page"); 
    }

    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.wadahPagination}>
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