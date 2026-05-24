import mongoose from "mongoose";
import { soalSubSchema } from "./SoalSchema";

const quizSchema = new mongoose.Schema({
  jadwalId: { type: mongoose.Schema.Types.ObjectId, ref: "Jadwal", required: true, unique: true, index: true },
  sumberBankSoalId: { type: mongoose.Schema.Types.ObjectId, ref: "BankSoal" },
  pembuatId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  namaPembuat: { type: String, default: "Admin", trim: true, maxlength: 100 },
  isAktif: { type: Boolean, default: true },
  durasi: { type: Number, default: 10, min: 1 },
  soal: [soalSubSchema]
}, { timestamps: true });

quizSchema.index({ pembuatId: 1, isAktif: 1 });

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);