// ============================================================================
// 1. PENGATURAN PERIODE & LOKASI
// ============================================================================
export const PERIODE_BELAJAR = Object.freeze({
  ID: "Tahun Ajaran 2025/2026", // 👈 Diubah agar sesuai dengan 1 tahun
  MULAI: "2025-06-29",          // 👈 Pagar Awal (29 Juni 2025)
  AKHIR: "2026-06-28",          // 👈 Pagar Akhir (28 Juni 2026)
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
  TANGGAL_UTBK: "2026-04-21T00:00:00+07:00",
  TANGGAL_LIBUR: [
    // --- 2025 ---
    "2025-08-17", // Hari Kemerdekaan RI
    "2025-09-05", // Maulid Nabi Muhammad SAW
    "2025-12-25", // Hari Raya Natal

    // --- 2026 ---
    "2026-01-01", // Tahun Baru 2026 Masehi
    "2026-01-27", // Isra Mi'raj Nabi Muhammad SAW
    "2026-02-17", // Tahun Baru Imlek 2577 Kongzili
    "2026-03-20", // Hari Suci Nyepi (Tahun Baru Saka 1948)
    "2026-03-31", // Hari Raya Idul Fitri 1447 H (Hari 1)
    "2026-04-01", // Hari Raya Idul Fitri 1447 H (Hari 2)
    "2026-04-03", // Wafat Yesus Kristus (Jumat Agung)
    "2026-05-01", // Hari Buruh Internasional
    "2026-05-14", // Kenaikan Yesus Kristus
    "2026-05-22", // Hari Raya Waisak 2570 BE
    "2026-06-01", // Hari Lahir Pancasila
    "2026-06-27", // Hari Raya Idul Adha 1447 H
  ]
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
  MAX_EXTRA_MENIT_KONSUL: 9999,
  MIN_DURASI_BELAJAR_SAH: 15,
  MIN_DURASI_KONSUL_SAH: 5,
  WINDOW_SCAN_MASUK_MENIT: 30,
  TOAST_DELAY_MS: 3000,
  DEBOUNCE_DELAY_MS: 500,
  DEFAULT_PASSWORD: "password123",
  COOKIE_NAME: "karcis_quantum",
  COOKIE_ROLE: "peran_quantum",
  SESSION_MAX_AGE_DAYS: 7,
  SALT_ROUNDS: 10,
  PATH_LOGIN: "/login",
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
  DOMAIN_RESMI: "res.cloudinary.com",
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
  REGEX_USERNAME: /^[a-z0-9_.-]+$/,
  REGEX_PHONE: /^(08|628)\d{8,13}$/,
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

export const OPSI_MAPEL_KELAS = Object.freeze([
  "Matematika", "IPA", "Fisika", "Kimia", "Biologi",
  "IPS", "Ekonomi", "Geografi", "Sosiologi", "Sejarah",
  "Bahasa Indonesia", "Bahasa Inggris",
  "Penalaran Umum (PU)", "Pemahaman Bacaan dan Menulis (PBM)",
  "Pengetahuan dan Pemahaman Umum (PPU)", "Pengetahuan Kuantitatif (PK)",
  "Literasi dalam Bahasa Indonesia (LBI)", "Literasi dalam Bahasa Inggris (LBE)",
  "Penalaran Matematika (PM)"
]);

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

export const LIMIT_DATA = Object.freeze({
  DASHBOARD_HISTORY: 1000, // Nanti Di Hapus
  PAGINATION_DEFAULT: 20,
  PAGNATION_KELAS: 4,
  PAGNATION_KONSUL: 10
});

// ============================================================================
// 12. ✨ PENGATURAN GAMIFIKASI (CONTROL PANEL)
// ============================================================================
export const GAMIFIKASI = Object.freeze({
  
  // 1. PENGATURAN EXP REGULER
  EXP: {
    HADIR_KELAS: 50,           
    KONSUL_DASAR: 10,          
    KONSUL_PER_30_MENIT: 20,   
  },
  
  // 2. KODE LENCANA (Untuk backend membedakan jenis lencana)
  LENCANA: {
    FIRST_BLOOD: "first_blood",
    BURUNG_HANTU: "burung_hantu",
    KONSISTEN_30: "konsisten_30",
  },
  
  // 3. KAMUS VISUAL LENCANA (Untuk frontend menampilkan ikon & warna)
  KAMUS_LENCANA: {
    "first_blood": { ikon: "🩸", nama: "First Blood", warna: "#ef4444" },
    "burung_hantu": { ikon: "🦉", nama: "Burung Hantu", warna: "#8b5cf6" },
    "konsisten_30": { ikon: "🔥", nama: "Konsisten 30 Hari", warna: "#f97316" }
  },

  // 4. POOL MISI HARIAN (Sistem akan mengacak 2 dari daftar ini tiap hari)
  POOL_MISI: [
    { kodeMisi: "HADIR_KELAS", judul: "Hadir kelas hari ini", target: 1, expBonus: 50 },
    { kodeMisi: "KONSUL_30", judul: "Konsul minimal 30 menit", target: 30, expBonus: 40 },
    { kodeMisi: "KONSUL_60", judul: "Konsul minimal 1 Jam", target: 60, expBonus: 100 },
    { kodeMisi: "DATANG_AWAL", judul: "Absen sebelum jam 15:00", target: 1, expBonus: 60 },
    { kodeMisi: "KONSUL_MALAM", judul: "Selesai konsul di atas jam 18:00", target: 1, expBonus: 75 }
  ],

  // 5. GELAR KLASEMEN BULANAN (Ditentukan dari total jam belajar bulan berjalan)
  GELAR_KLASEMEN: [
    { minJam: 60, gelar: "🌌 Legenda Hidup" },
    { minJam: 50, gelar: "⚡ Dewa Ambis" },
    { minJam: 40, gelar: "👻 Penunggu Quantum" },
    { minJam: 30, gelar: "👑 Yang Punya Quantum" },
    { minJam: 20, gelar: "🔥 Sepuh Quantum" },
    { minJam: 10, gelar: "⚔️ Pejuang Ambis" },
    { minJam: 5,  gelar: "🚀 Mulai Panas" },
    { minJam: 0,  gelar: "🐢 Masih Pemanasan" }
  ]
});