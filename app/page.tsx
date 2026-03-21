import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import StudentApp from "../components/StudentApp";
import TeacherApp from "../components/TeacherApp";

const serialize = (data: any) => JSON.parse(JSON.stringify(data));

export default async function Home() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const karcis = cookieStore.get("karcis_quantum")?.value;

  if (!karcis) redirect("/login");

  // 1. Ambil data User
  const userLogin = await User.findById(karcis).select("-password").lean();
  
  // 🛡️ ANTI INFINITE LOOP: Jika cookie ada tapi user dihapus Admin, hapus cookie!
  if (!userLogin) {
    redirect("/login?clear=true"); 
  }

  // ==========================================================================
  // CABANG 1: ADMIN -> Lempar ke Dashboard Admin
  // ==========================================================================
  if (userLogin.peran === "admin") {
    redirect("/admin");
  }

  // ==========================================================================
  // CABANG 2: PENGAJAR / GURU
  // ==========================================================================
  if (userLogin.peran === "pengajar" || userLogin.peran === "guru") {
    const jadwalGuru = await Jadwal.find({ kodePengajar: userLogin.kodePengajar })
      .sort({ tanggal: 1 })
      .lean();

    return (
      <TeacherApp 
        dataUser={serialize(userLogin)} 
        jadwal={serialize(jadwalGuru)} 
        onLogout={null}
      />
    );
  }

  // ==========================================================================
  // CABANG 3: SISWA
  // ==========================================================================
  const statsSiswaPromise = StudySession.aggregate([
    // 🛠️ PERBAIKAN: Deteksi status dengan huruf kecil / tidak case sensitive
    { $match: { siswaId: userLogin._id, status: { $regex: /selesai/i } } },
    { 
      $group: { 
        _id: null, 
        totalMenit: { 
          $sum: { 
            // Tambahkan $max agar tidak ada waktu minus jika data salah
            $max: [0, { $divide: [{ $subtract: ["$waktuSelesai", "$waktuMulai"] }, 60000] }] 
          } 
        },
        totalSesi: { $count: {} }
      } 
    }
  ]).exec(); // Gunakan .exec() agar stabil di Promise.all

  const [riwayatRaw, jadwalRaw, statsRaw] = await Promise.all([
    StudySession.find({ siswaId: userLogin._id })
      .sort({ waktuMulai: -1 })
      .limit(50)
      .lean(),
    Jadwal.find({ kelasTarget: userLogin.kelas })
      .sort({ tanggal: 1 })
      .lean(),
    statsSiswaPromise
  ]);

  const statistik = statsRaw.length > 0 ? statsRaw[0] : { totalMenit: 0, totalSesi: 0 };

  return (
    <StudentApp 
      siswa={serialize(userLogin)} 
      riwayat={serialize(riwayatRaw)} 
      jadwal={serialize(jadwalRaw)}
      statistik={serialize(statistik)}
    />
  );
}