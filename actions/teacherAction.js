"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import Jadwal from "../models/Jadwal";
import StudySession from "../models/StudySession"; 
import Quiz from "../models/Quiz"; 
import HasilKuis from "../models/HasilKuis";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { timeHelper } from "../utils/timeHelper";  
import { 
  PERAN, STATUS_USER, KONFIGURASI_MEDIA, PESAN_SISTEM,
  TIPE_SESI, LABEL_SISTEM, PANGKAT_PENGAJAR
} from "../utils/constants";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================
async function pastikanOtoritas(roleWajib = [PERAN.PENGAJAR.id, PERAN.ADMIN.id]) {
  const sesi = await authHelper.ambilSesi();
  if (!sesi || !sesi.userId) return null;

  if (roleWajib.includes(PERAN.ADMIN.id) && sesi.peran === PERAN.PENGAJAR.id && sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK) {
    return { userId: sesi.userId, peran: sesi.peran }; 
  }

  if (!roleWajib.includes(sesi.peran)) return null;
  return { userId: sesi.userId, peran: sesi.peran };
}

function isValidCloudinary(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes(KONFIGURASI_MEDIA.DOMAIN_RESMI); 
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 2. TEACHER ACTIONS
// ============================================================================
export async function ambilDetailJurnalPengajar(idJadwal) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) return responseHelper.error("ID Jadwal tidak valid.");
    await connectToDatabase();
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const jadwal = await Jadwal.findById(idJadwal).populate("pengajarId", "kodeCabang").lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    if (auth.peran !== PERAN.ADMIN.id && jadwal.pengajarId?._id?.toString() !== auth.userId) {
       return responseHelper.error("Akses Ditolak: Ini bukan kelas Anda.");
    }

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    
    let querySiswa = { peran: PERAN.SISWA.id, kelas: jadwal.kelasTarget, status: STATUS_USER.AKTIF };
    if (jadwal.pengajarId && jadwal.pengajarId.kodeCabang) {
      querySiswa.kodeCabang = jadwal.pengajarId.kodeCabang;
    }

    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find(querySiswa).select("nama nomorPeserta").sort({ nama: 1 }).lean(),
      StudySession.find({ jenisSesi: TIPE_SESI.KELAS, namaMapel: jadwal.mapel, waktuMulai: { $gte: awal, $lte: akhir } })
        .select("siswaId status nilaiTest").lean() 
    ]);

    const dataSiswaJurnal = siswaKelas.map(siswa => {
      const sesi = sesiHariIni.find(s => s.siswaId.toString() === siswa._id.toString());
      let baseStatus = LABEL_SISTEM.BELUM_ABSEN;
      let ekstrakCatatan = "";

      if (sesi && sesi.status) {
        if (sesi.status.includes("(")) {
          const splitIdx = sesi.status.indexOf("(");
          baseStatus = sesi.status.substring(0, splitIdx).trim();
          ekstrakCatatan = sesi.status.substring(splitIdx + 1).replace(")", "").trim();
        } else {
          baseStatus = sesi.status;
        }
      }

      return {
        siswaId: siswa._id.toString(), nama: siswa.nama, nomorPeserta: siswa.nomorPeserta,
        sesiId: sesi ? sesi._id.toString() : null, statusAbsen: baseStatus, catatan: ekstrakCatatan,
        nilaiTest: sesi ? sesi.nilaiTest ?? "" : ""
      };
    });

    return responseHelper.success("Detail jurnal dimuat.", { jadwal: serialize(jadwal), dataSiswa: dataSiswaJurnal });
  } catch (error) {
    return responseHelper.error("Gagal mengambil detail jurnal kelas.");
  }
}

