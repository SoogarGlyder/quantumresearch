"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar"; 
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { validationHelper } from "../utils/validationHelper";
import { 
  PERAN, 
  TIPE_SESI, 
  LIMIT_DATA, 
  STATUS_USER, 
  LABEL_SISTEM,
  PESAN_SISTEM,
  STATUS_SESI
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 0. INTERNAL HELPERS
// ============================================================================
async function pastikanAdmin() {
  const { userId, peran } = await authHelper.ambilSesi();
  return userId && peran === PERAN.ADMIN.id;
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 1. DASHBOARD & DATA FETCHING
// ============================================================================
export async function ambilDataDashboard() {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const [riwayat, siswa] = await Promise.all([
      StudySession.find()
        .populate("siswaId", "nama username nomorPeserta kelas status")
        .sort({ waktuMulai: -1 })
        .limit(LIMIT_DATA.DASHBOARD_HISTORY)
        .lean(),
      User.find({ peran: PERAN.SISWA.id })
        .sort({ nama: 1 })
        .lean()
    ]);

    return responseHelper.success("Data dashboard dimuat.", {
      riwayat: serialize(riwayat),
      siswa: serialize(siswa)
    });
  } catch (error) {
    return responseHelper.error("Gagal mengambil data dashboard.", error);
  }
}

// ============================================================================
// 2. MANAJEMEN STAF (ABSENSI)
// ============================================================================
export async function ambilAbsensiPengajar() {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const data = await AbsensiPengajar.find()
      .populate("pengajarId", "nama kodePengajar") 
      .sort({ waktuMasuk: -1 })
      .limit(100)
      .lean();

    return responseHelper.success("Data absen staf dimuat.", serialize(data));
  } catch (error) {
    return responseHelper.error("Gagal mengambil absen staf.", error.message);
  }
}

// ============================================================================
// 3. MANAJEMEN JADWAL
// ============================================================================
export async function ambilSemuaJadwal() {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const jadwal = await Jadwal.find({}).sort({ tanggal: 1 }).lean();
    return responseHelper.success("Data jadwal dimuat.", serialize(jadwal));
  } catch (error) {
    return responseHelper.error("Gagal mengambil jadwal.", error);
  }
}

export async function tambahJadwal(dataForm) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const kodeCari = dataForm.pengajar?.trim();
    const pengajarObj = await User.findOne({ 
      peran: PERAN.PENGAJAR.id, 
      kodePengajar: { $regex: new RegExp(`^${kodeCari}$`, "i") } 
    });

    if (!pengajarObj) return responseHelper.error(`Kode "${kodeCari}" tidak ditemukan!`);

    await Jadwal.create({
      tanggal: dataForm.tanggal,
      mapel: dataForm.mapel,
      kelasTarget: dataForm.kelasTarget,
      jamMulai: dataForm.jamMulai,
      jamSelesai: dataForm.jamSelesai,
      pertemuan: Number(dataForm.pertemuan),
      pengajarId: pengajarObj._id,
      pengajar: pengajarObj.nama, 
      namaPengajar: pengajarObj.nama,
      kodePengajar: pengajarObj.kodePengajar
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(PESAN_SISTEM.SUKSES_SIMPAN);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN, error.message);
  }
}

export async function editJadwal(id, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    let payloadUpdate = { ...dataBaru };
    if (dataBaru.pengajar) {
      const pengajarObj = await User.findOne({ 
        peran: PERAN.PENGAJAR.id,
        $or: [{ kodePengajar: dataBaru.pengajar }, { nama: dataBaru.pengajar }]
      });
      if (pengajarObj) {
        payloadUpdate.pengajarId = pengajarObj._id;
        payloadUpdate.pengajar = pengajarObj.nama;
        payloadUpdate.namaPengajar = pengajarObj.nama;
        payloadUpdate.kodePengajar = pengajarObj.kodePengajar;
      }
    }

    await Jadwal.findByIdAndUpdate(id, payloadUpdate, { new: true });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Jadwal diperbarui.");
  } catch (error) {
    return responseHelper.error("Gagal edit jadwal.", error.message);
  }
}

export async function hapusJadwal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    await Jadwal.findByIdAndDelete(idJadwal);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Jadwal dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal menghapus jadwal.", error);
  }
}

// ============================================================================
// 4. MANAJEMEN AKUN USER
// ============================================================================
export async function editAkunSiswa(idSiswa, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const dataUpdate = { ...dataBaru };
    if (dataBaru.password?.trim()) {
      dataUpdate.password = await authHelper.buatHash(dataBaru.password);
    } else {
      delete dataUpdate.password;
    }

    if (dataUpdate.username) {
      dataUpdate.username = validationHelper.sanitize(dataUpdate.username).toLowerCase();
    }

    await User.findByIdAndUpdate(idSiswa, dataUpdate);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Data berhasil diperbarui.");
  } catch (error) {
    return responseHelper.error("Gagal update user.", error);
  }
}

