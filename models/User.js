// Belum Beres!!!
import mongoose from "mongoose";
import { PERAN, STATUS_USER, PANGKAT_PENGAJAR } from "../utils/constants";

const userSchema = new mongoose.Schema({
  // --- INFORMASI DASAR ---
  nama: { type: String, required: [true, "Nama wajib diisi!"], trim: true, maxlength: 100 },
  nomorPeserta: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 50 }, 
  username: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, maxlength: 50 },
  password: { type: String, required: true, select: false },
  noHp: { type: String, required: true, trim: true, maxlength: 20 },
  peran: { type: String, enum: Object.values(PERAN).map(p => p.id), default: PERAN.SISWA.id, index: true },
  status: { type: String, enum: Object.values(STATUS_USER), default: STATUS_USER.AKTIF },

  /** ISOLASI CABANG (MULTI-TENANT) */
  kodeCabang: { type: String, default: "010101", trim: true, maxlength: 20, index: true },

  /** PANGKAT & HAK AKSES PENGAJAR (RBAC) */
  pangkat: { type: String, enum: Object.values(PANGKAT_PENGAJAR), default: PANGKAT_PENGAJAR.FREELANCE },
  isKakakAsuh: { type: Boolean, default: false, index: true },
  kelasAsuh: { type: [String], default: [] },

  // --- DATA AKADEMIK / OPERASIONAL ---
  kelas: { type: String, default: "-", trim: true, maxlength: 50 },
  kodePengajar: { type: String, default: "-", index: true, trim: true, maxlength: 50 },
  jadwalKelas: { type: String, default: "-", trim: true, maxlength: 100 },
  jamKelas: { type: String, default: "-", trim: true, maxlength: 100 },

  // --- GAMIFIKASI & PROGRESS ---
  totalExp: { type: Number, default: 0, index: true, min: 0 },
  koleksiLencana: [{
    idLencana: { type: String, trim: true, maxlength: 50 },
    tanggalDidapat: { type: Date, default: Date.now }
  }],
  misiHarian: {
    tanggal: { type: String, default: "", trim: true, maxlength: 20 },
    daftar: [{
      kodeMisi: { type: String, trim: true, maxlength: 50 },
      judul: { type: String, trim: true, maxlength: 255 },
      target: { type: Number, min: 0 },
      progress: { type: Number, default: 0, min: 0 },
      selesai: { type: Boolean, default: false },
      diklaim: { type: Boolean, default: false },
      expBonus: { type: Number, min: 0 }
    }]
  }
}, { timestamps: true });

userSchema.index({ nama: 1 });
userSchema.index({ kelas: 1 });
userSchema.index({ totalExp: -1 }); 
userSchema.index({ kodeCabang: 1, peran: 1 }); 
userSchema.index({ kodeCabang: 1, peran: 1, kelas: 1 }); 
userSchema.index({ kodeCabang: 1, peran: 1, kodePengajar: 1 }); 

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;