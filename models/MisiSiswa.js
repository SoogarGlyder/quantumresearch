import mongoose from "mongoose";
import { CABANG_QUANTUM } from "../utils/constants";

// ============================================================================
// MISI SISWA SCHEMA (GAMIFICATION DOMAIN)
// ============================================================================

const misiSiswaSchema = new mongoose.Schema(
  {
    siswaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tanggal: {
      type: Date,
      required: true,
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
    // DAFTAR MISI HARI INI
    // -------------------------------------------------------------------------
    daftarMisi: [
      {
        _id: false,
        kodeMisi:  { type: String, required: true, trim: true, maxlength: 50  },
        judul:     { type: String, required: true, trim: true, maxlength: 255 },
        target:    { type: Number, required: true, min: 0 },
        progress:  { type: Number, default: 0, min: 0 },
        selesai:   { type: Boolean, default: false },
        diklaim:   { type: Boolean, default: false },
        expBonus:  { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// UNIQUE CONSTRAINT: Satu siswa hanya boleh punya 1 dokumen misi per hari.
// Mencegah race condition (misi ganda di hari yang sama).
misiSiswaSchema.index({ siswaId: 1, tanggal: 1 }, { unique: true });

// Riwayat misi siswa (halaman history gamifikasi)
misiSiswaSchema.index({ siswaId: 1, createdAt: -1 });

// Analitik misi per cabang per periode
misiSiswaSchema.index({ kodeCabang: 1, tanggal: -1 });

// ============================================================================
// MODEL
// ============================================================================
const MisiSiswa =
  mongoose.models.MisiSiswa || mongoose.model("MisiSiswa", misiSiswaSchema);
export default MisiSiswa;