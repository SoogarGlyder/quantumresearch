// ============================================================================
// 1. PENGATURAN PERIODE & LOKASI
// ============================================================================
export const PERIODE_BELAJAR = Object.freeze({
  ID: "Tahun Ajaran 2025/2026",
  MULAI: "2026-06-29",
  AKHIR: "2027-06-28",
  TIMEZONE: "Asia/Jakarta",
  UTC_OFFSET: 7,
  ISO_OFFSET: "+07:00",
  LOKASI_HQ: {
    LAT: -6.1672807190869445,
    LNG: 106.87065857296675,
    RADIUS_METER: 100,
  },
});

export const EVENT_PENTING = Object.freeze({
  TANGGAL_UTBK: "2026-04-21T00:00:00+07:00",
  TANGGAL_LIBUR: [
    "2025-08-17", "2025-09-05", "2025-12-25",
    "2026-01-01", "2026-01-27", "2026-02-17", "2026-03-20",
    "2026-03-31", "2026-04-01", "2026-04-03", "2026-05-01",
    "2026-05-14", "2026-05-22", "2026-06-01", "2026-06-27",
  ],
});

// ============================================================================
// 2. OTORISASI & ROLE
// ============================================================================
export const PERAN = Object.freeze({
  SISWA:    { id: "siswa",    label: "Siswa",         home: "/" },
  ADMIN:    { id: "admin",    label: "Administrator", home: "/admin" },
  PENGAJAR: { id: "pengajar", label: "Pengajar",      home: "/" },
});

export const PANGKAT_PENGAJAR = Object.freeze({
  FREELANCE:       "FREELANCE",
  TETAP:           "TETAP",
  KAKAK_ASUH:      "KAKAK_ASUH",
  STAFF_AKADEMIK:  "STAFF_AKADEMIK",
});

export const STATUS_USER = Object.freeze({
  AKTIF:    "aktif",
  NONAKTIF: "tidak aktif",
});

// ============================================================================
// 3. LOGIKA SISTEM & AMBANG BATAS
// ============================================================================
export const KONFIGURASI_SISTEM = Object.freeze({
  BATAS_TERLAMBAT_MENIT:      15,
  DURASI_SESI_KELAS_MENIT:    90,
  DURASI_SESI_KONSUL_DEFAULT: 30,
  MAX_EXTRA_MENIT_KONSUL:     9999,
  MIN_DURASI_BELAJAR_SAH:     15,
  MIN_DURASI_KONSUL_SAH:       5,
  WINDOW_SCAN_MASUK_MENIT:    30,
  TOAST_DELAY_MS:           3000,
  DEBOUNCE_DELAY_MS:         500,
  COOKIE_NAME:                  "karcis_quantum",
  COOKIE_ROLE:                  "peran_quantum",
  COOKIE_CABANG:                "cabang_quantum",
  COOKIE_PANGKAT:               "pangkat_quantum",
  COOKIE_KELAS_ASUH:            "kelas_asuh_quantum",
  SESSION_MAX_AGE_DAYS:        7,
  SALT_ROUNDS:                10,
  PATH_LOGIN:                   "/login",
  DEFAULT_PASSWORD: process.env.DEFAULT_STUDENT_PASSWORD ?? "password123",
});

// ============================================================================
// 4. STATUS, TIPE DATA & LABEL UI
// ============================================================================
export const TIPE_SESI = Object.freeze({
  KELAS:  "kelas",
  KONSUL: "konsul",
});

export const TIPE_TARGET_TUGAS = Object.freeze({
  KELAS:  "KELAS",
  SISWA:  "SISWA",
});

export const STATUS_SESI = Object.freeze({
  SELESAI:      { id: "selesai",      label: "Selesai",            color: "#4ade80", bg: "#dcfce3" },
  BERJALAN:     { id: "berjalan",     label: "Berjalan",           color: "#facc15", bg: "#fef9c3" },
  TIDAK_HADIR:  { id: "tidak hadir",  label: "Tidak Hadir",        color: "#9ca3af", bg: "#f3f4f6" },
  ALPA:         { id: "alpa",         label: "Alpa",               color: "#ef4444", bg: "#fee2e2" },
  SAKIT:        { id: "sakit",        label: "Sakit",              color: "#f97316", bg: "#ffedd5" },
  IZIN:         { id: "izin",         label: "Izin",               color: "#3b82f6", bg: "#dbeafe" },
  PINALTI:      { id: "pinalti",      label: "Pinalti Lupa Scan",  color: "#ef4444", bg: "#111827" },
});

export const LABEL_SISTEM = Object.freeze({
  BELUM_ABSEN:       "belum absen",
  DATA_KOSONG:       "-",
  REDIRECT_CLEAR:    "clear=true",
  PENCARIAN_DEFAULT: "Ketik di sini...",
});

