import mongoose from "mongoose";
import { TIPE_SESI, STATUS_SESI } from "../utils/constants";

const studySessionSchema = new mongoose.Schema({
  siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  namaSiswa: { type: String, required: true, trim: true, maxlength: 100 },
  jenisSesi: { type: String, required: true, lowercase: true, enum: Object.values(TIPE_SESI), trim: true },
  namaMapel: { type: String, trim: true, maxlength: 100 },
  pengajarPendamping: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  namaPengajarPendamping: { type: String, default: null, trim: true, maxlength: 100 },
  waktuMulai: { type: Date, default: Date.now },
  waktuSelesai: { type: Date },
  status: { type: String, lowercase: true, enum: Object.values(STATUS_SESI).map(s => s.id), default: STATUS_SESI.BERJALAN.id, trim: true },
  terlambatMenit: { type: Number, default: 0, min: 0 },
  konsulExtraMenit: { type: Number, default: 0, min: 0 },
  nilaiTest: { type: Number, default: null, min: 0, max: 100 }
}, { timestamps: true });

studySessionSchema.index({ siswaId: 1, waktuMulai: -1 });
studySessionSchema.index({ jenisSesi: 1 });
studySessionSchema.index({ status: 1 });
studySessionSchema.index({ waktuMulai: -1 });
studySessionSchema.index({ waktuMulai: -1, siswaId: 1 });
studySessionSchema.index({ jenisSesi: 1, namaMapel: 1, waktuMulai: -1 });
studySessionSchema.index({ siswaId: 1, status: 1, waktuMulai: -1 });
studySessionSchema.index({ pengajarPendamping: 1, jenisSesi: 1, waktuMulai: -1 });

const StudySession = mongoose.models.StudySession || mongoose.model("StudySession", studySessionSchema);
export default StudySession;