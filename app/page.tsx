import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar";
import { redirect } from "next/navigation";

import StudentApp from "../components/StudentApp";
import TeacherApp from "../components/TeacherApp";
import { dapatkanLatihanSiswa } from "../actions/soalAction";
import { timeHelper } from "../utils/timeHelper";
import { authHelper } from "../utils/authHelper";
import { serialize } from "../utils/responseHelper";
import {
  PERAN,
  STATUS_SESI,
  KONFIGURASI_SISTEM,
  LABEL_SISTEM,
  CABANG_QUANTUM,
  PERIODE_BELAJAR,
} from "../utils/constants";

export const dynamic   = "force-dynamic";
export const revalidate = 0;

// ============================================================================
// KONSTANTA PERIODE
// ============================================================================
const PERIODE_MULAI = new Date(
  `${PERIODE_BELAJAR.MULAI}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`
);
const PERIODE_AKHIR = new Date(
  `${PERIODE_BELAJAR.AKHIR}T23:59:59${PERIODE_BELAJAR.ISO_OFFSET}`
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface UserLogin {
  _id:            string;
  nama:           string;
  username:       string;
  nomorPeserta:   string;
  kelas:          string | null;
  kodePengajar:   string | null;
  kodeCabang:     string;
  peran:          string;
  pangkat:        string | null;
  totalExp:       number;
  koleksiLencana: unknown[];
  status:         string;
}

// ============================================================================
// 1. DATA SERVICES (Separation of Concerns)
// ============================================================================
async function ambilDataDashboardPengajar(userLogin: UserLogin) {
  const sekarang  = new Date();
  const batasStaf = timeHelper.getRentangBulanStaf(sekarang);

  const [jadwalPengajar, riwayatAbsensi, statsKonsulRaw] = await Promise.all([
    Jadwal.find({
      kodePengajar: userLogin.kodePengajar,
      tanggal: { $gte: batasStaf.awal, $lte: batasStaf.akhir },
    })
      .sort({ tanggal: 1 })
      .lean(),

    AbsensiPengajar.find({
      pengajarId: userLogin._id,
      waktuMasuk: { $gte: batasStaf.awal, $lte: batasStaf.akhir },
    })
      .sort({ waktuMasuk: -1 })
      .lean(),

    StudySession.aggregate([
      {
        $match: {
          pengajarPendamping: userLogin._id,
          status:     STATUS_SESI.SELESAI.id,
          waktuMulai: { $gte: batasStaf.awal, $lte: batasStaf.akhir },
        },
      },
      {
        $group: {
          _id: null,
          totalMenit: {
            $sum: {
              $add: [
                {
                  $max: [
                    0,
                    { $divide: [{ $subtract: ["$waktuSelesai", "$waktuMulai"] }, 60_000] },
                  ],
                },
                { $ifNull: ["$konsulExtraMenit", 0] },
              ],
            },
          },
          totalSesi: { $count: {} },
        },
      },
    ]).exec(),
  ]);

  const statsKonsul =
    statsKonsulRaw.length > 0
      ? statsKonsulRaw[0]
      : { totalMenit: 0, totalSesi: 0 };

  return {
    jadwal:      serialize(jadwalPengajar),
    absensi:     serialize(riwayatAbsensi),
    statsKonsul: serialize(statsKonsul),
  };
}

async function ambilDataDashboardSiswa(userLogin: UserLogin) {
  const sekarang    = new Date();
  const batasSiswa  = timeHelper.getRentangBulanSiswa(sekarang);

  const [riwayatRaw, jadwalMentah, statsRaw, latihanHariIniRaw] =
    await Promise.all([
      StudySession.find({
        siswaId:    userLogin._id,
        waktuMulai: { $gte: PERIODE_MULAI, $lte: PERIODE_AKHIR },
      })
        .populate("pengajarPendamping", "nama kodePengajar")
        .sort({ waktuMulai: -1 })
        .lean(),

      Jadwal.find({
        kelasTarget: userLogin.kelas,
        tanggal: { $gte: PERIODE_MULAI, $lte: PERIODE_AKHIR },
      })
        .populate({ path: "pengajarId", select: "kodeCabang" })
        .sort({ tanggal: 1 })
        .lean(),

      StudySession.aggregate([
        {
          $match: {
            siswaId:    userLogin._id,
            status:     STATUS_SESI.SELESAI.id,
            waktuMulai: { $gte: batasSiswa.awal, $lte: batasSiswa.akhir },
          },
        },
        {
          $group: {
            _id: null,
            totalMenit: {
              $sum: {
                $add: [
                  {
                    $max: [
                      0,
                      {
                        $divide: [
                          { $subtract: ["$waktuSelesai", "$waktuMulai"] },
                          60_000,
                        ],
                      },
                    ],
                  },
                  { $ifNull: ["$konsulExtraMenit", 0] },
                ],
              },
            },
            totalSesi: { $count: {} },
          },
        },
      ]).exec(),

      dapatkanLatihanSiswa(
        userLogin.username,
        userLogin.kelas ?? "",
        userLogin.kodeCabang
      ),
    ]);

  let jadwalBersih = jadwalMentah as Array<typeof jadwalMentah[0] & { pengajarId?: { _id: unknown; kodeCabang: string } | null }>;

  if (userLogin.kodeCabang && userLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
    jadwalBersih = jadwalBersih.filter(
      (j) => j.pengajarId?.kodeCabang === userLogin.kodeCabang
    );
  }

  const jadwalFinal = jadwalBersih.map((j) => ({
    ...j,
    pengajarId: j.pengajarId ? (j.pengajarId as { _id: unknown }).toString() : null,
  }));

  const statistik =
    statsRaw.length > 0 ? statsRaw[0] : { totalMenit: 0, totalSesi: 0 };

  return {
    riwayat:        serialize(riwayatRaw),
    jadwal:         serialize(jadwalFinal),
    statistik:      serialize(statistik),
    latihanHariIni: serialize(latihanHariIniRaw),
  };
}

// ============================================================================
// 2. MAIN ORCHESTRATOR (Server Component)
// ============================================================================
export default async function Home() {
  await connectToDatabase();

  const sesi = await authHelper.ambilSesi();
  if (!sesi?.userId) {
    redirect(KONFIGURASI_SISTEM.PATH_LOGIN);
  }

  const userLogin = await User.findById(sesi.userId)
    .select("-password")
    .lean() as UserLogin | null;

  if (!userLogin) {
    redirect(`${KONFIGURASI_SISTEM.PATH_LOGIN}?${LABEL_SISTEM.REDIRECT_CLEAR}`);
  }

  if (userLogin.peran === PERAN.ADMIN.id) {
    redirect(PERAN.ADMIN.home);
  }

  if (userLogin.peran === PERAN.PENGAJAR.id) {
    const dataPengajar = await ambilDataDashboardPengajar(userLogin);
    return (
      <TeacherApp
        dataUser={serialize(userLogin)}
        {...dataPengajar}
      />
    );
  }

  const dataSiswa = await ambilDataDashboardSiswa(userLogin);
  return (
    <StudentApp
      siswa={serialize(userLogin)}
      {...dataSiswa}
    />
  );
}