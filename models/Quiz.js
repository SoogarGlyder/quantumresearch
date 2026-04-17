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
  
  // 🚀 TAMBAHAN 1: Menerima data durasi ujian
  durasi: { type: Number, default: 10 },

  soal: [
    {
      pertanyaan: { type: String, required: true },
      gambar: { type: String, default: "" }, 
      opsi: {
        A: { type: String, required: true },
        B: { type: String, required: true },
        C: { type: String, required: true },
        D: { type: String, required: true },
        // 🚀 PERBAIKAN: E tidak lagi required karena ada mode 4 Opsi (A-D)
        E: { type: String, default: "" } 
      },
      // 🚀 PERBAIKAN: Enum dihapus agar lebih aman untuk variasi soal ke depannya
      kunciJawaban: { type: String, required: true }, 
      
      // 🚀 TAMBAHAN 2: Menerima data struktur soal baru
      bobotExp: { type: Number, default: 20 },
      jumlahOpsi: { type: Number, default: 5 },
      pembahasan: { type: String, default: "" } 
    }
  ],

  hasilPengerjaan: [
    {
      siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      nama: String,
      skor: Number,
      jawabanSiswa: [String], 
      dikumpulkanPada: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);