import mongoose from "mongoose";

const absensiPengajarSchema = new mongoose.Schema({
  // Relasi langsung ke koleksi "User" (Tabel Utama)
  pengajarId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  // Waktu saat pengajar pertama kali scan barcode hari itu (Clock-In)
  waktuMasuk: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  
  // Waktu saat pengajar scan barcode untuk kedua kalinya hari itu (Clock-Out)
  waktuKeluar: { 
    type: Date, 
    default: null 
  },
  
  // Titik koordinat GPS saat Clock-In (Dibuat opsional/bisa null)
  lokasiScanMasuk: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  
  // Titik koordinat GPS saat Clock-Out (Dibuat opsional/bisa null)
  lokasiScanKeluar: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  }
}, { timestamps: true });

// Indexing agar sistem database mencari data absen lebih cepat (berdasarkan ID dan tanggal terbaru)
absensiPengajarSchema.index({ pengajarId: 1, waktuMasuk: -1 });

const AbsensiPengajar = mongoose.models.AbsensiPengajar || mongoose.model("AbsensiPengajar", absensiPengajarSchema);
export default AbsensiPengajar;