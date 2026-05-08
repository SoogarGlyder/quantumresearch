import mongoose from "mongoose";

const bankSoalSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  mapel: { type: String, default: "Umum" },
  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isOfficial: { type: Boolean, default: false }, 
  durasi: { type: Number, default: 10 },
  soal: [
    {
      tipeSoal: { type: String, default: "PG" }, 
      pertanyaan: { type: String, required: true },
      gambar: { type: String, default: "" }, 
      
      //FIX: Opsi kini berupa Array of Objects yang ketat
      opsi: [{
        _id: false, // Mematikan auto-ID agar database tidak bengkak
        label: { type: String }, // "A", "B", dsb
        teks: { type: String }
      }],
      
      //FIX: Kunci Jawaban dipaksa menjadi Array of Strings (Cocok untuk semua tipe soal)
      kunciJawaban: { type: [String], required: true }, 
      
      bobotExp: { type: Number, default: 20 },
      jumlahOpsi: { type: Number, default: 5 }, 
      pembahasan: { type: String, default: "" } 
    }
  ]
}, { timestamps: true });

// COMPOUND INDEX
bankSoalSchema.index({ pembuatId: 1, createdAt: -1 });

export default mongoose.models.BankSoal || mongoose.model("BankSoal", bankSoalSchema);