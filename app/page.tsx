// File: app/page.jsx
import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StudentApp from "../components/StudentApp";

export default async function Home() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const karcis = cookieStore.get("karcis_quantum");

  if (!karcis) {
    redirect("/login");
  }

  const siswa = await User.findById(karcis.value).lean();
  
  if (!siswa) {
    redirect("/login");
  }

  const semuaRiwayat = await StudySession.find({ siswaId: siswa._id })
    .sort({ waktuMulai: -1 })
    .lean();

  // MENCARI JADWAL KHUSUS UNTUK KELAS SISWA INI SAJA!
  const jadwalSiswa = await Jadwal.find({ kelasTarget: siswa.kelas })
    .sort({ tanggal: 1 }) // 1 artinya urut dari tanggal terkecil (terdekat)
    .lean();

  // Ubah _id dari MongoDB menjadi string biasa agar bisa dibaca React
  const serializableSiswa = { ...siswa, _id: siswa._id.toString() };
  const serializableRiwayat = semuaRiwayat.map(r => ({
    ...r,
    _id: r._id.toString(),
    siswaId: r.siswaId.toString(),
    waktuMulai: r.waktuMulai ? r.waktuMulai.toISOString() : null,
    waktuSelesai: r.waktuSelesai ? r.waktuSelesai.toISOString() : null,
  }));
  const serializableJadwal = jadwalSiswa.map(j => ({
    ...j,
    _id: j._id.toString()
  }));

  return (
    <StudentApp 
      siswa={serializableSiswa} 
      riwayat={serializableRiwayat} 
      jadwal={serializableJadwal} // <== KIRIM KE DEPAN
    />
  );
}