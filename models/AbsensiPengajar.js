import mongoose from "mongoose";

// ============================================================================
// ABSENSI PENGAJAR SCHEMA
// Satu dokumen = satu sesi absensi pengajar (masuk & keluar).
// QR scan masuk → dokumen dibuat. QR scan keluar → dokumen diupdate.
// ============================================================================

// ============================================================================
// SUB-SCHEMA: LOKASI SCAN (Belum diterapkan)
// ============================================================================
const lokasiScanSchema = new mongoose.Schema(
  {
    _id: false,
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  }
);

// ============================================================================
// SCHEMA
// ============================================================================
const absensiPengajarSchema = new mongoose.Schema(
  {
    pengajarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    namaPengajar: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // -------------------------------------------------------------------------
    // TRACKING WAKTU
    // waktuKeluar null = pengajar belum scan keluar
    // -------------------------------------------------------------------------
    waktuMasuk:  { type: Date, required: true, default: Date.now },
    waktuKeluar: { type: Date, default: null },

    // -------------------------------------------------------------------------
    // LOKASI SCAN
    // -------------------------------------------------------------------------
    lokasiScanMasuk:  { type: lokasiScanSchema, default: () => ({}) },
    lokasiScanKeluar: { type: lokasiScanSchema, default: () => ({}) },

    // -------------------------------------------------------------------------
    // REKAP EKSTRA KELAS
    // Dicatat saat pengajar mengajar di luar jadwal regulernya.
    // totalMenitEkstraHarian = sum(riwayatEkstraKelas[].menitEkstra),
    // disimpan untuk performa query rekap harian tanpa perlu agregasi.
    // -------------------------------------------------------------------------
    riwayatEkstraKelas: [
      {
        _id: false,
        jadwalId:   { type: mongoose.Schema.Types.ObjectId, ref: "Jadwal" },
        menitEkstra: { type: Number, default: 0, min: 0 },
      },
    ],
    totalMenitEkstraHarian: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// Query utama: riwayat absensi seorang pengajar, urut terbaru
absensiPengajarSchema.index({ pengajarId: 1, waktuMasuk: -1 });

// Query admin: semua absensi hari ini / range tanggal
absensiPengajarSchema.index({ waktuMasuk: -1 });

// ============================================================================
// MODEL
// ============================================================================
const AbsensiPengajar =
  mongoose.models.AbsensiPengajar ||
  mongoose.model("AbsensiPengajar", absensiPengajarSchema);
export default AbsensiPengajar;