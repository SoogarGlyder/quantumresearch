import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar"; // 👈 1. WAJIB DIIMPORT
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import StudentApp from "../components/StudentApp";
import TeacherApp from "../components/TeacherApp";

// Import Konstitusi Quantum
import { 
  PERAN, 
  STATUS_SESI, 
  KONFIGURASI_SISTEM, 
  LIMIT_DATA, 
  LABEL_SISTEM 
} from "../utils/constants";

// 🚀 2. PAKSA DYNAMIC: Agar router.refresh() bisa menarik data terbaru dari DB
export const dynamic = "force-dynamic";
export const revalidate = 0;

const serialize = (data: any) => JSON.parse(JSON.stringify(data));

export default async function Home() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const karcis = cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;

  if (!karcis) redirect(KONFIGURASI_SISTEM.PATH_LOGIN);

  const userLogin = await User.findById(karcis).select("-password").lean();
  
  if (!userLogin) {
    redirect(`${KONFIGURASI_SISTEM.PATH_LOGIN}?${LABEL_SISTEM.REDIRECT_CLEAR}`); 
  }

  if (userLogin.peran === PERAN.ADMIN.id) {
    redirect(PERAN.ADMIN.home);
  }

  // ==========================================================================
  // CABANG 2: PENGAJAR (FIXED: Data Absensi Ditambahkan)
  // ==========================================================================
  if (userLogin.peran === PERAN.PENGAJAR.id) {
    // 🚀 3. AMBIL DATA ABSENSI: Cari riwayat absen staf ini
    const [jadwalPengajar, riwayatAbsensi] = await Promise.all([
      Jadwal.find({ kodePengajar: userLogin.kodePengajar })
        .sort({ tanggal: 1 })
        .lean(),
      AbsensiPengajar.find({ pengajarId: userLogin._id }) // Ambil riwayat absen
        .sort({ waktuMasuk: -1 })
        .limit(10)
        .lean()
    ]);

    return (
      <TeacherApp 
        dataUser={serialize(userLogin)} 
        jadwal={serialize(jadwalPengajar)} 
        absensi={serialize(riwayatAbsensi)} // 👈 4. KIRIM KE TEACHER APP
        onLogout={null}
      />
    );
  }

  // ==========================================================================
  // CABANG 3: SISWA (Ditambahkan prop 'absensi' jika TeacherApp butuh di layout yang sama)
  // ==========================================================================
  
  const statsSiswaPromise = StudySession.aggregate([
    { 
      $match: { 
        siswaId: userLogin._id, 
        status: STATUS_SESI.SELESAI.id 
      } 
    },
    { 
      $group: { 
        _id: null, 
        totalMenit: { 
          $sum: { 
            $add: [
              { $max: [0, { $divide: [{ $subtract: ["$waktuSelesai", "$waktuMulai"] }, 60000] }] },
              { $ifNull: ["$konsulExtraMenit", 0] }
            ]
          } 
        },
        totalSesi: { $count: {} }
      } 
    }
  ]).exec();

  const [riwayatRaw, jadwalRaw, statsRaw] = await Promise.all([
    StudySession.find({ siswaId: userLogin._id })
      .sort({ waktuMulai: -1 })
      .limit(LIMIT_DATA.DASHBOARD_HISTORY)
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