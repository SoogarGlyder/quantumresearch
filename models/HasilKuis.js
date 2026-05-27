import mongoose from "mongoose";

// ============================================================================
// HASIL KUIS SCHEMA
// ============================================================================

const hasilKuisSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
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
    jadwalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jadwal",
      required: true,
    },

    // -------------------------------------------------------------------------
    // JAWABAN SISWA
    // -------------------------------------------------------------------------
    jawaban: [
      {
        _id: false,
        nomorSoal: {
          type: Number,
          required: true,
          min: 1,
        },
        jawabanSiswa: [{ type: String, trim: true }],
        isBenar: { type: Boolean, default: false },
      },
    ],

    // -------------------------------------------------------------------------
    // REKAP NILAI
    // -------------------------------------------------------------------------
    totalBenar:       { type: Number, default: 0,    min: 0          },
    totalSalah:       { type: Number, default: 0,    min: 0          },
    nilai:            { type: Number, default: 0,    min: 0, max: 100 },
    totalExpDidapat:  { type: Number, default: 0,    min: 0          },

    // -------------------------------------------------------------------------
    // TRACKING WAKTU
    // -------------------------------------------------------------------------
    waktuMulai:             { type: Date,   default: Date.now },
    waktuSelesai:           { type: Date,   default: null     },
    durasiPengerjaanDetik:  { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// Constraint utama: satu siswa hanya boleh submit satu kali per quiz
hasilKuisSchema.index({ quizId: 1, siswaId: 1 }, { unique: true });

// Rekap hasil seluruh siswa untuk satu jadwal (halaman rekap pengajar/admin)
hasilKuisSchema.index({ jadwalId: 1 });

// Riwayat kuis seorang siswa (halaman progress siswa)
hasilKuisSchema.index({ siswaId: 1, createdAt: -1 });

// ============================================================================
// MODEL
// ============================================================================
const HasilKuis =
  mongoose.models.HasilKuis || mongoose.model("HasilKuis", hasilKuisSchema);
export default HasilKuis;