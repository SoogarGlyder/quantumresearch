import mongoose from "mongoose";
import { CABANG_QUANTUM } from "../utils/constants";
import { soalSubSchema } from "./SoalSchema";

// ============================================================================
// QUIZ SCHEMA
// ============================================================================

const quizSchema = new mongoose.Schema(
  {
    jadwalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jadwal",
      required: true,
      unique: true,
    },
    sumberBankSoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankSoal",
      default: null,
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
    // PEMBUAT
    // -------------------------------------------------------------------------
    pembuatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    namaPembuat: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isAktif: {
      type: Boolean,
      default: true,
    },
    durasiMenit: {
      type: Number,
      default: 10,
      min: 1,
    },
    soal: [soalSubSchema],
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// List quiz aktif milik seorang pengajar per cabang
quizSchema.index({ kodeCabang: 1, pembuatId: 1, isAktif: 1 });

// Filter quiz aktif per cabang (halaman admin)
quizSchema.index({ kodeCabang: 1, isAktif: 1, createdAt: -1 });

// ============================================================================
// MODEL
// ============================================================================
export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);