export async function simpanJurnalPengajar(idJadwal, dataJurnal, arrayNilaiSiswa = []) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) return responseHelper.error("ID Jadwal tidak valid.");
    await connectToDatabase();
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const babClean = validationHelper.sanitize(dataJurnal.bab);
    if (!babClean) return responseHelper.error("Materi (Bab) wajib diisi!");

    const rawLinks = Array.isArray(dataJurnal.galeriPapan) ? dataJurnal.galeriPapan : (dataJurnal.galeriPapan || "").split(",").filter(Boolean);
    const galeriBersih = [...new Set(rawLinks.map(link => validationHelper.sanitize(link)).filter(link => isValidCloudinary(link)))];

    const query = { _id: idJadwal };
    if (auth.peran !== PERAN.ADMIN.id) query.pengajarId = auth.userId; 

    const updateJadwal = await Jadwal.findOneAndUpdate(
      query,
      { $set: { 
          bab: babClean, 
          subBab: validationHelper.sanitize(dataJurnal.subBab), 
          galeriPapan: galeriBersih, 
          fotoBersama: isValidCloudinary(dataJurnal.fotoBersama) ? dataJurnal.fotoBersama : "", 
          jurnalTerakhirUpdate: new Date() 
      } },
      { new: true }
    ).lean();

    if (!updateJadwal) return responseHelper.error("Jadwal tidak ditemukan atau akses ditolak.");

    if (arrayNilaiSiswa.length > 0) {
      const { awal, akhir } = timeHelper.getRentangHari(updateJadwal.tanggal);
      const ops = arrayNilaiSiswa.filter(item => item.statusAbsen !== LABEL_SISTEM.BELUM_ABSEN).map(item => {
          const catatanClean = validationHelper.sanitize(item.catatan);
          const statusFinal = catatanClean ? `${item.statusAbsen} (${catatanClean})`.toLowerCase() : item.statusAbsen.toLowerCase();
          
          return {
            updateOne: {
              filter: { siswaId: item.siswaId, jenisSesi: TIPE_SESI.KELAS, namaMapel: updateJadwal.mapel, waktuMulai: { $gte: awal, $lte: akhir } },
              update: { 
                $set: { 
                  status: statusFinal, 
                  nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest) 
                }, 
                $setOnInsert: { 
                  namaSiswa: item.nama,
                  waktuMulai: awal, 
                  waktuSelesai: awal, 
                  terlambatMenit: 0 
                } 
              },
              upsert: true 
            }
          };
      });
      if (ops.length > 0) await StudySession.bulkWrite(ops);
    }

    revalidatePath(PERAN.PENGAJAR.home); 
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("✅ Jurnal Kelas & Absensi Siswa Berhasil Disimpan.");
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function getStatusKuisLive(idJadwal) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) return responseHelper.error("ID Jadwal tidak valid.");
    await connectToDatabase();
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const jadwal = await Jadwal.findById(idJadwal).select("mapel tanggal kelasTarget pengajarId").populate("pengajarId", "kodeCabang").lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    const riwayatKuis = await HasilKuis.find({ jadwalId: idJadwal }).select("siswaId skorAkhir").lean();
    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    
    let querySiswa = { peran: PERAN.SISWA.id, kelas: jadwal.kelasTarget, status: STATUS_USER.AKTIF };
    if (jadwal.pengajarId && jadwal.pengajarId.kodeCabang) {
      querySiswa.kodeCabang = jadwal.pengajarId.kodeCabang;
    }

    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find(querySiswa).select("_id nama").sort({ nama: 1 }).lean(),
      StudySession.find({ jenisSesi: TIPE_SESI.KELAS, namaMapel: jadwal.mapel, waktuMulai: { $gte: awal, $lte: akhir } })
        .select("siswaId").lean()
    ]);

    const dataLive = siswaKelas.map(siswa => {
      const idSiswaStr = siswa._id.toString();
      const hasil = riwayatKuis.find(h => h.siswaId.toString() === idSiswaStr);
      if (hasil) return { id: idSiswaStr, nama: siswa.nama, status: "SELESAI", skor: hasil.skorAkhir, pelanggaran: 0 };
      
      const sudahAbsen = sesiHariIni.some(s => s.siswaId.toString() === idSiswaStr);
      if (sudahAbsen) return { id: idSiswaStr, nama: siswa.nama, status: "MENGERJAKAN", skor: null, pelanggaran: 0 };

      return { id: idSiswaStr, nama: siswa.nama, status: "BELUM_MULAI", skor: null, pelanggaran: 0 };
    });

    return responseHelper.success("Data Radar CBT termuat.", serialize(dataLive));
  } catch (error) {
    return responseHelper.error("Gagal menyadap status CBT.");
  }
}

