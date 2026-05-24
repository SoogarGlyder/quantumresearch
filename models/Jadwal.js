import mongoose from "mongoose";
import { OPSI_KELAS, OPSI_MAPEL_KELAS } from "../utils/constants";

const jadwalSchema = new mongoose.Schema({
  kelasTarget: { type: String, required: true, enum: OPSI_KELAS, index: true, trim: true },
  tanggal: { type: String, required: true, index: true, trim: true },
  mapel: { type: String, required: true, enum: OPSI_MAPEL_KELAS, trim: true },
  pengajarId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  namaPengajar: { type: String, required: true, trim: true, maxlength: 100 },
  kodePengajar: { type: String, required: true, index: true, trim: true, maxlength: 20 },
  pertemuan: { type: Number, required: true, min: 1 },
  jamMulai: { type: String, required: true, trim: true },
  jamSelesai: { type: String, required: true, trim: true },
  bab: { type: String, default: "", trim: true, maxlength: 255 },
  subBab: { type: String, default: "", trim: true, maxlength: 255 },
  galeriPapan: { type: [String], default: [] },
  fotoBersama: { type: String, default: "", trim: true }
}, { timestamps: true });

jadwalSchema.index({ kelasTarget: 1, tanggal: 1 });
jadwalSchema.index({ tanggal: 1, pengajarId: 1 });

const Jadwal = mongoose.models.Jadwal || mongoose.model("Jadwal", jadwalSchema);
export default Jadwal;