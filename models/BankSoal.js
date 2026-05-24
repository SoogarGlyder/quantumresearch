import mongoose from "mongoose";
import { soalSubSchema } from "./SoalSchema";

const bankSoalSchema = new mongoose.Schema({
  judul: { type: String, required: true, trim: true, maxlength: 255 },
  mapel: { type: String, default: "Umum", trim: true },
  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  namaPembuat: { type: String, required: true, trim: true, maxlength: 100 },
  isOfficial: { type: Boolean, default: false },
  durasi: { type: Number, default: 10, min: 1 },
  soal: [soalSubSchema]
}, { timestamps: true });

bankSoalSchema.index({ pembuatId: 1, createdAt: -1 });

export default mongoose.models.BankSoal || mongoose.model("BankSoal", bankSoalSchema);