export async function getRiwayatKonsulPengajar() {
  try {
    await connectToDatabase();
    const { userId, peran } = await authHelper.ambilSesi();

    if (!userId || (peran !== PERAN.PENGAJAR.id && peran !== PERAN.ADMIN.id)) {
      return responseHelper.error("Akses ditolak.");
    }

    const riwayat = await StudySession.find({
      jenisSesi: TIPE_SESI.KONSUL,
      pengajarPendamping: userId 
    })
    .populate("siswaId", "nama kelas")
    .sort({ waktuMulai: -1 })
    .lean();

    const dataAman = riwayat.map(k => ({
      _id: k._id.toString(),
      jenisSesi: k.jenisSesi,
      namaMapel: k.namaMapel,
      waktuMulai: k.waktuMulai?.toISOString() || null,
      waktuSelesai: k.waktuSelesai?.toISOString() || null,
      status: k.status,
      siswaId: k.siswaId ? {
        _id: k.siswaId._id.toString(),
        nama: k.siswaId.nama,
        kelas: k.siswaId.kelas
      } : null
    }));

    return responseHelper.success("Data berhasil ditarik", dataAman);
  } catch (error) {
    console.error("[ERROR getRiwayatKonsulPengajar]:", error);
    return responseHelper.error("Gagal memuat riwayat konsul.");
  }
}

// ============================================================================
// 3. GOD MODE - RESET & FORCE SUBMIT UJIAN
// ============================================================================
export async function resetUjianSiswa(idJadwal, idSiswa) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) return responseHelper.error("ID tidak valid.");
    await connectToDatabase();
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const hasil = await HasilKuis.deleteOne({ jadwalId: idJadwal, siswaId: idSiswa });
    if (hasil.deletedCount === 0) return responseHelper.error("Siswa ini belum mengumpulkan ujian.");

    await StudySession.updateOne({ jadwalId: idJadwal, siswaId: idSiswa }, { $set: { nilaiTest: null } });
    return responseHelper.success("Riwayat ujian berhasil dihapus. Siswa dapat mengulang dari awal.");
  } catch (error) {
    console.error("[ERROR resetUjianSiswa]:", error);
    return responseHelper.error("Gagal mereset ujian siswa.");
  }
}

export async function forceSubmitUjianSiswa(idJadwal, idSiswa, namaSiswa) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) return responseHelper.error("ID tidak valid.");
    await connectToDatabase();
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sudahPernah = await HasilKuis.exists({ jadwalId: idJadwal, siswaId: idSiswa });
    if (sudahPernah) return responseHelper.error("Siswa sudah mengumpulkan ujian.");

    const kuis = await Quiz.findOne({ jadwalId: idJadwal }).select("_id soal").lean();
    if (!kuis) return responseHelper.error("Kuis tidak ditemukan.");

    const emptyDetail = (kuis.soal || []).map(s => {
      const kunciArr = Array.isArray(s.kunciJawaban) ? s.kunciJawaban.map(String) : [String(s.kunciJawaban || "")];
      return { kunciJawaban: kunciArr, jawabanSiswa: [""], isBenar: false };
    });

    await Promise.all([
      HasilKuis.create({
        jadwalId: idJadwal,
        quizId: kuis._id,
        siswaId: idSiswa,
        namaSiswa: validationHelper.sanitize(namaSiswa),
        skorAkhir: 0,
        detailJawaban: emptyDetail
      }),
      StudySession.updateOne(
        { jadwalId: idJadwal, siswaId: idSiswa },
        { $set: { nilaiTest: 0 } }
      )
    ]);

    return responseHelper.success("Ujian ditutup paksa. Siswa diberi nilai 0.");
  } catch (error) {
    console.error("[ERROR forceSubmitUjianSiswa]:", error);
    return responseHelper.error("Gagal menutup paksa ujian.");
  }
}