import mongoose from "mongoose";
import { PERAN, STATUS_USER } from "../utils/constants";

const userSchema = new mongoose.Schema({
  nama: { type: String, required: [true, "Nama wajib diisi!"], trim: true },
  nomorPeserta: { type: String, required: true, unique: true, index: true, trim: true }, 
  username: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  noHp: { type: String, required: true, trim: true },

  peran: { 
    type: String, 
    enum: Object.values(PERAN).map(p => p.id),
    default: PERAN.SISWA.id,
    index: true 
  },
  status: { 
    type: String, 
    enum: Object.values(STATUS_USER),
    default: STATUS_USER.AKTIF 
  },

  kelas: { type: String, default: "-" },
  kodePengajar: { type: String, default: "-", index: true },
  jadwalKelas: { type: String, default: "-" },
  jamKelas: { type: String, default: "-" },

  // ✨ GAMIFIKASI: FONDASI LEVEL & LENCANA
  totalExp: { type: Number, default: 0, index: true }, // Diset default 0 untuk siswa baru
  koleksiLencana: [{
    idLencana: String,
    tanggalDidapat: { type: Date, default: Date.now }
  }],
  
  // 🎯 GAMIFIKASI BARU: MISI HARIAN
  misiHarian: {
    tanggal: { type: String, default: "" }, // Format: YYYY-MM-DD
    daftar: [{
      kodeMisi: String,
      judul: String,
      target: Number,
      progress: { type: Number, default: 0 },
      selesai: { type: Boolean, default: false },
      diklaim: { type: Boolean, default: false }, // True jika EXP bonus sudah diambil
      expBonus: Number
    }]
  }

}, { timestamps: true });

userSchema.index({ nama: 1 });
userSchema.index({ kelas: 1 });
// Index untuk mempermudah query leaderboard/level tertinggi nantinya
userSchema.index({ totalExp: -1 }); 

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;