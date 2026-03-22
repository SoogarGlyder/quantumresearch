import { PERIODE_BELAJAR, PREFIX_BARCODE, LIMIT_DATA } from "./constants"; // 👈 Import Konstanta

const TZ = PERIODE_BELAJAR.TIMEZONE;

// ============================================================================
// 1. FORMATTING WAKTU & TANGGAL
// ============================================================================
export function formatTanggal(tanggalString) {
  if (!tanggalString) return "-";
  const d = new Date(tanggalString);
  if (isNaN(d)) return "-";

  return d.toLocaleDateString('id-ID', { 
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export function formatJam(waktuString) {
  if (!waktuString) return "--:--";
  const d = new Date(waktuString);
  if (isNaN(d)) return "--:--";

  return d.toLocaleTimeString('id-ID', { 
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(/\./g, ':');
}

export function formatYYYYMMDD(tanggalString) {
  if (!tanggalString) return "";
  const d = new Date(tanggalString);
  if (isNaN(d)) return "";
  return d.toLocaleDateString('en-CA', { timeZone: TZ }).split('T')[0];
}

export function formatBulanTahun(tanggalString = new Date()) {
  if (!tanggalString) return "";
  const d = new Date(tanggalString);
  if (isNaN(d)) return "";
  
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ, month: 'long', year: 'numeric'
  });
  return formatter.format(d);
}

// ============================================================================
// 2. LOGIKA & MANIPULASI DATA
// ============================================================================
export function kapitalisasi(teks) {
  if (!teks) return "-";
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

export function hitungDurasiMenit(waktuMulai, waktuSelesai) {
  if (!waktuMulai || !waktuSelesai) return 0;
  const d1 = new Date(waktuMulai);
  const d2 = new Date(waktuSelesai);
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.max(0, Math.floor((d2 - d1) / 60000));
}

export function potongDataPagination(dataArray = [], pageSaatIni = 1, itemsPerPage = LIMIT_DATA.PAGINATION_DEFAULT) { // 👈 Default dari Konstanta
  if (!Array.isArray(dataArray)) return { totalPage: 0, dataTerpotong: [] };
  const totalPage = Math.max(1, Math.ceil(dataArray.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, pageSaatIni), totalPage); 
  const dataTerpotong = dataArray.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  return { totalPage, dataTerpotong };
}

export function ekstrakKeteranganAbsen(statusStr) {
  if (!statusStr) return "";
  const match = statusStr.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
}

export function bersihkanBarcode(rawCode, prefix = PREFIX_BARCODE.KELAS) { // 👈 Default dari Konstanta
  if (!rawCode) return "";
  return rawCode.replace(prefix, "");
}

// ============================================================================
// 3. VALIDATOR & UI HELPERS
// ============================================================================
export function cekPesanErrorScanner(pesanSistem) {
  if (!pesanSistem || typeof pesanSistem !== "string") return false;
  // Ini tetap aman dihardcode karena ini pengecekan sentimen error UI
  const kataError = ["gagal", "ups", "salah", "maaf", "belum", "sabar", "luar", "tolak", "oops"]; 
  const pesanKecil = pesanSistem.toLowerCase();
  return kataError.some(kata => pesanKecil.includes(kata));
}