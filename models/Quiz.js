import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  jadwalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Jadwal", 
    required: true, unique: true, index: true 
  },
  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isAktif: { type: Boolean, default: true },
  durasi: { type: Number, default: 10 },

  soal: [
    {
      // 🚀 TAMBAHAN: Identifikasi Tipe Soal (PG, PG_KOMPLEKS, BENAR_SALAH, ISIAN)
      tipeSoal: { type: String, default: "PG" }, 
      
      pertanyaan: { type: String, required: true },
      gambar: { type: String, default: "" }, 
      
      // 🚀 UBAH JADI MIXED: Agar Isian Singkat tidak butuh Opsi, dan Menjodohkan bisa pakai Object
      opsi: { type: mongoose.Schema.Types.Mixed, default: {} },
      
      // 🚀 UBAH JADI MIXED: Karena PG Kompleks kuncinya berupa Array (misal: ["A", "C"])
      kunciJawaban: { type: mongoose.Schema.Types.Mixed, required: true }, 
      
      bobotExp: { type: Number, default: 20 },
      jumlahOpsi: { type: Number, default: 5 }, // Berlaku khusus untuk PG
      pembahasan: { type: String, default: "" } 
    }
  ],

  hasilPengerjaan: [
    {
      siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      nama: String,
      skor: Number,
      // 🚀 UBAH JADI MIXED: Jawaban siswa bisa berupa Array di dalam Array jika ada PG Kompleks
      jawabanSiswa: { type: [mongoose.Schema.Types.Mixed], default: [] },
      dikumpulkanPada: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);