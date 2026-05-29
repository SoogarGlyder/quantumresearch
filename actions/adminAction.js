"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal";
import AbsensiPengajar from "../models/AbsensiPengajar";
import { authHelper } from "../utils/authHelper";
import { responseHelper, serialize } from "../utils/responseHelper";
import { timeHelper } from "../utils/timeHelper";
import { validationHelper } from "../utils/validationHelper";
import { syncHelper } from "../utils/syncHelper";
import {
  guardAdmin,
  guardAdminEdit,
  guardSuperAdmin,
  buildFilterCabang,
  ambilSesiAktif,
} from "../utils/guardHelper";
import {
  PERAN, TIPE_SESI, STATUS_USER, LABEL_SISTEM,
  PESAN_SISTEM, STATUS_SESI, PERIODE_BELAJAR,
  CABANG_QUANTUM, PANGKAT_PENGAJAR, KONFIGURASI_SISTEM,
} from "../utils/constants";
import { revalidatePath } from "next/cache";

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
// 1. DASHBOARD & DATA FETCHING
// ============================================================================
export async function ambilDataDashboard() {
  try {
    await connectToDatabase();
    if (!(await guardAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await ambilSesiAktif();
    const adminYgLogin = await User.findById(sesi.userId)
      .select("kodeCabang pangkat kelasAsuh")
      .lean();
    if (!adminYgLogin) return responseHelper.error("User tidak ditemukan.");

    let querySiswa = {
      peran: PERAN.SISWA.id,
      ...buildFilterCabang(adminYgLogin.kodeCabang),
    };

    if (adminYgLogin.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH) {
      if (Array.isArray(adminYgLogin.kelasAsuh) && adminYgLogin.kelasAsuh.length > 0) {
        querySiswa.kelas = { $in: adminYgLogin.kelasAsuh };
      } else {
        return responseHelper.success("Belum ada kelas asuh.", { riwayat: [], siswa: [] });
      }
    }

    const siswa = await User.find(querySiswa)
      .select("_id nama username nomorPeserta kelas asalSekolah noHp status createdAt")
      .sort({ nama: 1 })
      .lean();

    if (!siswa || siswa.length === 0) {
      return responseHelper.success("Tidak ada data siswa.", { riwayat: [], siswa: [] });
    }

    const arrayIdSiswa = siswa.map((s) => s._id);

    const riwayat = await StudySession.find({
      waktuMulai: { $gte: PERIODE_MULAI, $lte: PERIODE_AKHIR },
      siswaId: { $in: arrayIdSiswa },
    })
      .select("_id siswaId jenisSesi namaMapel waktuMulai waktuSelesai status terlambatMenit konsulExtraMenit jadwalId pengajarPendamping")
      .populate("siswaId", "nama username nomorPeserta kelas status")
      .populate("pengajarPendamping", "nama kodePengajar")
      .populate({ path: "jadwalId", select: "namaPengajar kodePengajar", model: "Jadwal", strictPopulate: false })
      .sort({ waktuMulai: -1 })
      .limit(3000)
      .lean();

    const riwayatBersih = riwayat
      .filter((r) => r.siswaId !== null)
      .map((r) => ({
        ...r,
        _id: r._id.toString(),
        siswaId: typeof r.siswaId === "object"
          ? { ...r.siswaId, _id: r.siswaId._id.toString() }
          : r.siswaId.toString(),
        jadwalId: r.jadwalId && typeof r.jadwalId === "object"
          ? { ...r.jadwalId, _id: r.jadwalId._id.toString() }
          : r.jadwalId ? r.jadwalId.toString() : null,
        pengajarPendamping: r.pengajarPendamping && typeof r.pengajarPendamping === "object"
          ? { ...r.pengajarPendamping, _id: r.pengajarPendamping._id.toString() }
          : r.pengajarPendamping ? r.pengajarPendamping.toString() : null,
      }));

    const siswaBersih = siswa.map((s) => ({ ...s, _id: s._id.toString() }));
    return responseHelper.success("Data dashboard dimuat.", { riwayat: riwayatBersih, siswa: siswaBersih });
  } catch (error) {
    console.error("[CRITICAL ERROR Dashboard]:", error);
    return responseHelper.error("Gagal memuat data dashboard.");
  }
}

// ============================================================================
// 2. MANAJEMEN STAF (ABSENSI)
// ============================================================================
export async function ambilAbsensiPengajar() {
  try {
    await connectToDatabase();
    if (!(await guardAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await ambilSesiAktif();
    const filterCabangStaf = buildFilterCabang(sesi.kodeCabang);

    const data = await AbsensiPengajar.find({
      waktuMasuk: { $gte: PERIODE_MULAI, $lte: PERIODE_AKHIR },
    })
      .select("_id pengajarId waktuMasuk waktuKeluar status namaPengajar")
      .populate({ path: "pengajarId", select: "nama kodePengajar", match: filterCabangStaf })
      .sort({ waktuMasuk: -1 })
      .lean();

    const dataBersih = data.filter((d) => d.pengajarId !== null);
    return responseHelper.success("Data absen staf dimuat.", serialize(dataBersih));
  } catch (error) {
    console.error("[ERROR ambilAbsensiPengajar]:", error);
    return responseHelper.error("Gagal mengambil absen staf.");
  }
}

// ============================================================================
// 3. MANAJEMEN JADWAL
// ============================================================================
export async function ambilSemuaJadwal() {
  try {
    await connectToDatabase();
    if (!(await guardAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await ambilSesiAktif();
    const adminYgLogin = await User.findById(sesi.userId)
      .select("kodeCabang pangkat kelasAsuh")
      .lean();
    if (!adminYgLogin) return responseHelper.error("User tidak ditemukan.");

    let queryJadwal = { tanggal: { $gte: PERIODE_MULAI, $lte: PERIODE_AKHIR } };

    if (adminYgLogin.kodeCabang && adminYgLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const guruSekota = await User.find({
        kodeCabang: adminYgLogin.kodeCabang,
        peran: PERAN.PENGAJAR.id,
      }).select("_id").lean();
      queryJadwal.pengajarId = { $in: guruSekota.map((g) => g._id) };
    }

    if (
      adminYgLogin.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH &&
      Array.isArray(adminYgLogin.kelasAsuh) &&
      adminYgLogin.kelasAsuh.length > 0
    ) {
      queryJadwal.kelasTarget = { $in: adminYgLogin.kelasAsuh };
    }

    const jadwal = await Jadwal.find(queryJadwal)
      .populate("pengajarId", "nama kodePengajar kodeCabang")
      .lean();

    const dataAman = jadwal.map((j) => ({
      ...j,
      _id: j._id.toString(),
      pengajarId: j.pengajarId
        ? { _id: j.pengajarId._id.toString(), nama: j.pengajarId.nama, kodePengajar: j.pengajarId.kodePengajar, kodeCabang: j.pengajarId.kodeCabang }
        : null,
    }));

    return responseHelper.success("Jadwal termuat", dataAman);
  } catch (error) {
    console.error("[ERROR ambilSemuaJadwal]:", error);
    return responseHelper.error("Gagal memuat jadwal.");
  }
}

export async function ambilPengajarCabang() {
  try {
    await connectToDatabase();
    if (!(await guardAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await ambilSesiAktif();
    const pengajar = await User.find({
      peran: PERAN.PENGAJAR.id,
      ...buildFilterCabang(sesi.kodeCabang),
    })
      .select("_id nama username nomorPeserta kodePengajar noHp pangkat status createdAt kodeCabang")
      .sort({ nama: 1 })
      .lean();

    return responseHelper.success("Data pengajar dimuat.", serialize(pengajar));
  } catch (error) {
    console.error("[ERROR ambilPengajarCabang]:", error);
    return responseHelper.error("Gagal mengambil data pengajar.");
  }
}

export async function tambahJadwal(dataForm) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak: Anda tidak memiliki otoritas.");
    const sesi = await ambilSesiAktif();

    const kodeCari = validationHelper.trimInput(dataForm.pengajar);
    const kodeCariAman = validationHelper.escapeRegex(kodeCari);

    let queryPengajar = {
      peran: PERAN.PENGAJAR.id,
      kodePengajar: { $regex: new RegExp(`^${kodeCariAman}$`, "i") },
    };
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      queryPengajar.kodeCabang = sesi.kodeCabang;
    }

    const pengajarObj = await User.findOne(queryPengajar)
      .select("_id nama kodePengajar")
      .lean();
    if (!pengajarObj) return responseHelper.error(`Kode "${kodeCari}" tidak ditemukan di cabang Anda!`);

    await Jadwal.create({
      tanggal: validationHelper.trimInput(dataForm.tanggal),
      mapel: validationHelper.trimInput(dataForm.mapel),
      kelasTarget: validationHelper.trimInput(dataForm.kelasTarget),
      jamMulai: validationHelper.trimInput(dataForm.jamMulai),
      jamSelesai: validationHelper.trimInput(dataForm.jamSelesai),
      pertemuan: Number(dataForm.pertemuan),
      pengajarId: pengajarObj._id,
      namaPengajar: pengajarObj.nama,
      kodePengajar: pengajarObj.kodePengajar,
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(PESAN_SISTEM.SUKSES_SIMPAN);
  } catch (error) {
    console.error("[ERROR tambahJadwal]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function editJadwal(id, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak: Anda tidak memiliki otoritas.");
    const sesi = await ambilSesiAktif();

    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetJadwal = await Jadwal.findById(id)
        .populate("pengajarId", "kodeCabang")
        .lean();
      if (!targetJadwal) return responseHelper.error("Jadwal tidak ditemukan.");
      if (targetJadwal.pengajarId?.kodeCabang !== sesi.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Mencoba mengedit jadwal lintas cabang.");
      }
    }

    let payloadUpdate = { ...dataBaru };
    if (payloadUpdate.tanggal) payloadUpdate.tanggal = validationHelper.trimInput(payloadUpdate.tanggal);
    if (payloadUpdate.mapel) payloadUpdate.mapel = validationHelper.trimInput(payloadUpdate.mapel);
    if (payloadUpdate.kelasTarget) payloadUpdate.kelasTarget = validationHelper.trimInput(payloadUpdate.kelasTarget);

    if (dataBaru.pengajar) {
      const pCari = validationHelper.trimInput(dataBaru.pengajar);
      let queryPengajar = {
        peran: PERAN.PENGAJAR.id,
        $or: [{ kodePengajar: pCari }, { nama: pCari }],
      };
      if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) queryPengajar.kodeCabang = sesi.kodeCabang;

      const pengajarObj = await User.findOne(queryPengajar)
        .select("_id nama kodePengajar")
        .lean();
      if (pengajarObj) {
        payloadUpdate.pengajarId = pengajarObj._id;
        payloadUpdate.namaPengajar = pengajarObj.nama;
        payloadUpdate.kodePengajar = pengajarObj.kodePengajar;
      }
    }

    await Jadwal.updateOne({ _id: id }, { $set: payloadUpdate });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Jadwal diperbarui.");
  } catch (error) {
    console.error("[ERROR editJadwal]:", error);
    return responseHelper.error("Gagal mengedit jadwal.");
  }
}

export async function hapusJadwal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak: Anda tidak memiliki otoritas.");
    const sesi = await ambilSesiAktif();

    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetJadwal = await Jadwal.findById(idJadwal)
        .populate("pengajarId", "kodeCabang")
        .lean();
      if (!targetJadwal) return responseHelper.error("Jadwal tidak ditemukan.");
      if (targetJadwal.pengajarId?.kodeCabang !== sesi.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Mencoba menghapus jadwal lintas cabang.");
      }
    }

    await Jadwal.deleteOne({ _id: idJadwal });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Jadwal dihapus.");
  } catch (error) {
    console.error("[ERROR hapusJadwal]:", error);
    return responseHelper.error("Gagal menghapus jadwal.");
  }
}

// ============================================================================
// 4. MANAJEMEN AKUN USER
// ============================================================================
export async function editAkunSiswa(idSiswa, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await ambilSesiAktif();

    const dataUpdate = { ...dataBaru };
    if (dataBaru.password?.trim()) {
      dataUpdate.password = await authHelper.buatHash(dataBaru.password);
    } else {
      delete dataUpdate.password;
    }

    if (dataUpdate.username) dataUpdate.username = validationHelper.trimInput(dataUpdate.username).toLowerCase();
    if (dataUpdate.nama) dataUpdate.nama = validationHelper.trimInput(dataUpdate.nama);

    const queryFilter = {
      _id: idSiswa,
      ...buildFilterCabang(sesi.kodeCabang),
    };

    const hasil = await User.updateOne(queryFilter, { $set: dataUpdate });
    if (hasil.matchedCount === 0) {
      return responseHelper.error("Gagal! Siswa tidak ditemukan atau berasal dari cabang lain.");
    }

    if (dataUpdate.nama) {
      syncHelper.sinkronisasiNamaMassal(idSiswa, dataUpdate.nama, PERAN.SISWA.id);
    }

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Data berhasil diperbarui.");
  } catch (error) {
    console.error("[ERROR editAkunSiswa]:", error);
    return responseHelper.error("Gagal update user.");
  }
}

export async function hapusAkunSiswa(idSiswa) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await ambilSesiAktif();

    const queryFilter = {
      _id: idSiswa,
      ...buildFilterCabang(sesi.kodeCabang),
    };

    const hasil = await User.deleteOne(queryFilter);
    if (hasil.deletedCount === 0) {
      return responseHelper.error("Gagal! Siswa tidak ditemukan atau berasal dari cabang lain.");
    }

    await StudySession.deleteMany({ siswaId: idSiswa });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Akun & riwayat dihapus.");
  } catch (error) {
    console.error("[ERROR hapusAkunSiswa]:", error);
    return responseHelper.error("Gagal hapus user.");
  }
}

