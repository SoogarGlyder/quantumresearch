import mongoose from "mongoose";

export const soalSubSchema = new mongoose.Schema({
  tipeSoal: { type: String, default: "PG", trim: true },
  pertanyaan: { type: String, required: true, trim: true },
  gambar: { type: String, default: "", trim: true },
  opsi: [{
    _id: false, label: { type: String, trim: true },
    teks: { type: String, trim: true }
  }],
  kunciJawaban: { type: [String], required: true },
  bobotExp: { type: Number, default: 20, min: 0 },
  jumlahOpsi: { type: Number, default: 5, min: 2 },
  pembahasan: { type: String, default: "", trim: true }
});