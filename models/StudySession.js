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
  
  //  FIX: TAMBAHAN BARU UNTUK FITUR KONSULTASI MANDIRI
  pengajarPendamping: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  
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

// SINGLE INDEX LAMA
studySessionSchema.index({ siswaId: 1, waktuMulai: -1 });
studySessionSchema.index({ jenisSesi: 1 });
studySessionSchema.index({ status: 1 });
studySessionSchema.index({ waktuMulai: -1 });

// COMPOUND INDEX BARU (The Performance Booster)
// 1. Jalan Tol Dashboard Admin: Membantu query super berat $in arraySiswa + waktuMulai
studySessionSchema.index({ waktuMulai: -1, siswaId: 1 }); 
// 2. Jalan Tol Jurnal Absensi: Mengunci pencarian absensi kelas tertentu pada hari tertentu
studySessionSchema.index({ jenisSesi: 1, namaMapel: 1, waktuMulai: -1 }); 
// 3. Jalan Tol Rapor Bulanan Siswa: Mencari sesi selesai per siswa dalam rentang bulan
studySessionSchema.index({ siswaId: 1, status: 1, waktuMulai: -1 }); 
//  FIX: 4. Jalan Tol Jurnal Konsul Pengajar
studySessionSchema.index({ pengajarPendamping: 1, jenisSesi: 1, waktuMulai: -1 }); 

const StudySession = mongoose.models.StudySession || mongoose.model("StudySession", studySessionSchema);
export default StudySession;