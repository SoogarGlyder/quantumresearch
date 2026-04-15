import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  jadwalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Jadwal", 
    required: true,
    unique: true, 
    index: true 
  },
  
  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  isAktif: { type: Boolean, default: true },

  soal: [
    {
      pertanyaan: { type: String, required: true },
      gambar: { type: String, default: "" }, 
      opsi: {
        A: { type: String, required: true },
        B: { type: String, required: true },
        C: { type: String, required: true },
        D: { type: String, required: true },
        E: { type: String, required: true }
      },
      kunciJawaban: { type: String, enum: ["A", "B", "C", "D", "E"], required: true }
    }
  ],

  hasilPengerjaan: [
    {
      siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      nama: String,
      skor: Number,
      jawabanSiswa: [String], // Opsional: Untuk melihat detail jawaban mereka (misal: ["A", "C", "B", ...])
      dikumpulkanPada: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);