// ============================================================================
// 5. KONFIGURASI MEDIA & STORAGE
// ============================================================================
export const KONFIGURASI_MEDIA = Object.freeze({
  MAX_UPLOAD_SIZE_MB:    5,
  ALLOWED_IMAGE_TYPES:   ["image/jpeg", "image/png", "image/webp"],
  DOMAIN_RESMI:          "res.cloudinary.com",
  STORAGE_FOLDERS: {
    JURNAL:   "jurnal-pembelajaran",
    ABSENSI:  "bukti-absen",
    PROFIL:   "foto-user",
  },
});

// ============================================================================
// 6. VALIDASI INPUT (Security Rules)
// ============================================================================
export const VALIDASI_SISTEM = Object.freeze({
  MIN_PASSWORD:    6,
  REGEX_USERNAME:  /^[a-z0-9_.-]+$/,
  REGEX_PHONE:     /^(08|628)\d{8,13}$/,
});

// ============================================================================
// 7. PESAN SISTEM (Standard Messages)
// ============================================================================
export const PESAN_SISTEM = Object.freeze({
  AKSES_DITOLAK: "Akses Ditolak! Anda tidak memiliki otoritas.",
  SESI_HABIS:    "Sesi berakhir, silakan login kembali.",
  GAGAL_SIMPAN:  "Gagal menyimpan data ke database.",
  SUKSES_SIMPAN: "Data berhasil disimpan!",
});

// ============================================================================
// 8. FORMAT WAKTU (Consistency)
// ============================================================================
export const FORMAT_WAKTU = Object.freeze({
  TANGGAL: "YYYY-MM-DD",
  JAM:     "HH:mm",
  LENGKAP: "DD MMM YYYY, HH:mm",
});

// ============================================================================
// 9. KONFIGURASI SCANNER & BARCODE
// ============================================================================
export const PREFIX_BARCODE = Object.freeze({
  KELAS:  "QR-KLS-",
  KONSUL: "QR-KONSUL",
  ADMIN:  "QR-ADMIN-STAFF",
});

export const MODE_SCAN = Object.freeze({
  KELAS:  "kelas",
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
  "OSN MAT", "OSN IPA", "OSN IPS",
]);

export const OPSI_MAPEL_KELAS = Object.freeze([
  "Matematika",
  "IPA", "Fisika", "Kimia", "Biologi",
  "IPS", "Ekonomi", "Geografi", "Sosiologi", "Sejarah",
  "Bahasa Indonesia", "Bahasa Inggris",
  "Penalaran Umum (PU)", "Pemahaman Bacaan dan Menulis (PBM)",
  "Pengetahuan dan Pemahaman Umum (PPU)", "Pengetahuan Kuantitatif (PK)",
  "Literasi dalam Bahasa Indonesia (LBI)", "Literasi dalam Bahasa Inggris (LBE)",
  "Penalaran Matematika (PM)",
]);

export const OPSI_MAPEL_KONSUL = Object.freeze([...OPSI_MAPEL_KELAS]);

export const OPSI_KETERANGAN_ABSEN = Object.freeze([
  { label: STATUS_SESI.ALPA.label,  value: STATUS_SESI.ALPA.id },
  { label: STATUS_SESI.SAKIT.label, value: STATUS_SESI.SAKIT.id },
  { label: STATUS_SESI.IZIN.label,  value: STATUS_SESI.IZIN.id },
]);

export const LIMIT_DATA = Object.freeze({
  PAGINATION_DEFAULT: 20,
  PAGINATION_KELAS:    3,
  PAGINATION_KONSUL:   5,
  PAGINATION_BAHAN:    3,
});

// ============================================================================
// 11. TIPE SOAL
// ============================================================================
export const TIPE_SOAL = Object.freeze({
  PG:            "PG",
  ESSAY:         "ESSAY",
  BENAR_SALAH:   "BS",
});

