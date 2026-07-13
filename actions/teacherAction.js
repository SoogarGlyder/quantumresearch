"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import Jadwal from "../models/Jadwal";
import StudySession from "../models/StudySession";
import Quiz from "../models/Quiz";
import HasilKuis from "../models/HasilKuis";
import { authHelper } from "../utils/authHelper";
import { responseHelper, serialize } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { timeHelper } from "../utils/timeHelper";
import { guardPengajar } from "../utils/guardHelper";
import {
  PERAN, STATUS_USER, KONFIGURASI_MEDIA, PESAN_SISTEM,
  TIPE_SESI, LABEL_SISTEM, PANGKAT_PENGAJAR, KONFIGURASI_SISTEM, CABANG_QUANTUM
} from "../utils/constants";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

/**
 * @param {string} url
 * @returns {boolean}
 */
function isValidCloudinary(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes(KONFIGURASI_MEDIA.DOMAIN_RESMI);
}

async function pastikanOtoritas(roleWajib = [PERAN.PENGAJAR.id, PERAN.ADMIN.id]) {
  const sesi = await authHelper.ambilSesi();
  if (!sesi || !sesi.userId) return null;

  if (roleWajib.includes(PERAN.ADMIN.id) && sesi.peran === PERAN.PENGAJAR.id && sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK) {
    return { userId: sesi.userId, peran: sesi.peran }; 
  }

  if (!roleWajib.includes(sesi.peran)) return null;
  return { userId: sesi.userId, peran: sesi.peran };
}

// ============================================================================
// 2. JURNAL PENGAJAR
// ============================================================================
export async function ambilDetailJurnalPengajar(idJadwal) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) {
      return responseHelper.error("ID Jadwal tidak valid.", null, "INVALID_ID");
    }

    await connectToDatabase();
    const auth = await guardPengajar();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const jadwal = await Jadwal.findById(idJadwal)
      .populate("pengajarId", "kodeCabang")
      .lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    if (
      auth.peran !== PERAN.ADMIN.id &&
      jadwal.pengajarId?._id?.toString() !== auth.userId
    ) {
      return responseHelper.error("Akses Ditolak: Ini bukan kelas Anda.");
    }

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);

    let querySiswa = {
      peran:       PERAN.SISWA.id,
      kelas:       jadwal.kelasTarget,
      status:      STATUS_USER.AKTIF,
    };
    if (jadwal.pengajarId?.kodeCabang) {
      querySiswa.kodeCabang = jadwal.pengajarId.kodeCabang;
    }

    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find(querySiswa).select("nama nomorPeserta").sort({ nama: 1 }).lean(),
      StudySession.find({
        jenisSesi:  TIPE_SESI.KELAS,
        namaMapel:  jadwal.mapel,
        waktuMulai: { $gte: awal, $lte: akhir },
      })
        .select("siswaId status nilaiTest")
        .lean(),
    ]);

    const dataSiswaJurnal = siswaKelas.map((siswa) => {
      const sesi = sesiHariIni.find(
        (s) => s.siswaId.toString() === siswa._id.toString()
      );

      let baseStatus     = LABEL_SISTEM.BELUM_ABSEN;
      let ekstrakCatatan = "";

      if (sesi?.status) {
        if (sesi.status.includes("(")) {
          const splitIdx = sesi.status.indexOf("(");
          baseStatus     = sesi.status.substring(0, splitIdx).trim();
          ekstrakCatatan = sesi.status.substring(splitIdx + 1).replace(")", "").trim();
        } else {
          baseStatus = sesi.status;
        }
      }

      return {
        siswaId:     siswa._id.toString(),
        nama:        siswa.nama,
        nomorPeserta: siswa.nomorPeserta,
        sesiId:      sesi ? sesi._id.toString() : null,
        statusAbsen: baseStatus,
        catatan:     ekstrakCatatan,
        nilaiTest:   sesi ? (sesi.nilaiTest ?? "") : "",
      };
    });

    return responseHelper.success("Detail jurnal dimuat.", {
      jadwal:     serialize(jadwal),
      dataSiswa:  dataSiswaJurnal,
    });
  } catch (error) {
    console.error("[ERROR ambilDetailJurnalPengajar]:", error);
    return responseHelper.error("Gagal mengambil detail jurnal kelas.");
  }
}

