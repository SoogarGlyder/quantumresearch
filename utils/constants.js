// ============================================================================
// 1. PENGATURAN PERIODE (KONFIGURASI UTAMA)
// ============================================================================
export const PERIODE_BELAJAR = Object.freeze({
  ID: "Semester Genap 2025/2026",
  MULAI: "2026-03-02",
  AKHIR: "2026-03-28",
});

// ============================================================================
// 2. STATUS & TIPE DATA (SINKRON DENGAN DB & ACTIONS)
// ============================================================================
export const TIPE_SESI = Object.freeze({
  KELAS: "kelas",
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
  MASUK: "masuk",
  PULANG: "pulang",
  // Alias untuk UI lama
  KELAS: "kelas",
  KONSUL: "konsul",
});

export const PREFIX_BARCODE = Object.freeze({
  KELAS: "QR-KLS-",   // 👈 Gunakan prefix yang sinkron dengan scanAction.js
  KONSUL: "QR-KONSUL",
  ADMIN: "QR-ADMIN-STAFF"
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

export const OPSI_MAPEL = Object.freeze([
  "Matematika", "IPA", "Fisika", "Kimia", "Biologi",
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

// 🕵️ ALIAS: Penebus Dosa Error Vercel (Menyediakan variabel yang dicari UI lama)
export const OPSI_MAPEL_KELAS = OPSI_MAPEL;
export const OPSI_MAPEL_KONSUL = OPSI_MAPEL;

export const OPSI_KETERANGAN_ABSEN = Object.freeze([
  { label: "Alpa", value: "alpa" },
  { label: "Sakit", value: "sakit" },
  { label: "Izin", value: "izin" }
]);