// ============================================================================
// 12. PENGATURAN GAMIFIKASI (CONTROL PANEL)
// ============================================================================
export const GAMIFIKASI = Object.freeze({
  EXP: {
    HADIR_KELAS:           50,
    KONSUL_DASAR:          10,
    KONSUL_PER_30_MENIT:   20,
    HAPPY_HOUR_AKTIF:      false,
    HAPPY_HOUR_MULAI:      "13:00",
    HAPPY_HOUR_SELESAI:    "15:00",
    MULTIPLIER_HAPPY_HOUR: 2,
  },

  LENCANA: {
    FIRST_BLOOD:        "first_blood",
    BURUNG_HANTU:       "burung_hantu",
    KONSISTEN_30:       "konsisten_30",
    WEEKEND_WARRIOR:    "weekend_warrior",
    MASTER_MTK:         "master_mtk",
    MASTER_FISIKA:      "master_fisika",
    MASTER_KIMIA:       "master_kimia",
    MASTER_BIOLOGI:     "master_biologi",
    MASTER_INGGRIS:     "master_inggris",
    KUTU_BUKU:          "kutu_buku",
    PENJAGA_PINTU:      "penjaga_pintu",
    PENUNGGANG_BADAI:   "penunggang_badai",
  },

  KAMUS_LENCANA: {
    "first_blood":      { ikon: "🩸", nama: "First Blood",          warna: "#ef4444" },
    "burung_hantu":     { ikon: "🦉", nama: "Burung Hantu",         warna: "#8b5cf6" },
    "konsisten_30":     { ikon: "🔥", nama: "Konsisten 30 Hari",    warna: "#f97316" },
    "weekend_warrior":  { ikon: "⚔️", nama: "Pejuang Weekend",      warna: "#2563eb" },
    "master_mtk":       { ikon: "📐", nama: "Einstein MTK",         warna: "#059669" },
    "master_fisika":    { ikon: "🍎", nama: "Newton Fisika",        warna: "#2563eb" },
    "master_kimia":     { ikon: "🧪", nama: "Curie Kimia",          warna: "#0891b2" },
    "master_biologi":   { ikon: "🧬", nama: "Mendel Biologi",       warna: "#16a34a" },
    "master_inggris":   { ikon: "🇬🇧", nama: "Shakespeare English",  warna: "#dc2626" },
    "kutu_buku":        { ikon: "📚", nama: "Kutu Buku",            warna: "#ca8a04" },
    "penjaga_pintu":    { ikon: "🚪", nama: "Penjaga Pintu",        warna: "#475569" },
    "penunggang_badai": { ikon: "⛈️", nama: "Penunggang Badai",     warna: "#334155" },
  },

  POOL_MISI: [
    { kodeMisi: "HADIR_KELAS",    judul: "Hadir kelas hari ini",                    target: 1,  expBonus: 50  },
    { kodeMisi: "KONSUL_30",      judul: "Konsul minimal 30 menit",                 target: 30, expBonus: 40  },
    { kodeMisi: "KONSUL_60",      judul: "Konsul minimal 1 jam",                    target: 60, expBonus: 100 },
    { kodeMisi: "DATANG_AWAL",    judul: "Absen sebelum jam 15:00",                 target: 1,  expBonus: 60  },
    { kodeMisi: "KONSUL_MALAM",   judul: "Selesai konsul di atas jam 18:00",        target: 1,  expBonus: 75  },
    { kodeMisi: "MARATON_MAPEL",  judul: "Konsul 2 mapel berbeda hari ini",         target: 2,  expBonus: 120 },
  ],

  GELAR_KLASEMEN: [
    { minJam: 60, gelar: "🌌 Legenda Hidup"     },
    { minJam: 50, gelar: "⚡ Dewa Ambis"         },
    { minJam: 40, gelar: "👻 Penunggu Quantum"   },
    { minJam: 30, gelar: "👑 Yang Punya Quantum" },
    { minJam: 20, gelar: "🔥 Sepuh Quantum"      },
    { minJam: 10, gelar: "⚔️ Pejuang Ambis"      },
    { minJam:  5, gelar: "Mulai Panas"            },
    { minJam:  0, gelar: "🐢 Masih Pemanasan"    },
  ],

  HADIAH_LEVEL: [
    { level: 10, hadiah: "Snack & Minuman Gratis"               },
    { level: 20, hadiah: "Merchandise Quantum (Pulpen/Note)"    },
    { level: 30, hadiah: "Voucher Diskon SPP / TryOut VIP"      },
    { level: 40, hadiah: "Kaos Eksklusif Quantum"               },
    { level: 50, hadiah: "Tiket Nonton Bioskop Bareng Mentor"   },
  ],
});

// ============================================================================
// 13. MULTI-CABANG (MULTI-TENANT)
// ============================================================================
export const CABANG_QUANTUM = Object.freeze({
  CPT: {
    id: "010101",
    nama: "Cempaka Putih",
    alamat: "Jalan Cempaka Putih Tengah XV No.05",
    kontak: "021 2169 0016 | 0896 9612 9658",
  },
  KBY: {
    id: "010401",
    nama: "Kebayoran Lama",
    alamat: "Jalan Delman Kencana I No.4",
    kontak: "0851 8799 9947",
  },
  PTK: {
    id: "010402",
    nama: "Petukangan Selatan",
    alamat: "Jalan Kemajuan No.15",
    kontak: "021 7376 247 | 0896 0980 2204",
  },
  KYP: {
    id: "010501",
    nama: "Kayu Putih",
    alamat: "Jalan Angkur No.18",
    kontak: "021 29833002 | 0812 8968 4856",
  },
  PUSAT: {
    id: "000000",
    nama: "Super Admin Pusat",
    alamat: "Kantor Pusat Quantum Research",
    kontak: null,
  },
});
