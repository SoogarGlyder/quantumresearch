// actions/adminAction.js
"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { validationHelper } from "../utils/validationHelper";
import { TIPE_SESI } from "../utils/constants";
import { revalidatePath } from "next/cache";

// --- INTERNAL HELPER ---
async function pastikanAdmin() {
  const { userId, peran } = await authHelper.ambilSesi();
  return userId && peran === "admin";
}
const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 1. DASHBOARD DATA
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
// 2. MANAJEMEN JADWAL (Sering error di sini)
// ============================================================================
export async function ambilSemuaJadwal() {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const jadwal = await Jadwal.find({}).sort({ tanggal: 1 }).lean();
    return responseHelper.success("Data jadwal dimuat.", serialize(jadwal));
  } catch (error) {
    return responseHelper.error("Gagal mengambil jadwal.", error);
  }
}

export async function tambahJadwal(dataForm) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    const guru = await User.findOne({ 
      peran: "guru", 
      kodePengajar: { $regex: new RegExp(`^${dataForm.pengajar}$`, "i") } 
    });

    if (!guru) return responseHelper.error(`Guru kode ${dataForm.pengajar} tidak ada!`);

    await Jadwal.create({
      ...dataForm,
      pengajarId: guru._id,
      namaPengajar: guru.nama,
      kodePengajar: guru.kodePengajar
    });

    revalidatePath("/admin");
    return responseHelper.success("Jadwal berhasil dibuat!");
  } catch (error) {
    return responseHelper.error("Gagal buat jadwal.", error);
  }
}

export async function editJadwal(id, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    let payloadUpdate = { ...dataBaru };
    if (dataBaru.pengajar) {
      const guru = await User.findOne({ kodePengajar: dataBaru.pengajar });
      if (guru) {
        payloadUpdate.pengajarId = guru._id;
        payloadUpdate.namaPengajar = guru.nama;
        payloadUpdate.kodePengajar = guru.kodePengajar;
      }
    }

    await Jadwal.findByIdAndUpdate(id, payloadUpdate);
    revalidatePath("/admin");
    return responseHelper.success("Jadwal diupdate!");
  } catch (error) {
    return responseHelper.error("Gagal edit.", error);
  }
}

export async function hapusJadwal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");

    await Jadwal.findByIdAndDelete(idJadwal);
    revalidatePath("/admin");
    return responseHelper.success("Jadwal dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal hapus.", error);
  }
}

// ============================================================================
// 3. MANAJEMEN USER (SISWA)
// ============================================================================
export async function editAkunSiswa(idSiswa, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");
    const dataUpdate = { ...dataBaru };
    if (dataBaru.password?.trim()) {
      dataUpdate.password = await authHelper.buatHash(dataBaru.password);
    } else {
      delete dataUpdate.password;
    }
    await User.findByIdAndUpdate(idSiswa, dataUpdate);
    revalidatePath("/admin");
    return responseHelper.success("Siswa diperbarui!");
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
    return responseHelper.success("Siswa dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal hapus siswa.", error);
  }
}

// ============================================================================
// 4. ABSENSI & JURNAL
// ============================================================================
export async function inputAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error("Akses Ditolak!");
    const { awal } = timeHelper.getRentangHari(data.tanggal);
    const statusFinal = data.catatan ? `${data.keterangan} (${data.catatan})`.toLowerCase() : data.keterangan.toLowerCase();

    await StudySession.findOneAndUpdate(
      { siswaId: data.siswaId, namaMapel: data.mapel, waktuMulai: { $gte: awal } },
      { $set: { status: statusFinal, waktuSelesai: awal } },
      { upsert: true }
    );
    revalidatePath("/admin");
    return responseHelper.success("Absen manual sukses.");
  } catch (error) {
    return responseHelper.error("Gagal absen manual.", error);
  }
}

export async function ambilDetailJurnal(idJadwal) {
  try {
    await connectToDatabase();
    const jadwal = await Jadwal.findById(idJadwal).lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ada.");

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find({ peran: "siswa", kelas: jadwal.kelasTarget, status: "aktif" }).select("nama nomorPeserta").sort({ nama: 1 }).lean(),
      StudySession.find({ jenisSesi: TIPE_SESI.KELAS, namaMapel: jadwal.mapel, waktuMulai: { $gte: awal, $lte: akhir } }).lean()
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

    return responseHelper.success("Detail jurnal dimuat.", { jadwal: serialize(jadwal), dataSiswa: dataSiswaJurnal });
  } catch (error) {
    return responseHelper.error("Gagal detail jurnal.", error);
  }
}

export async function simpanJurnal(idJadwal, dataJurnal, arrayNilaiSiswa) {
  try {
    await connectToDatabase();
    const updateJadwal = Jadwal.findByIdAndUpdate(idJadwal, {
      bab: dataJurnal.bab,
      subBab: dataJurnal.subBab,
      galeriPapan: dataJurnal.galeriPapan,
      fotoBersama: dataJurnal.fotoBersama
    });

    let updateNilai = Promise.resolve();
    if (arrayNilaiSiswa?.length > 0) {
      const ops = arrayNilaiSiswa.filter(i => i.sesiId).map(item => ({
        updateOne: { filter: { _id: item.sesiId }, update: { $set: { nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest) } } }
      }));
      if (ops.length > 0) updateNilai = StudySession.bulkWrite(ops);
    }

    await Promise.all([updateJadwal, updateNilai]);
    revalidatePath("/admin");
    return responseHelper.success("Jurnal disimpan!");
  } catch (error) {
    return responseHelper.error("Gagal simpan jurnal.", error);
  }
}