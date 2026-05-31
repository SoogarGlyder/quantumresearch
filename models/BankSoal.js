import mongoose from "mongoose";
import { CABANG_QUANTUM, OPSI_MAPEL_KELAS } from "../utils/constants";
import { soalSubSchema } from "./SoalSchema";

// ============================================================================
// BANK SOAL SCHEMA
// ============================================================================
const bankSoalSchema = new mongoose.Schema(
  {
    judul: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mapel: {
      type: String,
      enum: OPSI_MAPEL_KELAS,
      default: "Umum",
      trim: true,
    },

    // -------------------------------------------------------------------------
    // ISOLASI CABANG (MULTI-TENANT)
    // Bank soal hanya bisa diakses oleh cabang yang sama.
    // Query WAJIB menyertakan filter { kodeCabang }.
    // Pengecualian: CABANG_QUANTUM.PUSAT.id dapat mengakses semua cabang.
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

    // Bank soal resmi (dari Admin/Pusat) ditandai isOfficial: true
    isOfficial: {
      type: Boolean,
      default: false,
    },

    // Estimasi durasi pengerjaan dalam menit
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
// List bank soal per cabang (halaman daftar bank soal)
bankSoalSchema.index({ kodeCabang: 1, createdAt: -1 });

// List bank soal milik seorang pengajar, terbaru duluan
bankSoalSchema.index({ pembuatId: 1, createdAt: -1 });

// Filter bank soal resmi per cabang
bankSoalSchema.index({ kodeCabang: 1, isOfficial: 1 });

bankSoalSchema.index({ judul: "text", mapel: "text" });

// ============================================================================
// MODEL
// ============================================================================
export default mongoose.models.BankSoal ||
  mongoose.model("BankSoal", bankSoalSchema);