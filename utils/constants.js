// ============================================================================
// 1. PENGATURAN PERIODE & LOKASI
// ============================================================================
export const PERIODE_BELAJAR = Object.freeze({
  ID: "Semester Genap 2025/2026",
  MULAI: "2026-03-28",
  AKHIR: "2026-04-25",
  TIMEZONE: "Asia/Jakarta",
  UTC_OFFSET: -7,
  ISO_OFFSET: "+07:00",
  LOKASI_HQ: {
    LAT: -6.1672807190869445,
    LNG: 106.87065857296675,
    RADIUS_METER: 100,
  }
});

export const EVENT_PENTING = Object.freeze({
  TANGGAL_UTBK: "2026-05-05T00:00:00+07:00",
});

// ============================================================================
// 2. OTORISASI & ROLE
// ============================================================================
export const PERAN = Object.freeze({
  SISWA: { id: "siswa", label: "Siswa", home: "/" },
  ADMIN: { id: "admin", label: "Administrator", home: "/admin" },
  PENGAJAR: { id: "pengajar", label: "Pengajar", home: "/" },
});

export const STATUS_USER = Object.freeze({
  AKTIF: "aktif",
  NONAKTIF: "tidak aktif",
});

// ============================================================================
// 3. LOGIKA SISTEM & AMBANG BATAS
// ============================================================================
export const KONFIGURASI_SISTEM = Object.freeze({
  BATAS_TERLAMBAT_MENIT: 15,
  DURASI_SESI_KELAS_MENIT: 90,
  DURASI_SESI_KONSUL_DEFAULT: 30,
  MAX_EXTRA_MENIT_KONSUL: 60,
  MIN_DURASI_BELAJAR_SAH: 15,
  MIN_DURASI_KONSUL_SAH: 5,
  WINDOW_SCAN_MASUK_MENIT: 30,
  TOAST_DELAY_MS: 3000,       // 👈 Durasi Toast notifikasi
  DEBOUNCE_DELAY_MS: 500,     // 👈 Durasi jeda ngetik di pencarian
  DEFAULT_PASSWORD: "password123",
  COOKIE_NAME: "karcis_quantum", // 👈 Nama Cookie Resmi
  COOKIE_ROLE: "peran_quantum",     // 👈 Pengganti const ROLE_KEY
  SESSION_MAX_AGE_DAYS: 7,          // 👈 Umur sesi (7 hari)
  SALT_ROUNDS: 10,                  // 👈 Kekuatan enkripsi password
  PATH_LOGIN: "/login",          // 👈 Path Login Resmi
});

// ============================================================================
// 4. STATUS, TIPE DATA & LABEL UI
// ============================================================================
export const TIPE_SESI = Object.freeze({
  KELAS: "kelas",
  KONSUL: "konsul",
});

export const STATUS_SESI = Object.freeze({
  SELESAI: { id: "selesai", label: "Selesai", color: "#4ade80", bg: "#dcfce3" },
  BERJALAN: { id: "berjalan", label: "Berjalan", color: "#facc15", bg: "#fef9c3" },
  TIDAK_HADIR: { id: "tidak hadir", label: "Tidak Hadir", color: "#9ca3af", bg: "#f3f4f6" },
  ALPA: { id: "alpa", label: "Alpa", color: "#ef4444", bg: "#fee2e2" },
  SAKIT: { id: "sakit", label: "Sakit", color: "#f97316", bg: "#ffedd5" },
  IZIN: { id: "izin", label: "Izin", color: "#3b82f6", bg: "#dbeafe" },
});

export const LABEL_SISTEM = Object.freeze({
  BELUM_ABSEN: "belum absen",
  DATA_KOSONG: "-",
  REDIRECT_CLEAR: "clear=true",
  PENCARIAN_DEFAULT: "Ketik di sini...",
});

// ============================================================================
// 5. KONFIGURASI MEDIA & STORAGE
// ============================================================================
export const KONFIGURASI_MEDIA = Object.freeze({
  MAX_UPLOAD_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  DOMAIN_RESMI: "res.cloudinary.com", // 👈 Pindahkan ke sini
  STORAGE_FOLDERS: {
    JURNAL: "jurnal-pembelajaran",
    ABSENSI: "bukti-absen",
    PROFIL: "foto-user",
  }
});

