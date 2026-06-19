import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Terhubung ke DB. Memulai migrasi User (M8)...");
  
  const collection = mongoose.connection.db.collection("users");
  const users = await collection.find({ kodeCabang: { $exists: false } }).toArray();
  
  console.log(`Ditemukan ${users.length} user tanpa kodeCabang.`);
  
  let count = 0;
  for (const u of users) {
    let dataUpdate = {};
    if (u.nomorPeserta && u.nomorPeserta.length >= 6) {
      const potongan = u.nomorPeserta.substring(0, 6);
      dataUpdate.kodeCabang = /^\d{6}$/.test(potongan) ? potongan : "010101";
    } else {
      dataUpdate.kodeCabang = "010101"; 
    }

    if (u.peran === "pengajar" && !u.pangkat) {
      dataUpdate.pangkat = "FREELANCE";
      dataUpdate.kelasAsuh = [];
    }

    await collection.updateOne({ _id: u._id }, { $set: dataUpdate });
    count++;
  }
  
  console.log(`✅ Berhasil! ${count} user telah diperbarui. Data Anda akan kembali muncul!`);
  process.exit(0);
}

main();