import mongoose from "mongoose";
import { OPSI_KELAS, OPSI_MAPEL_KELAS } from "../utils/constants";

const jadwalSchema = new mongoose.Schema({
  kelasTarget: { 
    type: String, 
    required: true,
    enum: OPSI_KELAS, 
    index: true,
    trim: true 
  },
  tanggal: { type: String, required: true, index: true, trim: true }, 
  mapel: { 
    type: String, 
    required: true,
    enum: OPSI_MAPEL_KELAS, 
    trim: true 
  },
  pengajarId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  namaPengajar: { type: String, required: true, trim: true },
  kodePengajar: { type: String, required: true, index: true, trim: true },
  pertemuan: { type: Number, required: true },
  jamMulai: { type: String, required: true, trim: true },
  jamSelesai: { type: String, required: true, trim: true },
  bab: { type: String, default: "", trim: true },         
  subBab: { type: String, default: "", trim: true },      
  galeriPapan: { type: [String], default: [] },
  fotoBersama: { type: String, default: "", trim: true } 
}, { timestamps: true });

jadwalSchema.index({ kelasTarget: 1, tanggal: 1 });

const Jadwal = mongoose.models.Jadwal || mongoose.model("Jadwal", jadwalSchema);
export default Jadwal;