// ============================================================================
// 6. VALIDASI INPUT (Security Rules)
// ============================================================================
export const VALIDASI_SISTEM = Object.freeze({
  MIN_PASSWORD: 6,
  REGEX_USERNAME: /^[a-z0-9_.-]+$/,       // 👈 Sinkron dengan helper (ada penambahan minus '-')
  REGEX_PHONE: /^(08|628)\d{8,13}$/,      // 👈 Memindahkan regex WA ke sini
});

// ============================================================================
// 7. PESAN SISTEM (Standard Messages)
// ============================================================================
export const PESAN_SISTEM = Object.freeze({
  AKSES_DITOLAK: "Akses Ditolak! Anda tidak memiliki otoritas.",
  SESI_HABIS: "Sesi berakhir, silakan login kembali.",
  GAGAL_SIMPAN: "Gagal menyimpan data ke database.",
  SUKSES_SIMPAN: "Data berhasil disimpan!",
});

// ============================================================================
// 8. FORMAT WAKTU (Consistency)
// ============================================================================
export const FORMAT_WAKTU = Object.freeze({
  TANGGAL: "YYYY-MM-DD",
  JAM: "HH:mm",
  LENGKAP: "DD MMM YYYY, HH:mm",
});

// ============================================================================
// 9. KONFIGURASI SCANNER & BARCODE
// ============================================================================
export const PREFIX_BARCODE = Object.freeze({
  KELAS: "QR-KLS-",
  KONSUL: "QR-KONSUL",
  ADMIN: "QR-ADMIN-STAFF"
});

// 👇 TAMBAHKAN INI UNTUK MENGHILANGKAN ERROR
export const MODE_SCAN = Object.freeze({
  KELAS: "kelas",
  KONSUL: "konsul",
});

// ============================================================================
// 10. MASTER DATA DROPDOWN
// ============================================================================
export const OPSI_KELAS = Object.freeze([
  "7 SMP", "8 SMP", "9 SMP",
  "10 SMA", "11 IPA SMA", "11 IPS SMA",
  "12 IPA SMA", "12 IPS SMA",
  "Alumni / Gap Year",
]);

// Untuk Tab Jadwal (Admin) & Absen Kelas (Siswa)
export const OPSI_MAPEL_KELAS = Object.freeze([
  "Matematika", "IPA", "Fisika", "Kimia", "Biologi",
  "IPS", "Ekonomi", "Geografi", "Sosiologi", "Sejarah",
  "Bahasa Indonesia", "Bahasa Inggris",
  "Penalaran Umum (PU)", "Pemahaman Bacaan dan Menulis (PBM)",
  "Pengetahuan dan Pemahaman Umum (PPU)", "Pengetahuan Kuantitatif (PK)",
  "Literasi dalam Bahasa Indonesia (LBI)", "Literasi dalam Bahasa Inggris (LBE)",
  "Penalaran Matematika (PM)"
]);

// Untuk Tab Scanner Mode Konsul (Siswa)
export const OPSI_MAPEL_KONSUL = Object.freeze([
  "Matematika", "IPA", "Fisika", "Kimia", "Biologi",
  "IPS", "Ekonomi", "Geografi", "Sosiologi", "Sejarah",
  "Bahasa Indonesia", "Bahasa Inggris",
  "Penalaran Umum (PU)", "Pemahaman Bacaan dan Menulis (PBM)",
  "Pengetahuan dan Pemahaman Umum (PPU)", "Pengetahuan Kuantitatif (PK)",
  "Literasi dalam Bahasa Indonesia (LBI)", "Literasi dalam Bahasa Inggris (LBE)",
  "Penalaran Matematika (PM)"
]);

export const OPSI_KETERANGAN_ABSEN = Object.freeze([
  { label: STATUS_SESI.ALPA.label, value: STATUS_SESI.ALPA.id },
  { label: STATUS_SESI.SAKIT.label, value: STATUS_SESI.SAKIT.id },
  { label: STATUS_SESI.IZIN.label, value: STATUS_SESI.IZIN.id }
]);

// ============================================================================
// 11. DATA LIMITS
// ============================================================================
export const LIMIT_DATA = Object.freeze({
  DASHBOARD_HISTORY: 50,
  PAGINATION_DEFAULT: 20,
  PAGNATION_KELAS: 4,
  PAGNATION_KONSUL: 10
});