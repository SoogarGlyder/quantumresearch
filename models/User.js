import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nama: { 
      type: String, 
      required: [true, "Nama wajib diisi!"],
      trim: true
    },
    nomorPeserta: { 
      type: String, 
      required: [true, "Nomor peserta wajib diisi!"], 
      unique: true,
      trim: true 
    }, 
    username: { 
      type: String, 
      required: [true, "Username wajib diisi!"], 
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { 
      type: String, 
      required: [true, "Password wajib diisi!"] 
    },
    noHp: { 
      type: String, 
      required: [true, "Nomor HP / WA wajib diisi!"],
      trim: true
    },
    peran: { 
      type: String, 
      enum: ["siswa", "admin", "pengajar"], 
      default: "siswa" 
    },
    kelas: { 
      type: String, 
      default: "-" 
    },
    jadwalKelas: { 
      type: String, 
      default: "-" 
    },
    jamKelas: { 
      type: String, 
      default: "-" 
    },
    status: { 
      type: String, 
      enum: ["aktif", "tidak aktif"], 
      default: "aktif" 
    },
  },
  { 
    timestamps: true
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;