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
    enum: Object.values(PERAN).map(p => p.id), // ["siswa", "admin", "pengajar"]
    default: PERAN.SISWA.id,
    index: true 
  },
  status: { 
    type: String, 
    enum: Object.values(STATUS_USER), // ["aktif", "tidak aktif"]
    default: STATUS_USER.AKTIF 
  },

  kelas: { type: String, default: "-" },
  kodePengajar: { type: String, default: "-", index: true },
  jadwalKelas: { type: String, default: "-" },
  jamKelas: { type: String, default: "-" },
}, { timestamps: true });

userSchema.index({ nama: 1 });
userSchema.index({ kelas: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;