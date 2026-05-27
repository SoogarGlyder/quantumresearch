import mongoose from "mongoose";
import { TIPE_SESI, STATUS_SESI } from "../utils/constants";

// ============================================================================
// STUDY SESSION SCHEMA
//
// Satu dokumen = satu sesi belajar siswa (kelas atau konsultasi).
// Alur: siswa scan QR terus sesi dibuat (status: berjalan) terus
//       siswa scan keluar / pengajar tutup sesi terus status selesai.
// ============================================================================

// ============================================================================
// CATATAN ENUM & LOWERCASE
// ============================================================================
const studySessionSchema = new mongoose.Schema(
  {
    siswaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    namaSiswa: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    jenisSesi: {
      type: String,
      required: true,
      lowercase: true,
      enum: Object.values(TIPE_SESI),
      trim: true,
    },
    namaMapel: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    pengajarPendamping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    namaPengajarPendamping: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    // -------------------------------------------------------------------------
    // TRACKING WAKTU
    // -------------------------------------------------------------------------
    waktuMulai:   { type: Date, default: Date.now },
    waktuSelesai: { type: Date, default: null },

    status: {
      type: String,
      lowercase: true,
      enum: Object.values(STATUS_SESI).map((s) => s.id),
      default: STATUS_SESI.BERJALAN.id,
      trim: true,
    },

    terlambatMenit:  { type: Number, default: 0, min: 0 },
    konsulExtraMenit: { type: Number, default: 0, min: 0 },

    nilaiTest: { type: Number, default: null, min: 0, max: 100 },
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// Riwayat sesi seorang siswa, urut terbaru (halaman progress siswa)
studySessionSchema.index({ siswaId: 1, waktuMulai: -1 });

// Semua sesi pada rentang waktu tertentu, plus filter siswa
// (dashboard admin, rekap harian)
studySessionSchema.index({ waktuMulai: -1, siswaId: 1 });

// Cari sesi aktif milik siswa (polling status dari client)
studySessionSchema.index({ siswaId: 1, status: 1, waktuMulai: -1 });

// Rekap sesi per jenis & mapel dalam periode (laporan akademik)
studySessionSchema.index({ jenisSesi: 1, namaMapel: 1, waktuMulai: -1 });

// Rekap sesi yang didampingi pengajar tertentu (laporan pengajar)
studySessionSchema.index({ pengajarPendamping: 1, jenisSesi: 1, waktuMulai: -1 });

// ============================================================================
// MODEL
// ============================================================================
const StudySession =
  mongoose.models.StudySession ||
  mongoose.model("StudySession", studySessionSchema);
export default StudySession;