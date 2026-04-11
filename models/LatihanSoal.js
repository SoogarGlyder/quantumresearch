import mongoose from "mongoose";

const LatihanSoalSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  url: { type: String, required: true },
  tipeTarget: { type: String, enum: ["KELAS", "SISWA"], required: true },
  target: { type: String, required: true }, 
  isAktif: { type: Boolean, default: true },
  
  // 🚀 FIX: Ubah ke String biasa agar Mongoose tidak bingung
  pembuatId: { type: String, default: null },
  namaPembuat: { type: String, default: "Admin Quantum" }, 
  
  dibuatPada: { type: Date, default: Date.now }
});

export default mongoose.models.LatihanSoal || mongoose.model("LatihanSoal", LatihanSoalSchema);