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
  STATUS_SESI,
  PERIODE_BELAJAR
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

    const mulai = new Date(`${PERIODE_BELAJAR.MULAI}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
    const akhir = new Date(`${PERIODE_BELAJAR.AKHIR}T23:59:59${PERIODE_BELAJAR.ISO_OFFSET}`);

    const [riwayat, siswa] = await Promise.all([
      StudySession.find({ waktuMulai: { $gte: mulai, $lte: akhir } })
        .select("_id siswaId jenisSesi namaMapel waktuMulai waktuSelesai status terlambatMenit konsulExtraMenit jadwalId tanggalAsli")
        .populate("siswaId", "nama username nomorPeserta kelas status") 
        .sort({ waktuMulai: -1 })
        .lean(), 
        
      User.find({ peran: PERAN.SISWA.id })
        .select("_id nama username nomorPeserta noHp kelas status createdAt")
        .sort({ nama: 1 })
        .lean() 
    ]);

    return responseHelper.success("Data dashboard dimuat.", { riwayat: serialize(riwayat), siswa: serialize(siswa) });
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

    const mulai = new Date(`${PERIODE_BELAJAR.MULAI}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
    const akhir = new Date(`${PERIODE_BELAJAR.AKHIR}T23:59:59${PERIODE_BELAJAR.ISO_OFFSET}`);

    const data = await AbsensiPengajar.find({ waktuMasuk: { $gte: mulai, $lte: akhir } })
      .select("_id pengajarId waktuMasuk waktuKeluar status")
      .populate("pengajarId", "nama kodePengajar") 
      .sort({ waktuMasuk: -1 })
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

    const jadwal = await Jadwal.find({ tanggal: { $gte: PERIODE_BELAJAR.MULAI, $lte: PERIODE_BELAJAR.AKHIR } })
      .select("_id tanggal mapel kelasTarget jamMulai jamSelesai pengajarId pengajar namaPengajar kodePengajar pertemuan bab subBab galeriPapan fotoBersama")
      .sort({ tanggal: 1 })
      .lean();

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
    }).select("_id nama kodePengajar").lean(); 

    if (!pengajarObj) return responseHelper.error(`Kode "${kodeCari}" tidak ditemukan!`);

    await Jadwal.create({
      tanggal: dataForm.tanggal, mapel: dataForm.mapel, kelasTarget: dataForm.kelasTarget,
      jamMulai: dataForm.jamMulai, jamSelesai: dataForm.jamSelesai, pertemuan: Number(dataForm.pertemuan),
      pengajarId: pengajarObj._id, pengajar: pengajarObj.nama, namaPengajar: pengajarObj.nama, kodePengajar: pengajarObj.kodePengajar
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
      }).select("_id nama kodePengajar").lean();
      
      if (pengajarObj) {
        payloadUpdate.pengajarId = pengajarObj._id;
        payloadUpdate.pengajar = pengajarObj.nama;
        payloadUpdate.namaPengajar = pengajarObj.nama;
        payloadUpdate.kodePengajar = pengajarObj.kodePengajar;
      }
    }

    await Jadwal.updateOne({ _id: id }, { $set: payloadUpdate });
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

    await Jadwal.deleteOne({ _id: idJadwal });
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

    if (dataUpdate.username) dataUpdate.username = validationHelper.sanitize(dataUpdate.username).toLowerCase();

    await User.updateOne({ _id: idSiswa }, { $set: dataUpdate });
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
      User.deleteOne({ _id: idSiswa }),
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
    const statusFinal = data.catatan ? `${data.keterangan} (${data.catatan})`.toLowerCase() : data.keterangan.toLowerCase();

    await StudySession.updateOne(
      { siswaId: data.siswaId, jenisSesi: TIPE_SESI.KELAS, namaMapel: data.mapel, waktuMulai: { $gte: awal } },
      {
        $set: { status: statusFinal, waktuSelesai: awal },
        $setOnInsert: {
          siswaId: data.siswaId, jenisSesi: TIPE_SESI.KELAS, namaMapel: data.mapel, waktuMulai: awal, terlambatMenit: 0
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

export async function ambilDetailJurnal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    // 🚀 BUG FIXED: Mencabut blokir -fotoBersama dan -galeriPapan agar foto muncul di Cetak Laporan!
    const jadwal = await Jadwal.findById(idJadwal).lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    
    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find({ peran: PERAN.SISWA.id, kelas: jadwal.kelasTarget, status: STATUS_USER.AKTIF })
        .select("_id nama nomorPeserta")
        .sort({ nama: 1 })
        .lean(),
      StudySession.find({ jenisSesi: TIPE_SESI.KELAS, namaMapel: jadwal.mapel, waktuMulai: { $gte: awal, $lte: akhir } })
        .select("_id siswaId status waktuMulai waktuSelesai terlambatMenit konsulExtraMenit nilaiTest") 
        .lean()
    ]);

    const dataSiswaJurnal = siswaKelas.map(siswa => {
      const sesi = sesiHariIni.find(s => s.siswaId.toString() === siswa._id.toString());
      return {
        siswaId: siswa._id.toString(), nama: siswa.nama, nomorPeserta: siswa.nomorPeserta,
        sesiId: sesi ? sesi._id.toString() : null,
        statusAbsen: sesi ? sesi.status : LABEL_SISTEM.BELUM_ABSEN,
        waktuMulai: sesi ? sesi.waktuMulai : null, waktuSelesai: sesi ? sesi.waktuSelesai : null,
        terlambatMenit: sesi?.terlambatMenit || 0, konsulExtraMenit: sesi?.konsulExtraMenit || 0, nilaiTest: sesi?.nilaiTest ?? "" 
      };
    });

    return responseHelper.success("Detail jurnal dimuat.", { jadwal: serialize(jadwal), dataSiswa: dataSiswaJurnal });
  } catch (error) {
    return responseHelper.error("Gagal detail jurnal.", error);
  }
}

