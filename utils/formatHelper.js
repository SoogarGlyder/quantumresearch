// ============================================================================
// 1. FORMATTING WAKTU & TANGGAL (WIB SAFE)
// ============================================================================

export function formatTanggal(tanggalString) {
  if (!tanggalString) return "-";
  const d = new Date(tanggalString);
  if (isNaN(d)) return "-";

  return d.toLocaleDateString('id-ID', { 
    timeZone: 'Asia/Jakarta',
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
}

export function formatJam(waktuString) {
  if (!waktuString) return "--:--";
  const d = new Date(waktuString);
  if (isNaN(d)) return "--:--";

  // 👇 Tweak: Ganti titik menjadi titik dua jika locale id-ID memberikan titik
  return d.toLocaleTimeString('id-ID', { 
    timeZone: 'Asia/Jakarta',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  }).replace(/\./g, ':');
}

export function formatYYYYMMDD(tanggalString) {
  if (!tanggalString) return "";
  const d = new Date(tanggalString);
  if (isNaN(d)) return "";

  // en-CA menghasilkan format YYYY-MM-DD yang bersih
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

// ============================================================================
// 2. LOGIKA & MANIPULASI DATA
// ============================================================================

/**
 * Mengubah "alpa" menjadi "Alpa" untuk kebutuhan UI
 */
export function kapitalisasi(teks) {
  if (!teks) return "-";
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

export function hitungDurasiMenit(waktuMulai, waktuSelesai) {
  if (!waktuMulai || !waktuSelesai) return 0;
  const d1 = new Date(waktuMulai);
  const d2 = new Date(waktuSelesai);
  if (isNaN(d1) || isNaN(d2)) return 0;

  const selisihMs = d2 - d1;
  return Math.max(0, Math.floor(selisihMs / 60000));
}

export function potongDataPagination(dataArray = [], pageSaatIni = 1, itemsPerPage = 20) {
  if (!Array.isArray(dataArray)) return { totalPage: 0, dataTerpotong: [] };
  const totalPage = Math.max(1, Math.ceil(dataArray.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, pageSaatIni), totalPage); 
  const dataTerpotong = dataArray.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  
  return { totalPage, dataTerpotong };
}

/**
 * Membersihkan kode barcode dari prefix (Contoh: KELAS_123 -> 123)
 */
export function bersihkanBarcode(rawCode, prefix = "KELAS_") {
  if (!rawCode) return "";
  return rawCode.replace(prefix, "");
}

// ============================================================================
// 3. VALIDATOR & UI HELPERS
// ============================================================================

export function cekPesanErrorScanner(pesanSistem) {
  if (!pesanSistem || typeof pesanSistem !== "string") return false;
  const kataError = ["gagal", "ups", "salah", "maaf", "belum", "sabar"];
  const pesanKecil = pesanSistem.toLowerCase();
  return kataError.some(kata => pesanKecil.includes(kata));
}