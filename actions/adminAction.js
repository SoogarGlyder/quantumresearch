"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { validationHelper } from "../utils/validationHelper";
import { STATUS_SESI, TIPE_SESI } from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

async function pastikanAdmin() {
  const { userId, peran } = await authHelper.ambilSesi();
  return userId && peran === "admin";
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 2. DASHBOARD & DATA FETCHING
// ============================================================================

export async function ambilDataDashboard() {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const [riwayat, siswa] = await Promise.all([
      StudySession.find()
        .populate("siswaId", "nama username nomorPeserta kelas")
        .sort({ waktuMulai: -1 })
        .limit(500)
        .lean(),
      User.find({ peran: "siswa" }).sort({ nama: 1 }).lean()
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
// 3. MANAJEMEN SISWA
// ============================================================================

export async function editAkunSiswa(idSiswa, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const dataUpdate = { ...dataBaru };
    
    if (dataBaru.password?.trim()) {
      if (!validationHelper.isValidPassword(dataBaru.password)) {
        return responseHelper.error("Password baru minimal 6 karakter.");
      }
      dataUpdate.password = await authHelper.buatHash(dataBaru.password);
    } else {
      delete dataUpdate.password;
    }

    if (dataUpdate.username) {
      dataUpdate.username = validationHelper.sanitize(dataUpdate.username).toLowerCase();
    }

    await User.findByIdAndUpdate(idSiswa, dataUpdate);
    revalidatePath("/admin");
    return responseHelper.success("Profil siswa berhasil diperbarui!");
  } catch (error) {
    return responseHelper.error("Gagal update siswa.", error);
  }
}

export async function hapusAkunSiswa(idSiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    await Promise.all([
      User.findByIdAndDelete(idSiswa),
      StudySession.deleteMany({ siswaId: idSiswa })
    ]);

    revalidatePath("/admin");
    return responseHelper.success("Siswa & riwayat berhasil dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal menghapus data siswa.", error);
  }
}

// ============================================================================
// 4. MANAJEMEN JADWAL
// ============================================================================

export async function tambahJadwal(dataForm) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    // 1. Backend pintar mencari data Guru berdasarkan Kode yang diketik Admin
    // Kita gunakan regex case-insensitive agar admin bebas ketik mtk-01 atau MTK-01
    const guru = await User.findOne({ 
      peran: "guru", 
      kodePengajar: { $regex: new RegExp(`^${dataForm.pengajar}$`, "i") } 
    });

    if (!guru) {
      return responseHelper.error(`Gagal: Pengajar dengan kode "${dataForm.pengajar}" tidak ditemukan!`);
    }

    // 2. Susun payload sesuai permintaan ketat Schema MongoDB
    const payloadJadwal = {
      tanggal: dataForm.tanggal,
      mapel: dataForm.mapel,
      kelasTarget: dataForm.kelasTarget,
      jamMulai: dataForm.jamMulai,
      jamSelesai: dataForm.jamSelesai,
      pertemuan: dataForm.pertemuan,
      
      // Ini 3 serangkai yang ditagih MongoDB:
      pengajarId: guru._id,
      namaPengajar: guru.nama,
      kodePengajar: guru.kodePengajar
    };

    await Jadwal.create(payloadJadwal);
    revalidatePath("/admin/jadwal");
    return responseHelper.success("Jadwal baru berhasil dibuat!");
  } catch (error) {
    return responseHelper.error("Gagal membuat jadwal.", error);
  }
}