export async function hapusAkunSiswa(idSiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    await Promise.all([
      User.findByIdAndDelete(idSiswa),
      StudySession.deleteMany({ siswaId: idSiswa })
    ]);

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Akun & riwayat dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal hapus user.", error);
  }
}

// ============================================================================
// 5. ABSENSI & JURNAL
// ============================================================================

export async function inputAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const { awal } = timeHelper.getRentangHari(data.tanggal);
    const statusFinal = data.catatan 
      ? `${data.keterangan} (${data.catatan})`.toLowerCase() 
      : data.keterangan.toLowerCase();

    await StudySession.findOneAndUpdate(
      {
        siswaId: data.siswaId,
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: data.mapel,
        waktuMulai: { $gte: awal }
      },
      {
        $set: { status: statusFinal, waktuSelesai: awal },
        $setOnInsert: {
          siswaId: data.siswaId,
          jenisSesi: TIPE_SESI.KELAS,
          namaMapel: data.mapel,
          waktuMulai: awal,
          terlambatMenit: 0
        }
      },
      { upsert: true }
    );

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Absen manual berhasil.");
  } catch (error) {
    return responseHelper.error("Gagal absen manual.", error);
  }
}

// 🚀 FIX: Mengambil Waktu & Kedisiplinan untuk Detail Jurnal
export async function ambilDetailJurnal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const jadwal = await Jadwal.findById(idJadwal).lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    
    // Ambil siswa aktif di kelas tersebut DAN sesi hari itu
    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find({ 
        peran: PERAN.SISWA.id, 
        kelas: jadwal.kelasTarget, 
        status: STATUS_USER.AKTIF 
      })
        .select("nama nomorPeserta")
        .sort({ nama: 1 })
        .lean(),
      StudySession.find({
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        waktuMulai: { $gte: awal, $lte: akhir }
      }).lean()
    ]);

    const dataSiswaJurnal = siswaKelas.map(siswa => {
      // Cari apakah siswa ini punya sesi untuk mapel & hari ini
      const sesi = sesiHariIni.find(s => s.siswaId.toString() === siswa._id.toString());
      
      return {
        siswaId: siswa._id.toString(),
        nama: siswa.nama,
        nomorPeserta: siswa.nomorPeserta,
        sesiId: sesi ? sesi._id.toString() : null,
        statusAbsen: sesi ? sesi.status : LABEL_SISTEM.BELUM_ABSEN,
        // 🚀 TAMBAHAN: Ambil data waktu dan kedisiplinan agar tidak kosong di UI
        waktuMulai: sesi ? sesi.waktuMulai : null,
        waktuSelesai: sesi ? sesi.waktuSelesai : null,
        terlambatMenit: sesi ? sesi.terlambatMenit || 0 : 0,
        konsulExtraMenit: sesi ? sesi.konsulExtraMenit || 0 : 0,
        // (Nilai test tetap diambil kalau-kalau dibutuhkan, meski tidak ditampilkan di jurnal ini)
        nilaiTest: sesi ? sesi.nilaiTest ?? "" : "" 
      };
    });

    return responseHelper.success("Detail jurnal dimuat.", {
      jadwal: serialize(jadwal),
      dataSiswa: dataSiswaJurnal
    });
  } catch (error) {
    return responseHelper.error("Gagal detail jurnal.", error);
  }
}

// 🚀 FIX: Menyimpan Extra Konsul (bukan nilaiTest lagi) jika Admin mengubahnya di Jurnal
export async function simpanJurnal(idJadwal, dataJurnal, arraySiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    // 1. Simpan detail materi ke dokumen Jadwal
    const updateJadwal = Jadwal.findByIdAndUpdate(idJadwal, {
      bab: dataJurnal.bab,
      subBab: dataJurnal.subBab,
      galeriPapan: dataJurnal.galeriPapan,
      fotoBersama: dataJurnal.fotoBersama
    });

    // 2. Simpan Extra Konsul & Nilai ke masing-masing dokumen Sesi Siswa
    let updateSesi = Promise.resolve();
    if (arraySiswa?.length > 0) {
      const ops = arraySiswa
        .filter(item => item.sesiId) // Hanya proses yang sudah absen/punya sesi
        .map(item => ({
          updateOne: {
            filter: { _id: item.sesiId },
            update: { 
              $set: { 
                konsulExtraMenit: item.konsulExtraMenit === "" ? 0 : Number(item.konsulExtraMenit),
                nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest)
              } 
            }
          }
        }));
        
      if (ops.length > 0) updateSesi = StudySession.bulkWrite(ops);
    }

    await Promise.all([updateJadwal, updateSesi]);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(PESAN_SISTEM.SUKSES_SIMPAN);
  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN, error);
  }
}