export async function simpanJurnal(idJadwal, dataJurnal, arraySiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const updateJadwal = Jadwal.updateOne({ _id: idJadwal }, {
      $set: { bab: dataJurnal.bab, subBab: dataJurnal.subBab, galeriPapan: dataJurnal.galeriPapan, fotoBersama: dataJurnal.fotoBersama }
    });

    let updateSesi = Promise.resolve();
    if (arraySiswa?.length > 0) {
      const ops = arraySiswa.filter(item => item.sesiId).map(item => ({
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

// 🚀 FITUR: PAKSA HENTIKAN SESI (ATOMIC OPTIMIZED)
export async function paksaHentikanSesi(idSesi, durasiPilihan) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await StudySession.findById(idSesi).select("waktuMulai").lean();
    if (!sesi) return responseHelper.error("Sesi tidak ditemukan.");

    const waktuMulaiObj = new Date(sesi.waktuMulai);
    const waktuSelesaiBaru = new Date(waktuMulaiObj.getTime() + durasiPilihan * 60000);

    let statusBaru, catatanInternalBaru;
    if (durasiPilihan === 0) {
      statusBaru = STATUS_SESI.PINALTI.id;
      catatanInternalBaru = "Dihentikan manual (PINALTI - Lupa Scan)";
    } else {
      statusBaru = STATUS_SESI.SELESAI.id;
      catatanInternalBaru = `Dihentikan manual oleh Admin (${durasiPilihan}m)`;
    }
    
    await StudySession.updateOne(
      { _id: idSesi },
      { $set: { status: statusBaru, catatanInternal: catatanInternalBaru, waktuSelesai: waktuSelesaiBaru } }
    );
    
    revalidatePath(PERAN.ADMIN.home);
    const labelHukuman = durasiPilihan === 0 ? "PINALTI" : `${durasiPilihan} Menit`;
    return responseHelper.success(`Sesi dihentikan (${labelHukuman}).`);
  } catch (error) {
    return responseHelper.error("Gagal menghentikan sesi.", error.message);
  }
}

export async function prosesSimpanAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const waktuMasuk = new Date(`${data.tanggal}T${data.jamMasuk}:00${PERIODE_BELAJAR.ISO_OFFSET}`);
    const waktuKeluar = data.jamKeluar ? new Date(`${data.tanggal}T${data.jamKeluar}:00${PERIODE_BELAJAR.ISO_OFFSET}`) : null;

    await AbsensiPengajar.create({
      pengajarId: data.pengajarId, waktuMasuk, waktuKeluar,
      status: "HADIR", keterangan: data.keterangan || "Input Manual Admin"
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Absensi staf berhasil disimpan!");
  } catch (error) {
    return responseHelper.error("Gagal simpan absen manual.", error.message);
  }
}

export async function prosesHapusAbsenStaf(idAbsen) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    await AbsensiPengajar.deleteOne({ _id: idAbsen });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Data absensi staf dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal menghapus absensi.", error.message);
  }
}