"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import styles from "./PaginationBar.module.css";

/**
 * @param {{
 *   currentPage?: number,
 *   totalPages: number,
 *   onPageChange: (page: number) => void,
 *   className?: string,
 *   style?: React.CSSProperties,
 * }} props
 */
export default function PaginationBar({
  currentPage  = 1,
  totalPages,
  onPageChange,
  className    = "",
  style        = {},
}) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);

  let safePage = Number(currentPage);
  if (isNaN(safePage) || safePage < 1) safePage = 1;
  if (safePage > safeTotal)            safePage = safeTotal;

  if (safeTotal <= 1) return null;

  return (
    <div
      className={`${styles.wadahPagination} ${className}`}
      style={style}
      role="navigation"
      aria-label="Navigasi halaman"
    >
      <button
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
        className={styles.tombolPage}
        aria-label="Halaman sebelumnya"
      >
        <FaChevronLeft aria-hidden="true" /> Prev
      </button>

      <span className={styles.teksHalaman} aria-live="polite">
        <b>{safePage}</b> / {safeTotal}
      </span>

      <button
        disabled={safePage >= safeTotal}
        onClick={() => onPageChange(safePage + 1)}
        className={styles.tombolPage}
        aria-label="Halaman selanjutnya"
      >
        Next <FaChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}