export async function editJadwal(id, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    // Siapkan wadah update dasar
    let payloadUpdate = {
      pertemuan: dataBaru.pertemuan,
      jamMulai: dataBaru.jamMulai,
      jamSelesai: dataBaru.jamSelesai,
    };

    // Jika admin juga mengubah/mengirim kode pengajar saat edit
    if (dataBaru.pengajar) {
      const guru = await User.findOne({ 
        peran: "guru", 
        kodePengajar: { $regex: new RegExp(`^${dataBaru.pengajar}$`, "i") } 
      });

      if (!guru) {
        return responseHelper.error(`Gagal: Pengajar dengan kode "${dataBaru.pengajar}" tidak ditemukan!`);
      }

      // Masukkan 3 serangkai yang baru
      payloadUpdate.pengajarId = guru._id;
      payloadUpdate.namaPengajar = guru.nama;
      payloadUpdate.kodePengajar = guru.kodePengajar;
    }

    const update = await Jadwal.findByIdAndUpdate(id, payloadUpdate, { new: true });

    if (!update) return responseHelper.error("Jadwal tidak ditemukan.");

    revalidatePath("/admin/jadwal");
    return responseHelper.success("Jadwal berhasil diperbarui!");
  } catch (error) {
    return responseHelper.error("Terjadi kesalahan saat edit jadwal.", error);
  }
}

// ============================================================================
// 5. ABSENSI & JURNAL
// ============================================================================

export async function inputAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const { awal, akhir } = timeHelper.getRentangHari(data.tanggal);
    const statusFinal = data.catatan 
      ? `${data.keterangan} (${data.catatan})`.toLowerCase() 
      : data.keterangan.toLowerCase();

    await StudySession.findOneAndUpdate(
      {
        siswaId: data.siswaId,
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: data.mapel,
        waktuMulai: { $gte: awal, $lte: akhir }
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

    revalidatePath("/admin/monitoring");
    return responseHelper.success("Absensi manual berhasil disimpan.");
  } catch (error) {
    return responseHelper.error("Gagal proses absen manual.", error);
  }
}

export async function ambilDetailJurnal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const jadwal = await Jadwal.findById(idJadwal).lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    
    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find({ peran: "siswa", kelas: jadwal.kelasTarget, status: "aktif" })
        .select("nama nomorPeserta")
        .sort({ nama: 1 })
        .lean(),
      StudySession.find({
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        waktuMulai: { $gte: awal, $lte: akhir }
      }).select("siswaId status nilaiTest").lean()
    ]);

    const dataSiswaJurnal = siswaKelas.map(siswa => {
      const sesi = sesiHariIni.find(s => s.siswaId.toString() === siswa._id.toString());
      return {
        siswaId: siswa._id.toString(),
        nama: siswa.nama,
        nomorPeserta: siswa.nomorPeserta,
        sesiId: sesi ? sesi._id.toString() : null,
        statusAbsen: sesi ? sesi.status : "belum absen",
        nilaiTest: sesi ? sesi.nilaiTest ?? "" : ""
      };
    });

    return responseHelper.success("Detail jurnal berhasil dimuat.", {
      jadwal: serialize(jadwal),
      dataSiswa: dataSiswaJurnal
    });
  } catch (error) {
    return responseHelper.error("Gagal memuat detail jurnal.", error);
  }
}

export async function simpanJurnal(idJadwal, dataJurnal, arrayNilaiSiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const updateJadwal = Jadwal.findByIdAndUpdate(idJadwal, {
      bab: dataJurnal.bab,
      subBab: dataJurnal.subBab,
      galeriPapan: dataJurnal.galeriPapan,
      fotoBersama: dataJurnal.fotoBersama
    });

    let updateNilai = Promise.resolve();
    if (arrayNilaiSiswa?.length > 0) {
      const ops = arrayNilaiSiswa
        .filter(item => item.sesiId)
        .map(item => ({
          updateOne: {
            filter: { _id: item.sesiId },
            update: { $set: { nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest) } }
          }
        }));
      if (ops.length > 0) updateNilai = StudySession.bulkWrite(ops);
    }

    await Promise.all([updateJadwal, updateNilai]);
    revalidatePath("/admin/jadwal");
    return responseHelper.success("Jurnal & Nilai berhasil disimpan!");
  } catch (error) {
    return responseHelper.error("Gagal menyimpan jurnal.", error);
  }
}