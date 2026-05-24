import mongoose from "mongoose";

const absensiPengajarSchema = new mongoose.Schema({
  pengajarId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  namaPengajar: { type: String, required: true, trim: true, maxlength: 100 },
  waktuMasuk: { type: Date, required: true, default: Date.now },
  waktuKeluar: { type: Date, default: null },
  lokasiScanMasuk: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  lokasiScanKeluar: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  riwayatEkstraKelas: [{
    jadwalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jadwal' },
    menitEkstra: { type: Number, default: 0, min: 0 }
  }],
  totalMenitEkstraHarian: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

absensiPengajarSchema.index({ pengajarId: 1, waktuMasuk: -1 });
absensiPengajarSchema.index({ waktuMasuk: -1 });

const AbsensiPengajar = mongoose.models.AbsensiPengajar || mongoose.model("AbsensiPengajar", absensiPengajarSchema);
export default AbsensiPengajar;