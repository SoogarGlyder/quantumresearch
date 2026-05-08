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
      
      // 🚀 FIX FASE 2: Opsi ketat (Array of Objects)
      opsi: [{
        _id: false, // Mematikan auto-ID Mongoose agar hemat memori
        label: { type: String }, 
        teks: { type: String }
      }],
      
      // 🚀 FIX FASE 2: Kunci Jawaban ketat (Array of Strings)
      kunciJawaban: { type: [String], required: true }, 
      
      bobotExp: { type: Number, default: 20 },
      jumlahOpsi: { type: Number, default: 5 }, 
      pembahasan: { type: String, default: "" } 
    }
  ]
  // 🚀 FIX FASE 3: Array hasilPengerjaan RESMI DIHAPUS dari sini!
}, { timestamps: true });

// COMPOUND INDEX
quizSchema.index({ pembuatId: 1, isAktif: 1 });

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);