// ============================================================================
// 5. ABSENSI & JURNAL
// ============================================================================
export async function inputAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await ambilSesiAktif();

    const querySiswa = {
      _id: data.siswaId,
      ...buildFilterCabang(sesi.kodeCabang),
    };

    const siswaData = await User.findOne(querySiswa).select("nama").lean();
    if (!siswaData) return responseHelper.error("Akses Ditolak: Siswa bukan dari cabang Anda.");

    const { awal } = timeHelper.getRentangHari(data.tanggal);
    const keteranganAman = validationHelper.trimInput(data.keterangan);
    const catatanAman = validationHelper.trimInput(data.catatan);
    const statusFinal = catatanAman
      ? `${keteranganAman} (${catatanAman})`.toLowerCase()
      : keteranganAman.toLowerCase();

    await StudySession.updateOne(
      { siswaId: data.siswaId, jenisSesi: TIPE_SESI.KELAS, namaMapel: data.mapel, waktuMulai: { $gte: awal } },
      {
        $set: { status: statusFinal, waktuSelesai: awal },
        $setOnInsert: {
          siswaId: data.siswaId,
          namaSiswa: siswaData.nama,
          jenisSesi: TIPE_SESI.KELAS,
          namaMapel: data.mapel,
          waktuMulai: awal,
          terlambatMenit: 0,
        },
      },
      { upsert: true }
    );

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Absen manual berhasil.");
  } catch (error) {
    console.error("[ERROR inputAbsenManual]:", error);
    return responseHelper.error("Gagal absen manual.");
  }
}

