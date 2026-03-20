import mongoose from "mongoose";

const jadwalSchema = new mongoose.Schema(
  {
    kelasTarget: { 
      type: String, 
      required: [true, "Kelas target wajib diisi!"],
      index: true, // 👈 Tambahan: Kecepatan filter per kelas
      trim: true 
    },
    tanggal: { 
      type: String, 
      required: [true, "Tanggal jadwal wajib diisi!"],
      index: true, // 👈 Tambahan: Kecepatan filter per hari/bulan
      trim: true 
    }, 
    mapel: { 
      type: String, 
      required: [true, "Mata pelajaran wajib diisi!"],
      trim: true 
    },
    // 👇 UPGRADE: Gunakan ID User untuk relasi yang kuat
    pengajarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID Pengajar wajib dihubungkan!"],
      index: true
    },
    // 👇 Snapshot data untuk keperluan tampilan cepat & filter kode
    namaPengajar: {
      type: String,
      required: [true, "Nama pengajar wajib diisi!"],
      trim: true
    },
    kodePengajar: {
      type: String,
      required: [true, "Kode pengajar wajib diisi!"],
      index: true, // 👈 Tambahan: Memudahkan pencarian jadwal per guru
      trim: true
    },
    pertemuan: {
      type: Number,
      required: [true, "Nomor pertemuan wajib diisi!"]
    },
    jamMulai: { 
      type: String, 
      required: [true, "Jam mulai wajib diisi!"],
      trim: true 
    },
    jamSelesai: { 
      type: String, 
      required: [true, "Jam selesai wajib diisi!"],
      trim: true 
    },
    // --- AREA JURNAL GURU ---
    bab: { 
      type: String, 
      default: "",
      trim: true 
    },         
    subBab: { 
      type: String, 
      default: "",
      trim: true 
    },      
    galeriPapan: { 
      type: [String], 
      default: [] 
    },
    fotoBersama: { 
      type: String, 
      default: "",
      trim: true
    } 
  }, 
  { 
    timestamps: true 
  }
);

// Gabungkan index untuk pencarian jadwal spesifik (Kelas + Tanggal)
jadwalSchema.index({ kelasTarget: 1, tanggal: 1 });

const Jadwal = mongoose.models.Jadwal || mongoose.model("Jadwal", jadwalSchema);

export default Jadwal;