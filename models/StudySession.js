import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    // --- RELASI & KATEGORI ---
    siswaId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "ID Siswa wajib diisi!"] 
    },
    jenisSesi: { 
      type: String, 
      required: [true, "Jenis sesi wajib diisi!"],
      lowercase: true, // 👈 Paksa lowercase
      enum: {
        values: ["kelas", "konsul"], // 👈 Sesuaikan dengan filter UI
        message: "{VALUE} bukan jenis sesi yang valid!"
      }
    }, 
    namaMapel: { 
      type: String,
      trim: true 
    },

    // --- WAKTU & DURASI ---
    waktuMulai: { 
      type: Date, 
      default: Date.now 
    },
    waktuSelesai: { 
      type: Date 
    },

    // --- STATUS & TRACKING ---
    status: { 
      type: String, 
      lowercase: true, // 👈 Paksa lowercase
      enum: ["berjalan", "selesai", "alpha", "izin", "tidak hadir"], // 👈 Kunci status
      default: "berjalan",
      trim: true
    },
    terlambatMenit: { 
      type: Number, 
      default: 0,
      min: [0, "Menit keterlambatan tidak boleh kurang dari 0"]
    },
    konsulExtraMenit: { 
      type: Number, 
      default: 0,
      min: [0, "Menit konsul ekstra tidak boleh kurang dari 0"]
    },

    // --- AKADEMIK ---
    nilaiTest: { 
      type: Number, 
      default: null,
      min: [0, "Nilai kuis tidak boleh di bawah 0"],
      max: [100, "Nilai kuis maksimal adalah 100"]
    }
  }, 
  { 
    timestamps: true 
  }
);

// Indexing tetap dipertahankan karena sudah sangat bagus
studySessionSchema.index({ siswaId: 1, waktuMulai: -1 });
studySessionSchema.index({ jenisSesi: 1 });
studySessionSchema.index({ status: 1 }); // 👈 Tambahan: Untuk filter "Siapa yang sedang belajar"
studySessionSchema.index({ waktuMulai: -1 });

const StudySession = mongoose.models.StudySession || mongoose.model("StudySession", studySessionSchema);

export default StudySession;