import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar"; 
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import StudentApp from "../components/StudentApp";
import TeacherApp from "../components/TeacherApp";

// 🚀 IMPORT FUNGSI PENGAMBIL DATA LATIHAN SOAL
import { dapatkanLatihanSiswa } from "../actions/soalAction";

import { 
  PERAN, 
  STATUS_SESI, 
  KONFIGURASI_SISTEM, 
  LABEL_SISTEM 
} from "../utils/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const serialize = (data: any) => JSON.parse(JSON.stringify(data));

// 🚀 HELPER: Format YYYY-MM-DD aman tanpa terpengaruh Zona Waktu UTC
const formatYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  // 🚀 LOGIKA WAKTU "DIET DATA" BERDASARKAN BULAN BERJALAN
  // ==========================================================================
  const sekarang = new Date();
  const y = sekarang.getFullYear();
  const m = sekarang.getMonth();
  const d = sekarang.getDate();

  // --------------------------------------------------------------------------
  // 1. Pagar Staf (Cut-off Dinamis: 29 s/d 28)
  // --------------------------------------------------------------------------
  let minDateStafObj, maxDateStafObj;

  if (d >= 29) {
    // 🚩 KASUS: Tanggal 29, 30, 31
    // Artinya sudah masuk siklus bulan depan.
    // Contoh: 29 April -> Start: 29 April | End: 28 Mei
    minDateStafObj = new Date(y, m, 29);
    maxDateStafObj = new Date(y, m + 1, 28, 23, 59, 59);
  } else {
    // 🚩 KASUS: Tanggal 1 s/d 28
    // Masih berada di dalam siklus yang dimulai bulan lalu.
    // Contoh: 10 April -> Start: 29 Maret | End: 28 April
    minDateStafObj = new Date(y, m - 1, 29);
    maxDateStafObj = new Date(y, m, 28, 23, 59, 59);
  }

  const strMinStaf = formatYMD(minDateStafObj);
  const strMaxStaf = formatYMD(maxDateStafObj);

  // --------------------------------------------------------------------------
  // 2. Pagar Siswa (Tetap Tanggal 1 s/d Akhir Bulan)
  // --------------------------------------------------------------------------
  const minDateSiswaObj = new Date(y, m, 1);
  const maxDateSiswaObj = new Date(y, m + 1, 0, 23, 59, 59);
  const strMinSiswa = formatYMD(minDateSiswaObj);
  const strMaxSiswa = formatYMD(maxDateSiswaObj);

  // ==========================================================================
  // CABANG 2: PENGAJAR 
  // ==========================================================================
  if (userLogin.peran === PERAN.PENGAJAR.id) {
    
    // 🚀 MENGGUNAKAN PAGAR STAF DINAMIS
    const [jadwalPengajar, riwayatAbsensi] = await Promise.all([
      Jadwal.find({ 
        kodePengajar: userLogin.kodePengajar,
        tanggal: { $gte: strMinStaf, $lte: strMaxStaf }
      })
        .sort({ tanggal: 1 })
        .lean(),
      AbsensiPengajar.find({ 
        pengajarId: userLogin._id,
        waktuMasuk: { $gte: minDateStafObj, $lte: maxDateStafObj }
      }) 
        .sort({ waktuMasuk: -1 })
        .lean()
    ]);

    return (
      <TeacherApp 
        dataUser={serialize(userLogin)} 
        jadwal={serialize(jadwalPengajar)} 
        absensi={serialize(riwayatAbsensi)} 
        onLogout={null}
      />
    );
  }

  // ==========================================================================
  // CABANG 3: SISWA 
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

  const [riwayatRaw, jadwalRaw, statsRaw, latihanHariIniRaw] = await Promise.all([
    StudySession.find({ 
      siswaId: userLogin._id,
      waktuMulai: { $gte: minDateSiswaObj, $lte: maxDateSiswaObj }
    })
      .sort({ waktuMulai: -1 })
      .lean(),
    Jadwal.find({ 
      kelasTarget: userLogin.kelas,
      tanggal: { $gte: strMinSiswa, $lte: strMaxSiswa }
    })
      .sort({ tanggal: 1 })
      .lean(),
    statsSiswaPromise,
    dapatkanLatihanSiswa(userLogin.username, userLogin.kelas)
  ]);

  const statistik = statsRaw.length > 0 ? statsRaw[0] : { totalMenit: 0, totalSesi: 0 };

  return (
    <StudentApp 
      siswa={serialize(userLogin)} 
      riwayat={serialize(riwayatRaw)} 
      jadwal={serialize(jadwalRaw)}
      statistik={serialize(statistik)}
      latihanHariIni={serialize(latihanHariIniRaw)} 
    />
  );
}