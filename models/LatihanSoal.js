import mongoose from "mongoose";
import { TIPE_TARGET_TUGAS, CABANG_QUANTUM } from "../utils/constants";

// ============================================================================
// LATIHAN SOAL SCHEMA
// ============================================================================

// ============================================================================
// VALIDATOR
// ============================================================================
/**
 * @param {string} v
 * @returns {boolean}
 */
const isValidUrl = (v) => {
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// ============================================================================
// SCHEMA
// ============================================================================
const latihanSoalSchema = new mongoose.Schema(
  {
    judul: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: "URL tidak valid. Gunakan format https://...",
      },
    },

    // -------------------------------------------------------------------------
    // ISOLASI CABANG (MULTI-TENANT)
    // -------------------------------------------------------------------------
    kodeCabang: {
      type: String,
      required: true,
      default: CABANG_QUANTUM.PUSAT.id,
      trim: true,
      maxlength: 20,
    },

    // -------------------------------------------------------------------------
    // TARGET DISTRIBUSI
    // -------------------------------------------------------------------------
    tipeTarget: {
      type: String,
      enum: Object.values(TIPE_TARGET_TUGAS),
      required: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    isAktif: {
      type: Boolean,
      default: true,
    },

    // -------------------------------------------------------------------------
    // PEMBUAT
    // -------------------------------------------------------------------------
    pembuatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    namaPembuat: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// Query utama: ambil latihan aktif untuk kelas/siswa tertentu per cabang
latihanSoalSchema.index({ kodeCabang: 1, isAktif: 1, tipeTarget: 1, target: 1 });

// List latihan terbaru per cabang (halaman admin)
latihanSoalSchema.index({ kodeCabang: 1, createdAt: -1 });

// ============================================================================
// MODEL
// ============================================================================
export default mongoose.models.LatihanSoal ||
  mongoose.model("LatihanSoal", latihanSoalSchema);