export async function simpanJurnalPengajar(idJadwal, dataJurnal, arrayNilaiSiswa = []) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) {
      return responseHelper.error("ID Jadwal tidak valid.", null, "INVALID_ID");
    }

    await connectToDatabase();
    const auth = await guardPengajar();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const babClean = validationHelper.trimInput(dataJurnal.bab);
    if (!babClean) return responseHelper.error("Materi (Bab) wajib diisi!");

    const rawLinks = Array.isArray(dataJurnal.galeriPapan)
      ? dataJurnal.galeriPapan
      : (dataJurnal.galeriPapan || "").split(",").filter(Boolean);

    const galeriBersih = [
      ...new Set(
        rawLinks
          .map((link) => validationHelper.trimInput(link))
          .filter((link) => isValidCloudinary(link))
      ),
    ];

    const query = { _id: idJadwal };
    if (auth.peran !== PERAN.ADMIN.id) query.pengajarId = auth.userId;

    const updateJadwal = await Jadwal.findOneAndUpdate(
      query,
      {
        $set: {
          bab:         babClean,
          subBab:      validationHelper.trimInput(dataJurnal.subBab),
          galeriPapan: galeriBersih,
          fotoBersama: isValidCloudinary(dataJurnal.fotoBersama)
            ? dataJurnal.fotoBersama
            : null,
        },
      },
      { new: true }
    ).lean();

    if (!updateJadwal) return responseHelper.error("Jadwal tidak ditemukan atau akses ditolak.");

    if (arrayNilaiSiswa.length > 0) {
      const { awal, akhir } = timeHelper.getRentangHari(updateJadwal.tanggal);
      const ops = arrayNilaiSiswa
        .filter((item) => item.statusAbsen !== LABEL_SISTEM.BELUM_ABSEN)
        .map((item) => {
          const catatanClean = validationHelper.trimInput(item.catatan);
          const statusFinal  = catatanClean
            ? `${item.statusAbsen} (${catatanClean})`.toLowerCase()
            : item.statusAbsen.toLowerCase();

          return {
            updateOne: {
              filter: {
                siswaId:    item.siswaId,
                jenisSesi:  TIPE_SESI.KELAS,
                namaMapel:  updateJadwal.mapel,
                waktuMulai: { $gte: awal, $lte: akhir },
              },
              update: {
                $set: {
                  status:    statusFinal,
                  nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest),
                },
                $setOnInsert: {
                  namaSiswa:     item.nama,
                  waktuMulai:    awal,
                  waktuSelesai:  awal,
                  terlambatMenit: 0,
                },
              },
              upsert: true,
            },
          };
        });

      if (ops.length > 0) await StudySession.bulkWrite(ops);
    }

    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Jurnal Kelas & Absensi Siswa Berhasil Disimpan.");
  } catch (error) {
    console.error("[ERROR simpanJurnalPengajar]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

// ============================================================================
// 3. RADAR CBT (Status Kuis Live)
// ============================================================================
export async function getStatusKuisLive(idJadwal) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) {
      return responseHelper.error("ID Jadwal tidak valid.", null, "INVALID_ID");
    }

    await connectToDatabase();
    const auth = await guardPengajar();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const jadwal = await Jadwal.findById(idJadwal)
      .select("mapel tanggal kelasTarget pengajarId")
      .populate("pengajarId", "kodeCabang")
      .lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);

    let querySiswa = {
      peran:  PERAN.SISWA.id,
      kelas:  jadwal.kelasTarget,
      status: STATUS_USER.AKTIF,
    };
    if (jadwal.pengajarId?.kodeCabang) {
      querySiswa.kodeCabang = jadwal.pengajarId.kodeCabang;
    }

    const [siswaKelas, sesiHariIni, riwayatKuis] = await Promise.all([
      User.find(querySiswa).select("_id nama").sort({ nama: 1 }).lean(),
      StudySession.find({
        jenisSesi:  TIPE_SESI.KELAS,
        namaMapel:  jadwal.mapel,
        waktuMulai: { $gte: awal, $lte: akhir },
      })
        .select("siswaId")
        .lean(),
      HasilKuis.find({ jadwalId: idJadwal }).select("siswaId nilai skorAkhir").lean(), // Added skorAkhir check for legacy support
    ]);

    const dataLive = siswaKelas.map((siswa) => {
      const idSiswaStr = siswa._id.toString();
      const hasil      = riwayatKuis.find((h) => h.siswaId.toString() === idSiswaStr);

      if (hasil) {
        return { id: idSiswaStr, nama: siswa.nama, status: "SELESAI",      skor: hasil.nilai || hasil.skorAkhir, pelanggaran: 0 };
      }

      const sudahAbsen = sesiHariIni.some((s) => s.siswaId.toString() === idSiswaStr);
      if (sudahAbsen) {
        return { id: idSiswaStr, nama: siswa.nama, status: "MENGERJAKAN",  skor: null,        pelanggaran: 0 };
      }

      return   { id: idSiswaStr, nama: siswa.nama, status: "BELUM_MULAI", skor: null,        pelanggaran: 0 };
    });

    return responseHelper.success("Data Radar CBT termuat.", serialize(dataLive));
  } catch (error) {
    console.error("[ERROR getStatusKuisLive]:", error);
    return responseHelper.error("Gagal memuat status CBT.");
  }
}

