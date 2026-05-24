import mongoose from "mongoose";
import { TIPE_TARGET_TUGAS } from "../utils/constants";

const LatihanSoalSchema = new mongoose.Schema({
  judul: { type: String, required: true, trim: true, maxlength: 255 },
  url: { type: String, required: true, trim: true },
  tipeTarget: { 
    type: String, 
    enum: Object.values(TIPE_TARGET_TUGAS), 
    required: true 
  },
  
  target: { type: String, required: true, trim: true }, 
  isAktif: { type: Boolean, default: true },
  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  namaPembuat: { type: String, default: "Admin Quantum", trim: true }, 
}, { 
  timestamps: true 
});

LatihanSoalSchema.index({ isAktif: 1, tipeTarget: 1, target: 1 });

export default mongoose.models.LatihanSoal || mongoose.model("LatihanSoal", LatihanSoalSchema);