export async function ambilDetailJurnal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await guardAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);
    const sesi = await ambilSesiAktif();

    const jadwal = await Jadwal.findById(idJadwal)
      .populate("pengajarId", "kodeCabang")
      .lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);

    let querySiswa = { peran: PERAN.SISWA.id, kelas: jadwal.kelasTarget, status: STATUS_USER.AKTIF };
    if (jadwal.pengajarId?.kodeCabang) {
      querySiswa.kodeCabang = jadwal.pengajarId.kodeCabang;
    } else if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      querySiswa.kodeCabang = sesi.kodeCabang;
    }

    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find(querySiswa).select("_id nama nomorPeserta").sort({ nama: 1 }).lean(),
      StudySession.find({
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        waktuMulai: { $gte: awal, $lte: akhir },
      })
        .select("_id siswaId status waktuMulai waktuSelesai terlambatMenit konsulExtraMenit nilaiTest")
        .lean(),
    ]);

    const dataSiswaJurnal = siswaKelas.map((siswa) => {
      const sesiSiswa = sesiHariIni.find((s) => s.siswaId.toString() === siswa._id.toString());
      return {
        siswaId: siswa._id.toString(),
        nama: siswa.nama,
        nomorPeserta: siswa.nomorPeserta,
        sesiId: sesiSiswa ? sesiSiswa._id.toString() : null,
        statusAbsen: sesiSiswa ? sesiSiswa.status : LABEL_SISTEM.BELUM_ABSEN,
        waktuMulai: sesiSiswa ? sesiSiswa.waktuMulai : null,
        waktuSelesai: sesiSiswa ? sesiSiswa.waktuSelesai : null,
        terlambatMenit: sesiSiswa?.terlambatMenit || 0,
        konsulExtraMenit: sesiSiswa?.konsulExtraMenit || 0,
        nilaiTest: sesiSiswa?.nilaiTest ?? "",
      };
    });

    return responseHelper.success("Detail jurnal dimuat.", {
      jadwal: serialize(jadwal),
      dataSiswa: dataSiswaJurnal,
    });
  } catch (error) {
    console.error("[ERROR ambilDetailJurnal]:", error);
    return responseHelper.error("Gagal mengambil detail jurnal.");
  }
}

