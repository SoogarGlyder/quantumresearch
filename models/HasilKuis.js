import mongoose from "mongoose";

const hasilKuisSchema = new mongoose.Schema({
  jadwalId: { type: mongoose.Schema.Types.ObjectId, ref: "Jadwal", required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  
  namaSiswa: { type: String, required: true },
  skorAkhir: { type: Number, required: true },
  
  // 🚀 STATUS PENGERJAAN & CHECKPOINT (KHUSUS TRY OUT)
  statusPengerjaan: { type: String, enum: ["BERJALAN", "SELESAI"], default: "SELESAI" },
  subtesAktifIndex: { type: Number, default: 0 }, 
  
  // [MODE KUIS REGULER LAMA]
  detailJawaban: [{
    _id: false,
    kunciJawaban: { type: [String], default: [] },
    jawabanSiswa: { type: [String], default: [] },
    isBenar: { type: Boolean, default: false }
  }],

  // 🚀 [MODE TRY OUT ESTAFET BARU] - Untuk Dashboard Rapor Siswa
  riwayatSubtes: [{
    _id: false,
    judulSubtes: { type: String },
    skorSubtes: { type: Number, default: 0 },
    detailJawaban: [{
      _id: false,
      kunciJawaban: { type: [String], default: [] },
      jawabanSiswa: { type: [String], default: [] },
      isBenar: { type: Boolean, default: false }
    }]
  }],
  
  dikumpulkanPada: { type: Date, default: Date.now }
}, { timestamps: true });

// COMPOUND INDEX
hasilKuisSchema.index({ jadwalId: 1, skorAkhir: -1 }); 
hasilKuisSchema.index({ siswaId: 1, createdAt: -1 }); 

export default mongoose.models.HasilKuis || mongoose.model("HasilKuis", hasilKuisSchema);
