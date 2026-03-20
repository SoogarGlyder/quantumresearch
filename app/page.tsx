// File: app/page.tsx
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

  // 1. Ambil data User (Tanpa password)
  const userLogin = await User.findById(karcis).select("-password").lean();
  
  if (!userLogin) redirect("/login");

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
    const jadwalGuru = await Jadwal.find({ pengajar: userLogin.nama })
      .sort({ tanggal: 1 })
      .lean();

    return (
      <TeacherApp 
        dataUser={serialize(userLogin)} 
        jadwal={serialize(jadwalGuru)} 
      />
    );
  }

  // ==========================================================================
  // CABANG 3: SISWA
  // ==========================================================================
  const statsSiswaPromise = StudySession.aggregate([
    { $match: { siswaId: userLogin._id, status: "Selesai" } },
    { 
      $group: { 
        _id: null, 
        totalMenit: { 
          $sum: { 
            $divide: [
              { $subtract: ["$waktuSelesai", "$waktuMulai"] }, 
              60000 
            ] 
          } 
        },
        totalSesi: { $count: {} }
      } 
    }
  ]);

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