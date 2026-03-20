import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // --- IDENTITAS UTAMA ---
    nama: { 
      type: String, 
      required: [true, "Nama wajib diisi!"],
      trim: true
    },
    nomorPeserta: { 
      type: String, 
      required: [true, "Nomor peserta wajib diisi!"], 
      unique: true,
      index: true, // 👈 Tambahan: Kecepatan cari ID
      trim: true 
    }, 
    username: { 
      type: String, 
      required: [true, "Username wajib diisi!"], 
      unique: true,
      index: true, // 👈 Tambahan: Kecepatan cari Login
      trim: true,
      lowercase: true
    },
    password: { 
      type: String, 
      required: [true, "Password wajib diisi!"],
      select: false // 👈 KRITIS: Password tidak akan ikut ditarik kecuali diminta eksplisit
    },
    noHp: { 
      type: String, 
      required: [true, "Nomor HP / WA wajib diisi!"],
      trim: true
    },

    // --- OTORISASI & STATUS ---
    peran: { 
      type: String, 
      enum: ["siswa", "admin", "pengajar"], 
      default: "siswa",
      index: true // 👈 Tambahan: Penting untuk filter list Guru/Siswa
    },
    status: { 
      type: String, 
      enum: ["aktif", "tidak aktif"], 
      default: "aktif" 
    },

    // --- DATA AKADEMIK ---
    kelas: { 
      type: String, 
      default: "-" 
    },
    kodePengajar: { 
      type: String, 
      default: "-",
      index: true // 👈 Tambahan: Kecepatan kueri untuk database guru
    },
    jadwalKelas: { 
      type: String, 
      default: "-" 
    },
    jamKelas: { 
      type: String, 
      default: "-" 
    },
  },
  { 
    timestamps: true
  }
);

// Indexing untuk pencarian nama (Full Text Search sederhana)
userSchema.index({ nama: 1 });
userSchema.index({ kelas: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;