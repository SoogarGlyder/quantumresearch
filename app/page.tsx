import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar"; 
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import StudentApp from "../components/StudentApp";
import TeacherApp from "../components/TeacherApp";

import { dapatkanLatihanSiswa } from "../actions/soalAction";

import { 
  PERAN, 
  STATUS_SESI, 
  KONFIGURASI_SISTEM, 
  LABEL_SISTEM,
  CABANG_QUANTUM 
} from "../utils/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const serialize = (data: any) => JSON.parse(JSON.stringify(data));

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

  const userLogin = await User.findById(karcis).select("-password").lean() as any;
  
  if (!userLogin) {
    redirect(`${KONFIGURASI_SISTEM.PATH_LOGIN}?${LABEL_SISTEM.REDIRECT_CLEAR}`); 
  }

  if (userLogin.peran === PERAN.ADMIN.id) {
    redirect(PERAN.ADMIN.home);
  }

  // ==========================================================================
  // 🚀 PERBAIKAN: LOGIKA WAKTU "DIET DATA" KEBAL ZONA WAKTU VERCEL (UTC)
  // ==========================================================================
  
  // 1. Ambil waktu saat ini, lalu paksa konversi ke string berformat waktu Jakarta
  const waktuJakartaStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  
  // 2. Buat objek Date baru yang murni membaca angka dari waktu Jakarta tersebut
  const sekarang = new Date(waktuJakartaStr);
  
  const y = sekarang.getFullYear();
  const m = sekarang.getMonth();
  const d = sekarang.getDate();

  let minDateStafObj, maxDateStafObj;

  // --------------------------------------------------------------------------
  // Pagar Staf (Cut-off Dinamis: 29 s/d 28)
  // --------------------------------------------------------------------------
  if (d >= 29) {
    minDateStafObj = new Date(y, m, 29);
    maxDateStafObj = new Date(y, m + 1, 28, 23, 59, 59);
  } else {
    minDateStafObj = new Date(y, m - 1, 29);
    maxDateStafObj = new Date(y, m, 28, 23, 59, 59);
  }

  const strMinStaf = formatYMD(minDateStafObj);
  const strMaxStaf = formatYMD(maxDateStafObj);

  // --------------------------------------------------------------------------
  // Pagar Siswa (Bulan Berjalan 1 - 30/31)
  // --------------------------------------------------------------------------
  const minDateSiswaObj = new Date(y, m, 1);
  const maxDateSiswaObj = new Date(y, m + 1, 0, 23, 59, 59);
  const strMinSiswa = formatYMD(minDateSiswaObj);
  const strMaxSiswa = formatYMD(maxDateSiswaObj);

  // ==========================================================================
  // CABANG 2: PENGAJAR 
  // ==========================================================================
  if (userLogin.peran === PERAN.PENGAJAR.id) {
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

  const [riwayatRaw, jadwalMentah, statsRaw, latihanHariIniRaw] = await Promise.all([
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
      .populate({ path: "pengajarId", select: "kodeCabang" }) 
      .sort({ tanggal: 1 })
      .lean(),
    statsSiswaPromise,
    dapatkanLatihanSiswa(userLogin.username, userLogin.kelas, userLogin.kodeCabang)
  ]);

  let jadwalBersih = jadwalMentah as any[];
  if (userLogin.kodeCabang && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
    jadwalBersih = jadwalBersih.filter((j: any) => 
      j.pengajarId && j.pengajarId.kodeCabang === userLogin.kodeCabang
    );
  }

  const jadwalFinal = jadwalBersih.map(j => ({
    ...j,
    pengajarId: j.pengajarId ? j.pengajarId._id.toString() : null
  }));

  const statistik = statsRaw.length > 0 ? statsRaw[0] : { totalMenit: 0, totalSesi: 0 };

  return (
    <StudentApp 
      siswa={serialize(userLogin)} 
      riwayat={serialize(riwayatRaw)} 
      jadwal={serialize(jadwalFinal)} 
      statistik={serialize(statistik)}
      latihanHariIni={serialize(latihanHariIniRaw)} 
    />
  );
}