// ============================================================================
// 4. RIWAYAT KONSUL PENGAJAR
// ============================================================================

export async function getRiwayatKonsulPengajar() {
  try {
    await connectToDatabase();

    const sesi = await authHelper.ambilSesi();
    if (!sesi?.userId) return responseHelper.error(PESAN_SISTEM.SESI_HABIS);
    if (sesi.peran !== PERAN.PENGAJAR.id && sesi.peran !== PERAN.ADMIN.id) {
      return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    }

    const riwayat = await StudySession.find({
      jenisSesi:            TIPE_SESI.KONSUL,
      pengajarPendamping:   sesi.userId,
    })
      .populate("siswaId", "nama kelas")
      .sort({ waktuMulai: -1 })
      .lean();

    const dataAman = riwayat.map((k) => ({
      _id:          k._id.toString(),
      jenisSesi:    k.jenisSesi,
      namaMapel:    k.namaMapel,
      waktuMulai:   k.waktuMulai?.toISOString()  || null,
      waktuSelesai: k.waktuSelesai?.toISOString() || null,
      status:       k.status,
      siswaId:      k.siswaId
        ? { _id: k.siswaId._id.toString(), nama: k.siswaId.nama, kelas: k.siswaId.kelas }
        : null,
    }));

    return responseHelper.success("Data berhasil ditarik", dataAman);
  } catch (error) {
    console.error("[ERROR getRiwayatKonsulPengajar]:", error);
    return responseHelper.error("Gagal memuat riwayat konsul.");
  }
}

// ============================================================================
// 5. GOD MODE — RESET & FORCE SUBMIT UJIAN
// ============================================================================
export async function resetUjianSiswa(idJadwal, idSiswa) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) {
      return responseHelper.error("ID tidak valid.", null, "INVALID_ID");
    }

    await connectToDatabase();
    const auth = await guardPengajar();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const hasil = await HasilKuis.deleteOne({ jadwalId: idJadwal, siswaId: idSiswa });
    if (hasil.deletedCount === 0) {
      return responseHelper.error("Siswa ini belum mengumpulkan ujian.");
    }

    await StudySession.updateOne(
      { jadwalId: idJadwal, siswaId: idSiswa },
      { $set: { nilaiTest: null } }
    );

    return responseHelper.success("Riwayat ujian berhasil dihapus. Siswa dapat mengulang dari awal.");
  } catch (error) {
    console.error("[ERROR resetUjianSiswa]:", error);
    return responseHelper.error("Gagal mereset ujian siswa.");
  }
}

