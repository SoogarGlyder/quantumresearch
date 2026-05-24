import mongoose from "mongoose";

const hasilKuisSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },  
  siswaId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  namaSiswa: { type: String, required: true, trim: true, maxlength: 100 },
  jadwalId: { type: mongoose.Schema.Types.ObjectId, ref: "Jadwal", required: true, index: true },
  jawaban: [
    {
      _id: false,
      nomorSoal: { type: Number, required: true, min: 1 },
      jawabanSiswa: [{ type: String, trim: true }], 
      isBenar: { type: Boolean, default: false }
    }
  ],
  totalBenar: { type: Number, default: 0, min: 0 },
  totalSalah: { type: Number, default: 0, min: 0 },
  nilai: { type: Number, default: 0, min: 0, max: 100 },
  totalExpDidapat: { type: Number, default: 0, min: 0 },
  waktuMulai: { type: Date, default: Date.now },
  waktuSelesai: { type: Date, default: null },
  durasiPengerjaanDetik: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

hasilKuisSchema.index({ quizId: 1, siswaId: 1 }, { unique: true });
hasilKuisSchema.index({ jadwalId: 1 });

const HasilKuis = mongoose.models.HasilKuis || mongoose.model("HasilKuis", hasilKuisSchema);
export default HasilKuis;