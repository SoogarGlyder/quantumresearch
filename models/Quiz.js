import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  jadwalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Jadwal", 
    required: true, unique: true, index: true 
  },
  
  sumberBankSoalId: { type: mongoose.Schema.Types.ObjectId, ref: "BankSoal" },

  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isAktif: { type: Boolean, default: true },
  durasi: { type: Number, default: 10 },

  soal: [
    {
      tipeSoal: { type: String, default: "PG" }, 
      pertanyaan: { type: String, required: true },
      gambar: { type: String, default: "" }, 
      opsi: { type: mongoose.Schema.Types.Mixed, default: {} },
      kunciJawaban: { type: mongoose.Schema.Types.Mixed, required: true }, 
      bobotExp: { type: Number, default: 20 },
      jumlahOpsi: { type: Number, default: 5 }, 
      pembahasan: { type: String, default: "" } 
    }
  ],

  // 🚀 NILAI SISWA (Tetap menempel di Jadwal ini, tidak akan bercampur dengan kelas lain)
  hasilPengerjaan: [
    {
      siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      nama: String,
      skor: Number,
      jawabanSiswa: { type: [mongoose.Schema.Types.Mixed], default: [] },
      dikumpulkanPada: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);