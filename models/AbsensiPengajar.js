import mongoose from "mongoose";

const absensiPengajarSchema = new mongoose.Schema({
  // Relasi langsung ke koleksi "User" milik Bos
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
  
  // Titik kordinat GPS saat Clock-In
  lokasiScanMasuk: { 
    lat: { type: Number }, 
    lng: { type: Number } 
  },
  
  // Titik kordinat GPS saat Clock-Out
  lokasiScanKeluar: { 
    lat: { type: Number }, 
    lng: { type: Number } 
  }
}, { timestamps: true });

// Indexing agar sistem database mencari data absen lebih cepat (berdasarkan ID dan tanggal terbaru)
absensiPengajarSchema.index({ pengajarId: 1, waktuMasuk: -1 });

const AbsensiPengajar = mongoose.models.AbsensiPengajar || mongoose.model("AbsensiPengajar", absensiPengajarSchema);
export default AbsensiPengajar;