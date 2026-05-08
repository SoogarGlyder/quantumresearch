import mongoose from "mongoose";

const hasilKuisSchema = new mongoose.Schema({
  jadwalId: { type: mongoose.Schema.Types.ObjectId, ref: "Jadwal", required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  
  namaSiswa: { type: String, required: true },
  skorAkhir: { type: Number, required: true },
  
  // Detail jawaban siswa dipindah ke sini
  detailJawaban: [{
    _id: false,
    kunciJawaban: { type: [String], default: [] },
    jawabanSiswa: { type: [String], default: [] },
    isBenar: { type: Boolean, default: false }
  }],
  
  dikumpulkanPada: { type: Date, default: Date.now }
}, { timestamps: true });

// 🚀 JALAN TOL (COMPOUND INDEX)
hasilKuisSchema.index({ jadwalId: 1, skorAkhir: -1 }); // Mempercepat guru melihat ranking nilai per kelas
hasilKuisSchema.index({ siswaId: 1, createdAt: -1 }); // Mempercepat tarikan data rapor per siswa

export default mongoose.models.HasilKuis || mongoose.model("HasilKuis", hasilKuisSchema);