export async function simpanJurnal(idJadwal, dataJurnal, arraySiswa) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await ambilSesiAktif();

    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetJadwal = await Jadwal.findById(idJadwal)
        .populate("pengajarId", "kodeCabang")
        .lean();
      if (!targetJadwal || targetJadwal.pengajarId?.kodeCabang !== sesi.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Anda tidak dapat menyimpan jurnal cabang lain.");
      }
    }

    const updateJadwal = Jadwal.updateOne(
      { _id: idJadwal },
      {
        $set: {
          bab: validationHelper.trimInput(dataJurnal.bab),
          subBab: validationHelper.trimInput(dataJurnal.subBab),
          galeriPapan: dataJurnal.galeriPapan,
          fotoBersama: dataJurnal.fotoBersama,
        },
      }
    );

    let updateSesi = Promise.resolve();
    if (arraySiswa?.length > 0) {
      const ops = arraySiswa
        .filter((item) => item.sesiId && validationHelper.isValidObjectId(item.sesiId))
        .map((item) => ({
          updateOne: {
            filter: { _id: item.sesiId },
            update: {
              $set: {
                konsulExtraMenit: item.konsulExtraMenit === "" ? 0 : Number(item.konsulExtraMenit),
                nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest),
              },
            },
          },
        }));
      if (ops.length > 0) updateSesi = StudySession.bulkWrite(ops);
    }

    await Promise.all([updateJadwal, updateSesi]);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(PESAN_SISTEM.SUKSES_SIMPAN);
  } catch (error) {
    console.error("[ERROR simpanJurnal]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

export async function paksaHentikanSesi(idSesi, durasiPilihan) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await ambilSesiAktif();

    const sesiMongoose = await StudySession.findById(idSesi)
      .populate("siswaId", "kodeCabang")
      .lean();
    if (!sesiMongoose) return responseHelper.error("Sesi tidak ditemukan.");

    if (
      sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id &&
      sesiMongoose.siswaId?.kodeCabang !== sesi.kodeCabang
    ) {
      return responseHelper.error("Akses Ditolak: Sesi ini milik siswa dari cabang lain.");
    }

    const waktuSelesaiBaru = new Date(
      new Date(sesiMongoose.waktuMulai).getTime() + durasiPilihan * 60_000
    );
    const statusBaru = durasiPilihan === 0 ? STATUS_SESI.PINALTI.id : STATUS_SESI.SELESAI.id;
    const catatan = durasiPilihan === 0
      ? "Dihentikan manual (PINALTI - Lupa Scan)"
      : `Dihentikan manual oleh Admin (${durasiPilihan}m)`;

    await StudySession.updateOne(
      { _id: idSesi },
      { $set: { status: statusBaru, catatanInternal: catatan, waktuSelesai: waktuSelesaiBaru } }
    );

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(`Sesi dihentikan (${durasiPilihan === 0 ? "PINALTI" : durasiPilihan + " Menit"}).`);
  } catch (error) {
    console.error("[ERROR paksaHentikanSesi]:", error);
    return responseHelper.error("Gagal menghentikan sesi.");
  }
}

