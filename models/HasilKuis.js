import mongoose from "mongoose";

const hasilKuisSchema = new mongoose.Schema({
  jadwalId: { type: mongoose.Schema.Types.ObjectId, ref: "Jadwal", required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  
  namaSiswa: { type: String, required: true },
  
  // 🚀 STATUS PENGERJAAN: Untuk mendeteksi apakah siswa sedang berada di "Layar Jeda"
  statusPengerjaan: { type: String, enum: ["BERJALAN", "SELESAI"], default: "SELESAI" },
  subtesAktifIndex: { type: Number, default: 0 }, // Menyimpan indeks subtes terakhir yang belum di-submit
  
  // Total Akumulasi Skor Keseluruhan
  skorAkhir: { type: Number, required: true },
  
  // [MODE KUIS LAMA] Detail jawaban tunggal
  detailJawaban: [{
    _id: false,
    kunciJawaban: { type: [String], default: [] },
    jawabanSiswa: { type: [String], default: [] },
    isBenar: { type: Boolean, default: false }
  }],

  // 🚀 [MODE TRY OUT BARU] Rapor per Subtes (Sangat berguna untuk analitik kelemahan siswa)
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

hasilKuisSchema.index({ jadwalId: 1, skorAkhir: -1 }); 
hasilKuisSchema.index({ siswaId: 1, createdAt: -1 }); 

export default mongoose.models.HasilKuis || mongoose.model("HasilKuis", hasilKuisSchema);
