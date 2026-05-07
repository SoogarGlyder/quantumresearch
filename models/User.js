import mongoose from "mongoose";
import { PERAN, STATUS_USER, PANGKAT_PENGAJAR } from "../utils/constants";

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

  // ====================================================================
  // 🏢 1. ISOLASI CABANG (MULTI-TENANT)
  // ====================================================================
  kodeCabang: { 
    type: String, 
    default: "010101",
    index: true
  },

  // ====================================================================
  // 🎖️ 2. PANGKAT & HAK AKSES PENGAJAR (RBAC)
  // ====================================================================
  pangkat: { 
    type: String, 
    enum: Object.values(PANGKAT_PENGAJAR),
    default: PANGKAT_PENGAJAR.FREELANCE 
  },
  
  isKakakAsuh: {
    type: Boolean,
    default: false,
    index: true
  },

  kelasAsuh: { 
    type: [String],
    default: [] 
  },

  kelas: { type: String, default: "-" },
  kodePengajar: { type: String, default: "-", index: true },
  jadwalKelas: { type: String, default: "-" },
  jamKelas: { type: String, default: "-" },
  totalExp: { type: Number, default: 0, index: true },
  koleksiLencana: [{
    idLencana: String,
    tanggalDidapat: { type: Date, default: Date.now }
  }],
  misiHarian: {
    tanggal: { type: String, default: "" },
    daftar: [{
      kodeMisi: String,
      judul: String,
      target: Number,
      progress: { type: Number, default: 0 },
      selesai: { type: Boolean, default: false },
      diklaim: { type: Boolean, default: false },
      expBonus: Number
    }]
  }

}, { timestamps: true });

// SINGLE INDEX LAMA (Tetap dipertahankan untuk pencarian umum)
userSchema.index({ nama: 1 });
userSchema.index({ kelas: 1 });
userSchema.index({ totalExp: -1 }); 

// COMPOUND INDEX BARU (Untuk Akselerasi Multi-Tenant & RBAC)
// 1. Jalan Tol Dashboard: Filter siswa/guru berdasarkan cabang
userSchema.index({ kodeCabang: 1, peran: 1 }); 
// 2. Jalan Tol Kakak Asuh: Filter siswa berdasarkan cabang dan kelas
userSchema.index({ kodeCabang: 1, peran: 1, kelas: 1 }); 
// 3. Jalan Tol Tambah Jadwal: Pencarian guru dari kode pengajar di cabang tertentu
userSchema.index({ kodeCabang: 1, peran: 1, kodePengajar: 1 }); 

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;