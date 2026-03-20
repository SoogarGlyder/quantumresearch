// ============================================================================
// 1. PENGATURAN PERIODE (KONFIGURASI UTAMA)
// ============================================================================
export const PERIODE_BELAJAR = Object.freeze({
  MULAI: "2026-03-02",
  AKHIR: "2026-03-28",
});

// ============================================================================
// 2. STATUS & TIPE DATA (SINKRON DENGAN DB ENUMS)
// ============================================================================
export const TIPE_SESI = Object.freeze({
  KELAS: "kelas",   // 👈 Gunakan lowercase agar cocok dengan Model DB
  KONSUL: "konsul",
});

export const STATUS_SESI = Object.freeze({
  SELESAI: "selesai",
  BERJALAN: "berjalan",
  TIDAK_HADIR: "tidak hadir",
  ALPA: "alpa",
  SAKIT: "sakit",
  IZIN: "izin",
});

// ============================================================================
// 3. KONFIGURASI SCANNER QR (STANDARISASI)
// ============================================================================
export const MODE_SCAN = Object.freeze({
  KELAS: "kelas",
  KONSUL: "konsul",
});

export const PREFIX_BARCODE = Object.freeze({
  KELAS: "KELAS_",
  KONSUL: "KONSUL_", // 👈 Tambah underscore agar konsisten panjangnya
});

// ============================================================================
// 4. PILIHAN DROPDOWN (UI OPTIONS)
// ============================================================================
export const OPSI_KELAS = Object.freeze([
  "7 SMP", "8 SMP", "9 SMP",
  "10 SMA", "11 IPA SMA", "11 IPS SMA",
  "12 IPA SMA", "12 IPS SMA",
  "Alumni / Gap Year",
]);

// Gabungkan mapel agar maintenance satu pintu
export const OPSI_MAPEL = Object.freeze([
  "Matematika",
  "IPA", "Fisika", "Kimia", "Biologi",
  "IPS", "Ekonomi", "Geografi", "Sosiologi", "Sejarah",
  "Bahasa Indonesia", "Bahasa Inggris",
  "Penalaran Umum (PU)",
  "Pemahaman Bacaan dan Menulis (PBM)",
  "Pengetahuan dan Pemahaman Umum (PPU)",
  "Pengetahuan Kuantitatif (PK)",
  "Literasi dalam Bahasa Indonesia (LBI)",
  "Literasi dalam Bahasa Inggris (LBE)",
  "Penalaran Matematika (PM)"
]);

export const OPSI_KETERANGAN_ABSEN = Object.freeze([
  { label: "Alpa", value: "alpa" },
  { label: "Sakit", value: "sakit" },
  { label: "Izin", value: "izin" }
]);