export async function forceSubmitUjianSiswa(idJadwal, idSiswa, namaSiswa) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) {
      return responseHelper.error("ID tidak valid.", null, "INVALID_ID");
    }

    await connectToDatabase();
    const auth = await guardPengajar();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sudahPernah = await HasilKuis.exists({ jadwalId: idJadwal, siswaId: idSiswa });
    if (sudahPernah) return responseHelper.error("Siswa sudah mengumpulkan ujian.");

    const kuis = await Quiz.findOne({ jadwalId: idJadwal }).select("_id soal").lean();
    if (!kuis) return responseHelper.error("Kuis tidak ditemukan.");

    // Buat jawaban kosong untuk setiap soal
    const emptyJawaban = (kuis.soal || []).map((_, idx) => ({
      nomorSoal:    idx + 1,
      jawabanSiswa: [""],
      isBenar:      false,
    }));

    await Promise.all([
      HasilKuis.create({
        jadwalId:       idJadwal,
        quizId:         kuis._id,
        siswaId:        idSiswa,
        namaSiswa:      validationHelper.trimInput(namaSiswa),
        nilai:          0,
        totalBenar:     0,
        totalSalah:     emptyJawaban.length,
        totalExpDidapat: 0,
        waktuSelesai:   new Date(),
        jawaban:        emptyJawaban,
      }),
      StudySession.updateOne(
        { jadwalId: idJadwal, siswaId: idSiswa },
        { $set: { nilaiTest: 0 } }
      ),
    ]);

    return responseHelper.success("Ujian ditutup paksa. Siswa diberi nilai 0.");
  } catch (error) {
    console.error("[ERROR forceSubmitUjianSiswa]:", error);
    return responseHelper.error("Gagal menutup paksa ujian.");
  }
}

// ============================================================================
// 6. ADMIN ACTIONS (MANAGEMENT PENGAJAR)
// ============================================================================
export async function ambilSemuaPengajar() {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const pengajar = await User.find({ peran: PERAN.PENGAJAR.id })
      .select("_id nama kodePengajar username noHp").sort({ nama: 1 }).lean();
      
    const dataBersih = pengajar.map(p => ({ ...p, _id: p._id.toString(), kodePengajar: p.kodePengajar || "-" }));
    return responseHelper.success("Data pengajar dimuat.", serialize(dataBersih));
  } catch (error) {
    return responseHelper.error("Gagal memuat data pengajar.");
  }
}

export async function tambahPengajarBaru(formData) {
  try {
    await connectToDatabase();
    const sesiAdmin = await authHelper.ambilSesi(); 
    if (!sesiAdmin || sesiAdmin.peran !== PERAN.ADMIN.id) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const username = validationHelper.sanitize ? validationHelper.sanitize(formData.username).toLowerCase() : validationHelper.trimInput(formData.username).toLowerCase();
    const kodePengajar = validationHelper.sanitize ? validationHelper.sanitize(formData.kodePengajar).toUpperCase() : validationHelper.trimInput(formData.kodePengajar).toUpperCase();

    const exist = await User.exists({ $or: [{ username }, { kodePengajar }] });
    if (exist) return responseHelper.error("Username/Kode sudah terdaftar.");

    const hashed = await authHelper.buatHash(formData.password || KONFIGURASI_SISTEM.DEFAULT_PASSWORD);

    let payloadBaru = {
      ...formData, username, kodePengajar, password: hashed, peran: PERAN.PENGAJAR.id, status: STATUS_USER.AKTIF
    };

    if (sesiAdmin.kodeCabang && sesiAdmin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      payloadBaru.kodeCabang = sesiAdmin.kodeCabang;
    }

    await User.create(payloadBaru);

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(PESAN_SISTEM.SUKSES_SIMPAN);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function hapusPengajar(idPengajar) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    await User.deleteOne({ _id: idPengajar }); 
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Pengajar dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal hapus pengajar.");
  }
}

