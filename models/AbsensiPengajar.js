import mongoose from "mongoose";

const absensiPengajarSchema = new mongoose.Schema({
  pengajarId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  waktuMasuk: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  waktuKeluar: { 
    type: Date, 
    default: null 
  },
  lokasiScanMasuk: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  lokasiScanKeluar: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  // ==========================================
  // TAMBAHAN BARU: PENCATATAN EKSTRA KONSUL
  // ==========================================
  riwayatEkstraKelas: [{
    jadwalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jadwal' },
    menitEkstra: { type: Number, default: 0 }
  }],
  totalMenitEkstraHarian: { type: Number, default: 0 }
  // ==========================================
}, { timestamps: true });

// Indexing lama
absensiPengajarSchema.index({ pengajarId: 1, waktuMasuk: -1 });

// COMPOUND INDEX BARU
// Mempercepat query rentang waktu di TabAbsenStaf (Filter waktuMasuk $gte $lte)
absensiPengajarSchema.index({ waktuMasuk: -1 });

const AbsensiPengajar = mongoose.models.AbsensiPengajar || mongoose.model("AbsensiPengajar", absensiPengajarSchema);
export default AbsensiPengajar;