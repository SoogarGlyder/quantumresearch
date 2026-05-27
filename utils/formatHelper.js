import { PREFIX_BARCODE, LIMIT_DATA } from "./constants";

// ============================================================================
// FORMAT HELPER
// ============================================================================

export const formatHelper = {
  /**
   * @param {string} teks
   * @returns {string}
   * @example
   * formatHelper.kapitalisasi("selesai") // "Selesai"
   */
  kapitalisasi: (teks) => {
    if (!teks || typeof teks !== "string") return "-";
    return teks.charAt(0).toUpperCase() + teks.slice(1);
  },

  /**
   * @param {Array}  [dataArray=[]]
   * @param {number} [pageSaatIni=1]
   * @param {number} [itemsPerPage=LIMIT_DATA.PAGINATION_DEFAULT]
   * @returns {{ totalPage: number, dataTerpotong: Array }}
   */
  potongDataPagination: (
    dataArray = [],
    pageSaatIni = 1,
    itemsPerPage = LIMIT_DATA.PAGINATION_DEFAULT
  ) => {
    if (!Array.isArray(dataArray)) return { totalPage: 0, dataTerpotong: [] };

    const totalPage    = Math.max(1, Math.ceil(dataArray.length / itemsPerPage));
    const safePage     = Math.min(Math.max(1, pageSaatIni), totalPage);
    const dataTerpotong = dataArray.slice(
      (safePage - 1) * itemsPerPage,
      safePage * itemsPerPage
    );

    return { totalPage, dataTerpotong };
  },

  /**
   * @param {string} statusStr
   * @returns {string}
   */
  ekstrakKeteranganAbsen: (statusStr) => {
    if (!statusStr || typeof statusStr !== "string") return "";
    const match = statusStr.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
  },

  /**
   * @param {string} rawCode
   * @param {string} [prefix=PREFIX_BARCODE.KELAS]
   * @returns {string}
   */
  bersihkanBarcode: (rawCode, prefix = PREFIX_BARCODE.KELAS) => {
    if (!rawCode || typeof rawCode !== "string") return "";
    return rawCode.startsWith(prefix) ? rawCode.slice(prefix.length) : rawCode;
  },

  /**
   * Mendeteksi apakah pesan dari scanner merupakan pesan error.
   * Sangat berguna untuk mengubah UI alert/toast menjadi warna merah.
   * @param {string} pesan
   * @returns {boolean}
   */
  cekPesanErrorScanner: (pesan) => {
    if (!pesan || typeof pesan !== "string") return false;
    
    const pesanLower = pesan.toLowerCase();
    
    return (
      pesan.includes("⚠️") ||
      pesan.includes("⛔") ||
      pesanLower.includes("gagal") ||
      pesanLower.includes("ditolak") ||
      pesanLower.includes("tidak valid") ||
      pesanLower.includes("kedaluwarsa")
    );
  },
};