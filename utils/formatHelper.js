import { PREFIX_BARCODE, LIMIT_DATA } from "./constants"; 

export const formatHelper = {
  /**
   * Mengubah huruf pertama menjadi kapital.
   */
  kapitalisasi: (teks) => {
    if (!teks || typeof teks !== "string") return "-";
    return teks.charAt(0).toUpperCase() + teks.slice(1);
  },

  /**
   * Memotong array data untuk keperluan Pagination halaman.
   */
  potongDataPagination: (dataArray = [], pageSaatIni = 1, itemsPerPage = LIMIT_DATA.PAGINATION_DEFAULT) => {
    if (!Array.isArray(dataArray)) return { totalPage: 0, dataTerpotong: [] };
    const totalPage = Math.max(1, Math.ceil(dataArray.length / itemsPerPage));
    const safePage = Math.min(Math.max(1, pageSaatIni), totalPage); 
    const dataTerpotong = dataArray.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
    return { totalPage, dataTerpotong };
  },

  /**
   * Mengambil teks di dalam kurung dari sebuah string status.
   */
  ekstrakKeteranganAbsen: (statusStr) => {
    if (!statusStr || typeof statusStr !== "string") return "";
    const match = statusStr.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
  },

  /**
   * Membersihkan prefix barcode hasil scan.
   */
  bersihkanBarcode: (rawCode, prefix = PREFIX_BARCODE.KELAS) => {
    if (!rawCode || typeof rawCode !== "string") return "";
    return rawCode.replace(prefix, "");
  },

  /**
   * Mendeteksi apakah pesan balasan dari server mengandung unsur Error.
   */
  cekPesanErrorScanner: (pesanSistem) => {
    if (!pesanSistem || typeof pesanSistem !== "string") return false;
    const kataError = ["gagal", "ups", "salah", "maaf", "belum", "sabar", "luar", "tolak", "oops"]; 
    const pesanKecil = pesanSistem.toLowerCase();
    return kataError.some(kata => pesanKecil.includes(kata));
  }
};