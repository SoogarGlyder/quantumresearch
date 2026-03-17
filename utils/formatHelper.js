// ============================================================================
// 1. FORMATTING WAKTU & TANGGAL (Aman Zona Waktu WIB)
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

  return d.toLocaleTimeString('id-ID', { 
    timeZone: 'Asia/Jakarta',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function formatYYYYMMDD(tanggalString) {
  if (!tanggalString) return "";
  const d = new Date(tanggalString);
  if (isNaN(d)) return "";

  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

export function formatBulanTahun(tanggalString) {
  const formatPenuh = formatYYYYMMDD(tanggalString);
  if (!formatPenuh) return "";
  
  return formatPenuh.substring(0, 7);
}

export function hitungDurasiMenit(waktuMulai, waktuSelesai) {
  if (!waktuMulai || !waktuSelesai) return 0;
  const d1 = new Date(waktuMulai);
  const d2 = new Date(waktuSelesai);
  
  if (isNaN(d1) || isNaN(d2)) return 0;

  const selisihMs = d2 - d1;
  return Math.max(0, Math.floor(selisihMs / 60000));
}

// ============================================================================
// 2. MANIPULASI DATA (ARRAY & STRING)
// ============================================================================
export function potongDataPagination(dataArray = [], pageSaatIni = 1, itemsPerPage = 20) {
  if (!Array.isArray(dataArray)) return { totalPage: 0, dataTerpotong: [] };

  const totalPage = Math.max(1, Math.ceil(dataArray.length / itemsPerPage));
  
  const safePage = Math.min(Math.max(1, pageSaatIni), totalPage); 
  
  const dataTerpotong = dataArray.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  
  return { totalPage, dataTerpotong };
}

export function ekstrakKeteranganAbsen(statusString) {
  let keterangan = "Alpa";
  let catatan = "";

  if (!statusString || typeof statusString !== "string") {
    return { keterangan, catatan };
  }

  const match = statusString.match(/-\s*([^(]+)(?:\(([^)]+)\))?/);
  
  if (match) {
    keterangan = match[1] ? match[1].trim() : "Alpa";
    catatan = match[2] ? match[2].trim() : "";
  }
  
  return { keterangan, catatan };
}

export function cekPesanErrorScanner(pesanSistem) {
  if (!pesanSistem || typeof pesanSistem !== "string") return false;
  
  const kataError = ["gagal", "ups", "salah", "pagi", "maaf", "baru"];
  const pesanKecil = pesanSistem.toLowerCase();
  
  return kataError.some(kata => pesanKecil.includes(kata));
}