export async function editPengajar(idPengajar, dataBaru) {
  try {
    await connectToDatabase();
    const auth = await pastikanOtoritas([PERAN.ADMIN.id]);
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const dataUpdate = { ...dataBaru };
    delete dataUpdate.isKakakAsuh; 
    
    if (dataUpdate.pangkat) {
      const statusWaliKelas = dataUpdate.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH;
      dataUpdate.isKakakAsuh = statusWaliKelas;
      if (!statusWaliKelas) dataUpdate.kelasAsuh = [];
    }

    if (dataBaru.password?.trim()) {
      dataUpdate.password = await authHelper.buatHash(dataBaru.password);
    } else {
      delete dataUpdate.password;
    }

    if (dataUpdate.username) dataUpdate.username = validationHelper.sanitize ? validationHelper.sanitize(dataUpdate.username).toLowerCase() : validationHelper.trimInput(dataUpdate.username).toLowerCase();
    if (dataUpdate.kodePengajar) dataUpdate.kodePengajar = validationHelper.sanitize ? validationHelper.sanitize(dataUpdate.kodePengajar).toUpperCase() : validationHelper.trimInput(dataUpdate.kodePengajar).toUpperCase();

    const hasil = await User.updateOne({ _id: idPengajar }, { $set: dataUpdate });
    if (hasil.matchedCount === 0) return responseHelper.error("Data pengajar tidak ditemukan.");

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("✅ Data pengajar berhasil diperbarui.");
  } catch (error) {
    console.error("[CRITICAL ERROR editPengajar]:", error);
    return responseHelper.error("Gagal mengupdate data pengajar. Silakan cek koneksi database.");
  }
}

export async function prosesBulkTambahPengajar(dataArray) {
  try {
    await connectToDatabase();
    const sesiAdmin = await authHelper.ambilSesi(); 
    if (!sesiAdmin || sesiAdmin.peran !== PERAN.ADMIN.id) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    let suksesCount = 0;
    let laporan = [];

    const uNames = dataArray.map(i => (i.username || i.kodePengajar)?.toLowerCase()).filter(Boolean);
    const kodes = dataArray.map(i => i.kodePengajar?.toUpperCase()).filter(Boolean);
    
    const existing = await User.find({ 
      $or: [{ username: { $in: uNames } }, { kodePengajar: { $in: kodes } }] 
    }).select("username kodePengajar").lean();
    
    const setU = new Set(existing.map(e => e.username));
    const setK = new Set(existing.map(e => e.kodePengajar));

    for (let [index, item] of dataArray.entries()) {
      try {
        if (!item.nama || !item.kodePengajar) {
          laporan.push(`Baris ${index + 1}: Nama & Kode Pengajar wajib diisi.`);
          continue;
        }

        const usernameTarget = item.username || item.kodePengajar;
        const username = validationHelper.sanitize ? validationHelper.sanitize(usernameTarget).toLowerCase() : validationHelper.trimInput(usernameTarget).toLowerCase();
        const kodePengajar = validationHelper.sanitize ? validationHelper.sanitize(item.kodePengajar).toUpperCase() : validationHelper.trimInput(item.kodePengajar).toUpperCase();

        if (setU.has(username) || setK.has(kodePengajar)) {
          laporan.push(`Baris ${index + 1} (${item.nama}): Username '${username}' atau Kode '${kodePengajar}' sudah dipakai.`);
          continue;
        }

        const pwd = item.password || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;
        const hashed = await authHelper.buatHash(pwd);

        let payloadBaru = {
          nama: item.nama, nomorPeserta: item.nomorPeserta || "", username, kodePengajar,
          noHp: item.noHp || "", password: hashed, peran: PERAN.PENGAJAR.id, status: STATUS_USER.AKTIF
        };

        if (sesiAdmin.kodeCabang && sesiAdmin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
          payloadBaru.kodeCabang = sesiAdmin.kodeCabang;
        }

        await User.create(payloadBaru);
        suksesCount++;
      } catch (err) {
        laporan.push(`Baris ${index + 1} (${item.nama}): Gagal menyimpan (${err.message}).`);
      }
    }

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`Selesai: ${suksesCount} berhasil terdaftar, ${laporan.length} gagal.`, { laporan });
  } catch (error) {
    return responseHelper.error("Gagal melakukan upload massal.", error);
  }
}
