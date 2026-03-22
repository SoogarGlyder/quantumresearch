import mongoose from "mongoose";
import { TIPE_SESI, STATUS_SESI } from "../utils/constants";

const studySessionSchema = new mongoose.Schema({
  siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jenisSesi: { 
    type: String, 
    required: true,
    lowercase: true,
    enum: Object.values(TIPE_SESI) // ["kelas", "konsul"]
  }, 
  namaMapel: { type: String, trim: true },
  waktuMulai: { type: Date, default: Date.now },
  waktuSelesai: { type: Date },
  status: { 
    type: String, 
    lowercase: true,
    enum: Object.values(STATUS_SESI).map(s => s.id), // ["selesai", "berjalan", ...]
    default: STATUS_SESI.BERJALAN.id,
    trim: true
  },
  terlambatMenit: { type: Number, default: 0 },
  konsulExtraMenit: { type: Number, default: 0 },
  nilaiTest: { type: Number, default: null, min: 0, max: 100 }
}, { timestamps: true });

studySessionSchema.index({ siswaId: 1, waktuMulai: -1 });
studySessionSchema.index({ jenisSesi: 1 });
studySessionSchema.index({ status: 1 });
studySessionSchema.index({ waktuMulai: -1 });

const StudySession = mongoose.models.StudySession || mongoose.model("StudySession", studySessionSchema);
export default StudySession;