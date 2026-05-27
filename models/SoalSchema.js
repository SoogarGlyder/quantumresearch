import mongoose from "mongoose";
import { TIPE_SOAL } from "../utils/constants";

// ============================================================================
// SOAL SUB-SCHEMA
//
// Dipakai sebagai embedded sub-document di:
//   - models/BankSoal.js
//   - models/Quiz.js
// ============================================================================

export const soalSubSchema = new mongoose.Schema({
  tipeSoal: {
    type: String,
    enum: Object.values(TIPE_SOAL),
    default: TIPE_SOAL.PG,
    trim: true,
  },
  pertanyaan: {
    type: String,
    required: true,
    trim: true,
  },
  gambar: {
    type: String,
    default: null,
    trim: true,
  },
  opsi: [
    {
      _id: false,
      label: { type: String, trim: true },
      teks:  { type: String, trim: true },
    },
  ],
  kunciJawaban: {
    type: [String],
    required: true,
  },
  bobotExp: {
    type: Number,
    default: 20,
    min: 0,
  },
  pembahasan: {
    type: String,
    default: null,
    trim: true,
  },
});

// ============================================================================
// VIRTUAL
// ============================================================================
soalSubSchema.virtual("jumlahOpsi").get(function () {
  return this.opsi?.length ?? 0;
});