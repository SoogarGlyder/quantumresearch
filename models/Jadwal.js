import mongoose from "mongoose";

const jadwalSchema = new mongoose.Schema(
  {
    kelasTarget: { 
      type: String, 
      required: [true, "Kelas target wajib diisi!"],
      trim: true 
    },
    tanggal: { 
      type: String, 
      required: [true, "Tanggal jadwal wajib diisi!"],
      trim: true 
    }, 
    mapel: { 
      type: String, 
      required: [true, "Mata pelajaran wajib diisi!"],
      trim: true 
    },
    pengajar: {
      type: String,
      required: [true, "Nama pengajar wajib diisi!"],
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

const Jadwal = mongoose.models.Jadwal || mongoose.model("Jadwal", jadwalSchema);

export default Jadwal;