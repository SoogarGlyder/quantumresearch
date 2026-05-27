import mongoose from "mongoose";
import { OPSI_KELAS, OPSI_MAPEL_KELAS, FORMAT_WAKTU } from "../utils/constants";

// ============================================================================
// VALIDATOR
// ============================================================================
/**
 * @param {string} v
 * @returns {boolean}
 */
const isValidTimeFormat = (v) => /^\d{2}:\d{2}$/.test(v);

const timeFormatMessage = (field) =>
  `Format ${field} harus ${FORMAT_WAKTU.JAM} (contoh: 14:30)`;

// ============================================================================
// SCHEMA
// ============================================================================
const jadwalSchema = new mongoose.Schema(
  {
    kelasTarget: {
      type: String,
      required: true,
      enum: OPSI_KELAS,
      trim: true,
    },
    tanggal: {
      type: Date,
      required: true,
    },
    mapel: {
      type: String,
      required: true,
      enum: OPSI_MAPEL_KELAS,
      trim: true,
    },
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
    kodePengajar: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    pertemuan: {
      type: Number,
      required: true,
      min: 1,
    },
    jamMulai: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isValidTimeFormat,
        message: timeFormatMessage("jamMulai"),
      },
    },
    jamSelesai: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isValidTimeFormat,
        message: timeFormatMessage("jamSelesai"),
      },
    },
    bab: {
      type: String,
      default: null,
      trim: true,
      maxlength: 255
    },
    subBab: {
      type: String,
      default: null,
      trim: true,
      maxlength: 255
    },
    galeriPapan: {
      type: [String],
      default: []
    },
    fotoBersama: {
      type: String,
      default: null,
      trim: true
    },
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// Query utama: ambil jadwal berdasarkan kelas pada tanggal tertentu
jadwalSchema.index({ kelasTarget: 1, tanggal: 1 });

// Query utama: ambil jadwal seorang pengajar pada tanggal tertentu
jadwalSchema.index({ tanggal: 1, pengajarId: 1 });

// Untuk filter jadwal berdasarkan pengajar (halaman profil/rekap pengajar)
jadwalSchema.index({ pengajarId: 1, tanggal: -1 });

// ============================================================================
// MODEL
// ============================================================================
const Jadwal = mongoose.models.Jadwal || mongoose.model("Jadwal", jadwalSchema);
export default Jadwal;