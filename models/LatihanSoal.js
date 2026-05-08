import mongoose from "mongoose";

const LatihanSoalSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  url: { type: String, required: true },
  tipeTarget: { type: String, enum: ["KELAS", "SISWA"], required: true },
  target: { type: String, required: true }, 
  isAktif: { type: Boolean, default: true },
  pembuatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  
  namaPembuat: { type: String, default: "Admin Quantum" }, 
  dibuatPada: { type: Date, default: Date.now }
});

// COMPOUND INDEX BARU
// Mempercepat filter pencarian tugas untuk siswa/kelas tertentu yang statusnya masih Aktif
LatihanSoalSchema.index({ isAktif: 1, tipeTarget: 1, target: 1 });

export default mongoose.models.LatihanSoal || mongoose.model("LatihanSoal", LatihanSoalSchema);