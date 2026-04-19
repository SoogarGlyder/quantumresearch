import mongoose from "mongoose";

const bankSoalSchema = new mongoose.Schema({
  // 🚀 IDENTITAS PAKET SOAL (Berdiri Sendiri)
  judul: { type: String, required: true },
  mapel: { type: String, default: "Umum" },
  
  // 🚀 PEMBUAT SOAL (Bisa Guru atau Admin)
  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // 🚀 FITUR QC ADMIN (Opsional untuk masa depan, mencegah guru sembarangan edit soal ujian resmi)
  isOfficial: { type: Boolean, default: false }, 
  
  // 🚀 DURASI DEFAULT (Akan di-copy ke kelas nanti, tapi guru bisa mengubahnya per-kelas)
  durasi: { type: Number, default: 10 },

  // 🚀 KERTAS SOAL (Strukturnya 100% sama persis dengan Quiz.js agar mudah di-copy)
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
  ]
  // ❌ PERHATIKAN: Tidak ada `jadwalId` dan `hasilPengerjaan` di sini!
}, { timestamps: true });

export default mongoose.models.BankSoal || mongoose.model("BankSoal", bankSoalSchema);