export async function prosesSimpanAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak.");

    const guru = await User.findById(data.pengajarId).select("nama").lean();
    const waktuMasuk = new Date(
      `${validationHelper.trimInput(data.tanggal)}T${validationHelper.trimInput(data.jamMasuk)}:00${PERIODE_BELAJAR.ISO_OFFSET}`
    );
    const waktuKeluar = data.jamKeluar
      ? new Date(`${validationHelper.trimInput(data.tanggal)}T${validationHelper.trimInput(data.jamKeluar)}:00${PERIODE_BELAJAR.ISO_OFFSET}`)
      : null;

    await AbsensiPengajar.create({
      pengajarId: data.pengajarId,
      namaPengajar: guru ? guru.nama : "Pengajar",
      waktuMasuk,
      waktuKeluar,
      status: "HADIR",
      keterangan: validationHelper.trimInput(data.keterangan) || "Input Manual Admin",
    });

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Absensi staf berhasil disimpan!");
  } catch (error) {
    console.error("[ERROR prosesSimpanAbsenManual]:", error);
    return responseHelper.error("Gagal simpan absen manual.");
  }
}

export async function prosesHapusAbsenStaf(idAbsen) {
  try {
    await connectToDatabase();
    if (!(await guardAdminEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await ambilSesiAktif();

    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetAbsen = await AbsensiPengajar.findById(idAbsen)
        .populate("pengajarId", "kodeCabang")
        .lean();
      if (!targetAbsen || targetAbsen.pengajarId?.kodeCabang !== sesi.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Anda tidak dapat menghapus absen staf cabang lain.");
      }
    }

    await AbsensiPengajar.deleteOne({ _id: idAbsen });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Data absensi staf dihapus.");
  } catch (error) {
    console.error("[ERROR prosesHapusAbsenStaf]:", error);
    return responseHelper.error("Gagal menghapus absensi.");
  }
}

// ============================================================================
// 6. LAPORAN BULANAN SISWA (RAPOR)
// ============================================================================
export async function ambilLaporanBulananSiswa(siswaId, bulan, tahun) {
  try {
    await connectToDatabase();
    if (!(await guardAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const siswa = await User.findById(siswaId)
      .select("nama nomorPeserta kelas jadwalKelas jamKelas totalExp koleksiLencana kodeCabang")
      .lean();
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    const tanggalMulai = new Date(tahun, bulan - 1, 1);
    const tanggalAkhir = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    const sesiBulanan = await StudySession.find({
      siswaId,
      waktuMulai: { $gte: tanggalMulai, $lte: tanggalAkhir },
      status: { $nin: [STATUS_SESI.BERJALAN.id] },
    })
      .sort({ waktuMulai: 1 })
      .lean();

    return responseHelper.success("Data rapor berhasil ditarik.", {
      profil: {
        nama: siswa.nama,
        nomorPeserta: siswa.nomorPeserta,
        kelas: siswa.kelas,
        kodeCabang: siswa.kodeCabang,
        jadwalKelas: siswa.jadwalKelas,
        jamKelas: siswa.jamKelas,
        totalExp: siswa.totalExp || 0,
        jumlahLencana: siswa.koleksiLencana?.length || 0,
      },
      kelas: serialize(sesiBulanan.filter((s) => s.jenisSesi === TIPE_SESI.KELAS)),
      konsul: serialize(sesiBulanan.filter((s) => s.jenisSesi === TIPE_SESI.KONSUL)),
    });
  } catch (error) {
    console.error("[ERROR ambilLaporanBulananSiswa]:", error);
    return responseHelper.error("Gagal mengambil data rapor.");
  }
}

// ============================================================================
// 7. MANAJEMEN AKUN ADMIN CABANG (HANYA SUPER ADMIN)
// ============================================================================
export async function ambilSemuaAdmin() {
  try {
    await connectToDatabase();
    if (!(await guardSuperAdmin())) return responseHelper.error("Akses Ditolak: Hanya Super Admin.");

    const admins = await User.find({ peran: PERAN.ADMIN.id })
      .select("_id nama username noHp kodeCabang peran status")
      .sort({ kodeCabang: 1, nama: 1 })
      .lean();

    return responseHelper.success("Data admin ditarik", serialize(admins));
  } catch (error) {
    console.error("[ERROR ambilSemuaAdmin]:", error);
    return responseHelper.error("Gagal menarik data admin.");
  }
}

export async function simpanAkunAdmin(idEdit, payload) {
  try {
    await connectToDatabase();
    if (!(await guardSuperAdmin())) return responseHelper.error("Akses Ditolak: Hanya Super Admin.");

    const dataSimpan = {
      nama: validationHelper.trimInput(payload.nama),
      username: validationHelper.trimInput(payload.username).toLowerCase(),
      noHp: validationHelper.trimInput(payload.noHp),
      peran: PERAN.ADMIN.id,
      kodeCabang: validationHelper.trimInput(payload.kodeCabang),
      status: payload.status,
    };

    if (payload.password) {
      dataSimpan.password = await authHelper.buatHash(payload.password);
    }

    if (idEdit) {
      const duplikat = await User.findOne({ username: dataSimpan.username, _id: { $ne: idEdit } });
      if (duplikat) return responseHelper.error("Username sudah dipakai oleh akun lain!");

      await User.updateOne({ _id: idEdit }, { $set: dataSimpan });

      if (dataSimpan.nama) {
        syncHelper.sinkronisasiNamaMassal(idEdit, dataSimpan.nama, PERAN.ADMIN.id);
      }

      revalidatePath(PERAN.ADMIN.home);
      return responseHelper.success("Admin berhasil diperbarui!");
    } else {
      const cekDuplikat = await User.exists({ username: dataSimpan.username });
      if (cekDuplikat) return responseHelper.error("Username sudah digunakan!");

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      dataSimpan.nomorPeserta = `${payload.kodeCabang}_ADMIN_${randomSuffix}`;

      if (!dataSimpan.password) {
        dataSimpan.password = await authHelper.buatHash(
          payload.noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD
        );
      }

      await User.create(dataSimpan);
      revalidatePath(PERAN.ADMIN.home);
      return responseHelper.success("Akun Admin baru berhasil ditambahkan!");
    }
  } catch (error) {
    console.error("[CRITICAL ERROR SIMPAN ADMIN]:", error);
    return responseHelper.error("Gagal menyimpan data admin.");
  }
}

export async function hapusAkunAdmin(id) {
  try {
    await connectToDatabase();
    if (!(await guardSuperAdmin())) return responseHelper.error("Akses Ditolak: Hanya Super Admin.");

    await User.deleteOne({ _id: id });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Akses admin berhasil dicabut.");
  } catch (error) {
    console.error("[ERROR hapusAkunAdmin]:", error);
    return responseHelper.error("Gagal menghapus admin.");
  }
}

// ============================================================================
// 8. LAPORAN BULANAN PENGAJAR (KINERJA)
// ============================================================================
export async function ambilLaporanBulananPengajar(pengajarId, bulan, tahun) {
  try {
    await connectToDatabase();
    if (!(await guardAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const pengajar = await User.findById(pengajarId)
      .select("nama nomorPeserta kodePengajar pangkat kodeCabang kelasAsuh")
      .lean();
    if (!pengajar) return responseHelper.error("Pengajar tidak ditemukan.");

    // Periode cut-off staf: tgl 29 bulan lalu s/d tgl 28 bulan ini
    const tanggalMulai = new Date(tahun, bulan - 2, 29);
    const tanggalAkhir = new Date(tahun, bulan - 1, 28, 23, 59, 59, 999);

    const jadwalGuru = await Jadwal.find({
      pengajarId,
      tanggal: { $gte: tanggalMulai, $lte: tanggalAkhir },
    })
      .sort({ tanggal: 1, jamMulai: 1 })
      .lean();

    const semuaSesiKelas = await StudySession.find({
      jenisSesi: TIPE_SESI.KELAS,
      waktuMulai: { $gte: tanggalMulai, $lte: tanggalAkhir },
      status: STATUS_SESI.SELESAI.id,
    })
      .populate("siswaId", "kelas")
      .lean();

    const extraMap = {};
    const listExtraSiswaMap = new Map();

    jadwalGuru.forEach((j) => {
      let maxExtra = 0;
      const jIdStr = j._id.toString();

      const tglJadwal = timeHelper.getTglJakarta(j.tanggal);

      semuaSesiKelas.forEach((sesi) => {
        if (!sesi.waktuSelesai) return;

        const cocokJadwal = sesi.jadwalId
          ? (typeof sesi.jadwalId === "object" ? sesi.jadwalId.toString() : String(sesi.jadwalId)) === jIdStr
          : timeHelper.getTglJakarta(sesi.waktuMulai) === tglJadwal &&
            sesi.namaMapel?.trim() === j.mapel?.trim() &&
            sesi.siswaId?.kelas === j.kelasTarget;

        if (cocokJadwal) {
          if (sesi.konsulExtraMenit > maxExtra) maxExtra = sesi.konsulExtraMenit;
          if (sesi.konsulExtraMenit > 0) listExtraSiswaMap.set(sesi._id.toString(), sesi);
        }
      });

      extraMap[jIdStr] = maxExtra;
    });

    const kelasMapped = jadwalGuru.map((j) => {
      const tglStr = timeHelper.getTglJakarta(j.tanggal);
      return {
        ...j,
        _id: j._id.toString(),
        pengajarId: j.pengajarId ? j.pengajarId.toString() : null,
        status: j.bab ? STATUS_SESI.SELESAI.id : "BELUM",
        waktuMulai: new Date(`${tglStr}T${j.jamMulai}:00${PERIODE_BELAJAR.ISO_OFFSET}`).toISOString(),
        waktuSelesai: j.bab
          ? new Date(`${tglStr}T${j.jamSelesai}:00${PERIODE_BELAJAR.ISO_OFFSET}`).toISOString()
          : null,
        namaMapel: j.mapel,
        konsulExtraMenit: extraMap[j._id.toString()] || 0,
      };
    });

    const [sesiKonsul, absenGuru] = await Promise.all([
      StudySession.find({
        pengajarPendamping: pengajarId,
        jenisSesi: TIPE_SESI.KONSUL,
        waktuMulai: { $gte: tanggalMulai, $lte: tanggalAkhir },
        status: STATUS_SESI.SELESAI.id,
      })
        .populate("siswaId", "nama kelas")
        .sort({ waktuMulai: 1 })
        .lean(),
      AbsensiPengajar.find({
        pengajarId,
        waktuMasuk: { $gte: tanggalMulai, $lte: tanggalAkhir },
      })
        .sort({ waktuMasuk: 1 })
        .lean(),
    ]);

    return responseHelper.success("Data rapor pengajar ditarik.", {
      profil: {
        nama: pengajar.nama,
        nomorPeserta: pengajar.nomorPeserta || "-",
        kodePengajar: pengajar.kodePengajar || "-",
        pangkat: pengajar.pangkat || PANGKAT_PENGAJAR.FREELANCE,
        kelasAsuh: pengajar.kelasAsuh || [],
        kodeCabang: pengajar.kodeCabang,
      },
      kelas: serialize(kelasMapped),
      konsul: serialize(sesiKonsul),
      konsulExtraSiswa: serialize(Array.from(listExtraSiswaMap.values())),
      absen: serialize(absenGuru),
    });
  } catch (error) {
    console.error("[ERROR ambilLaporanBulananPengajar]:", error);
    return responseHelper.error("Gagal mengambil data rapor pengajar.");
  }
}

// ============================================================================
// 9. MIGRASI DATA LAMA
// ============================================================================
export async function prosesMigrasiDataLama() {
  try {
    await connectToDatabase();
    if (!(await guardSuperAdmin())) {
      return responseHelper.error("Akses Ditolak: Hanya Super Admin Pusat.");
    }

    const users = await User.find({});
    let jumlahDiperbarui = 0;

    for (const user of users) {
      const dataUpdate = {};

      if (user.nomorPeserta?.length >= 6) {
        const potongan = user.nomorPeserta.substring(0, 6);
        dataUpdate.kodeCabang = /^\d{6}$/.test(potongan) ? potongan : "010101";
      }

      if (user.peran === PERAN.PENGAJAR.id && !user.pangkat) {
        dataUpdate.pangkat = PANGKAT_PENGAJAR.FREELANCE;
        dataUpdate.kelasAsuh = [];
      }

      if (Object.keys(dataUpdate).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: dataUpdate });
        jumlahDiperbarui++;
      }
    }

    return responseHelper.success(`Selesai! ${jumlahDiperbarui} akun berhasil disinkronisasi.`);
  } catch (error) {
    console.error("[ERROR MIGRASI]:", error);
    return responseHelper.error("Gagal melakukan migrasi data.");
  }
}