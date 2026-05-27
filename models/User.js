import mongoose from "mongoose";
import {
  PERAN,
  STATUS_USER,
  PANGKAT_PENGAJAR,
  CABANG_QUANTUM,
} from "../utils/constants";

// ============================================================================
// USER SCHEMA
//
// Satu dokumen mewakili satu pengguna sistem (Siswa, Pengajar, atau Admin).
// Rencana nanti mau dipisah.
// Isolasi antar cabang dilakukan via field `kodeCabang` (multi-tenant).
// ============================================================================

const userSchema = new mongoose.Schema(
  {
    // -------------------------------------------------------------------------
    // INFORMASI DASAR
    // -------------------------------------------------------------------------
    nama: {
      type: String,
      required: [true, "Nama wajib diisi."],
      trim: true,
      maxlength: 100,
    },
    nomorPeserta: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    noHp: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    peran: {
      type: String,
      enum: Object.values(PERAN).map((p) => p.id),
      default: PERAN.SISWA.id,
    },
    status: {
      type: String,
      enum: Object.values(STATUS_USER),
      default: STATUS_USER.AKTIF,
    },

    // -------------------------------------------------------------------------
    // ISOLASI CABANG (MULTI-TENANT)
    // Setiap query yang mengambil data cabang tertentu HARUS menyertakan
    // filter { kodeCabang } untuk mencegah data lintas-cabang bocor.
    // -------------------------------------------------------------------------
    kodeCabang: {
      type: String,
      required: true,
      default: CABANG_QUANTUM.PUSAT.id,
      trim: true,
      maxlength: 20,
    },

    // -------------------------------------------------------------------------
    // PANGKAT & HAK AKSES PENGAJAR (RBAC)
    // Khusus peran === PERAN.PENGAJAR.id
    // -------------------------------------------------------------------------
    pangkat: {
      type: String,
      enum: Object.values(PANGKAT_PENGAJAR),
      default: PANGKAT_PENGAJAR.FREELANCE,
    },
    isKakakAsuh: {
      type: Boolean,
      default: false,
    },
    // Khusus isKakakAsuh === true
    kelasAsuh: {
      type: [String],
      default: [],
    },

    // -------------------------------------------------------------------------
    // DATA AKADEMIK / OPERASIONAL
    // -------------------------------------------------------------------------
    kelas:        { type: String, default: null, trim: true, maxlength: 50  },
    kodePengajar: { type: String, default: null, trim: true, maxlength: 50  },
    jadwalKelas:  { type: String, default: null, trim: true, maxlength: 100 }, // Ini belum kepake
    jamKelas:     { type: String, default: null, trim: true, maxlength: 100 }, // Ini belum kepake

    // -------------------------------------------------------------------------
    // GAMIFIKASI & PROGRESS SISWA
    // -------------------------------------------------------------------------
    totalExp: {
      type: Number,
      default: 0,
      min: 0,
    },
    koleksiLencana: [
      {
        _id: false,
        idLencana:     { type: String, trim: true, maxlength: 50 },
        tanggalDidapat: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================
// Lookup user tunggal (login, profil)
userSchema.index({ username: 1 },      { unique: true });
userSchema.index({ nomorPeserta: 1 },  { unique: true });

// Filter & listing per cabang
userSchema.index({ kodeCabang: 1, peran: 1 });
userSchema.index({ kodeCabang: 1, peran: 1, kelas: 1 });
userSchema.index({ kodeCabang: 1, peran: 1, kodePengajar: 1 });

// Leaderboard EXP
userSchema.index({ kodeCabang: 1, totalExp: -1 });

// Fitur Kakak Asuh
userSchema.index({ isKakakAsuh: 1 });

// Pencarian nama
userSchema.index({ nama: 1 });

// ============================================================================
// MODEL
// ============================================================================
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;