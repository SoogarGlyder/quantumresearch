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
  
  // FIX: Penanda Pemisah Mode Ujian
  jenisUjian: { type: String, enum: ["KUIS", "TRYOUT"], default: "KUIS" },
  
  // [MODE KUIS LAMA] Tetap dipertahankan agar kelas reguler tidak error
  durasi: { type: Number, default: 10 },
  soal: [{ /* ... skema soal lama tetap utuh di sini ... */ }],

  // 🚀 [MODE TRY OUT BARU] Wadah untuk Estafet Subtes
  daftarSubtes: [
    {
      judulSubtes: { type: String, required: true }, // Misal: "Penalaran Umum"
      durasi: { type: Number, required: true }, // Durasi spesifik per subtes
      soal: [
        {
          tipeSoal: { type: String, default: "PG" }, 
          pertanyaan: { type: String, required: true },
          gambar: { type: String, default: "" }, 
          opsi: [{
            _id: false, 
            label: { type: String }, 
            teks: { type: String }
          }],
          kunciJawaban: { type: [String], required: true }, 
          bobotExp: { type: Number, default: 20 },
          jumlahOpsi: { type: Number, default: 5 }, 
          pembahasan: { type: String, default: "" } 
        }
      ]
    }
  ]
}, { timestamps: true });

quizSchema.index({ pembuatId: 1, isAktif: 1 });
export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
