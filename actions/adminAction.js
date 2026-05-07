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
  PERIODE_BELAJAR,
  CABANG_QUANTUM, 
  PANGKAT_PENGAJAR,
  KONFIGURASI_SISTEM 
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 0. INTERNAL HELPERS
// ============================================================================

// 🟢 Gerbang Level 1: Untuk MELIHAT data (Admin, Kakak Asuh, Staff Akademik)
async function pastikanAdmin() {
  const sesi = await authHelper.ambilSesi();
  if (!sesi || !sesi.userId) return false;
  if (sesi.peran === PERAN.ADMIN.id) return true;
  if (sesi.peran === PERAN.PENGAJAR.id && (sesi.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH || sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK)) return true;
  return false;
}

// 🟠 Gerbang Level 2: Untuk MENGUBAH data (Admin, Staff Akademik) - KAKAK ASUH DIBLOKIR!
async function pastikanAdminBisaEdit() {
  const sesi = await authHelper.ambilSesi();
  if (!sesi || !sesi.userId) return false;
  if (sesi.peran === PERAN.ADMIN.id) return true;
  if (sesi.peran === PERAN.PENGAJAR.id && sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK) return true;
  return false;
}

// 🔴 Gerbang Level 3: Khusus Super Admin Pusat
async function pastikanSuperAdmin() {
  const sesi = await authHelper.ambilSesi();
  if (!sesi || !sesi.userId) return false;
  return sesi.peran === PERAN.ADMIN.id && sesi.kodeCabang === CABANG_QUANTUM.PUSAT.id;
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 1. DASHBOARD & DATA FETCHING (ISOLASI CABANG + WAKTU FULL SEMESTER)
// ============================================================================
export async function ambilDataDashboard() {
  try {
    await connectToDatabase();
    
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await authHelper.ambilSesi();
    const adminYgLogin = await User.findById(sesi.userId).select("kodeCabang pangkat kelasAsuh").lean();
    if (!adminYgLogin) return responseHelper.error("User tidak ditemukan.");

    const mulai = new Date(`${PERIODE_BELAJAR.MULAI}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
    const akhir = new Date(`${PERIODE_BELAJAR.AKHIR}T23:59:59${PERIODE_BELAJAR.ISO_OFFSET}`);

    let querySiswa = { peran: PERAN.SISWA.id };

    if (adminYgLogin.kodeCabang && adminYgLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      querySiswa.kodeCabang = adminYgLogin.kodeCabang;
    }

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

    const arrayIdSiswaObj = siswa.map(s => s._id); 
    const arrayIdSiswaStr = siswa.map(s => s._id.toString());
    const arrayPencarianAman = [...arrayIdSiswaObj, ...arrayIdSiswaStr];

    const riwayat = await StudySession.find({ 
      waktuMulai: { $gte: mulai, $lte: akhir },
      siswaId: { $in: arrayPencarianAman } 
    })
      .select("_id siswaId jenisSesi namaMapel waktuMulai waktuSelesai status terlambatMenit konsulExtraMenit jadwalId tanggalAsli")
      .populate("siswaId", "nama username nomorPeserta kelas status") 
      .sort({ waktuMulai: -1 })
      .lean();

    const riwayatBersih = riwayat
      .filter(r => r.siswaId !== null)
      .map(r => ({
        ...r,
        _id: r._id.toString(),
        siswaId: typeof r.siswaId === "object" 
          ? { ...r.siswaId, _id: r.siswaId._id.toString() } 
          : r.siswaId.toString(),
        jadwalId: r.jadwalId ? r.jadwalId.toString() : null
      }));

    const siswaBersih = siswa.map(s => ({ ...s, _id: s._id.toString() }));

    return responseHelper.success("Data dashboard dimuat.", { riwayat: riwayatBersih, siswa: siswaBersih });

  } catch (error) {
    console.error("[CRITICAL ERROR Dashboard]:", error);
    return responseHelper.error(`Gagal memuat dashboard: ${error.message}`);
  }
}

// ============================================================================
// 2. MANAJEMEN STAF (ABSENSI)
// ============================================================================
export async function ambilAbsensiPengajar() {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await authHelper.ambilSesi();
    const mulai = new Date(`${PERIODE_BELAJAR.MULAI}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
    const akhir = new Date(`${PERIODE_BELAJAR.AKHIR}T23:59:59${PERIODE_BELAJAR.ISO_OFFSET}`);

    const filterCabangStaf = (sesi.kodeCabang && sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) 
      ? { kodeCabang: sesi.kodeCabang } 
      : {};

    const data = await AbsensiPengajar.find({ waktuMasuk: { $gte: mulai, $lte: akhir } })
      .select("_id pengajarId waktuMasuk waktuKeluar status")
      .populate({
        path: "pengajarId",
        select: "nama kodePengajar",
        match: filterCabangStaf 
      }) 
      .sort({ waktuMasuk: -1 })
      .lean();

    const dataBersih = data.filter(d => d.pengajarId !== null);

    return responseHelper.success("Data absen staf dimuat.", serialize(dataBersih));
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

    const sesi = await authHelper.ambilSesi();
    
    // PERTAHANKAN FILTER WAKTU (Bug 1 Aman)
    let queryJadwal = {
      tanggal: { $gte: PERIODE_BELAJAR.MULAI, $lte: PERIODE_BELAJAR.AKHIR }
    };

    const adminYgLogin = await User.findById(sesi.userId).select("kodeCabang pangkat kelasAsuh").lean();
    if (!adminYgLogin) return responseHelper.error("User tidak ditemukan.");

    if (adminYgLogin.kodeCabang && adminYgLogin.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const guruSekota = await User.find({ 
        kodeCabang: adminYgLogin.kodeCabang, 
        peran: PERAN.PENGAJAR.id 
      }).select("_id").lean();
      
      const daftarIdGuru = guruSekota.map(g => g._id);
      queryJadwal.pengajarId = { $in: daftarIdGuru };
    }

    if (adminYgLogin.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH && Array.isArray(adminYgLogin.kelasAsuh) && adminYgLogin.kelasAsuh.length > 0) {
      queryJadwal.kelasTarget = { $in: adminYgLogin.kelasAsuh };
    }

    const jadwal = await Jadwal.find(queryJadwal)
      .populate("pengajarId", "nama kodePengajar kodeCabang") 
      .lean();

    const dataAman = jadwal.map(j => ({
      ...j,
      _id: j._id.toString(),
      pengajarId: j.pengajarId ? {
        _id: j.pengajarId._id.toString(),
        nama: j.pengajarId.nama,
        kodePengajar: j.pengajarId.kodePengajar,
        kodeCabang: j.pengajarId.kodeCabang
      } : null
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
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const sesi = await authHelper.ambilSesi();
    const filterCabang = (sesi.kodeCabang && sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) ? { kodeCabang: sesi.kodeCabang } : {};

    const pengajar = await User.find({ peran: PERAN.PENGAJAR.id, ...filterCabang })
      .select("_id nama username nomorPeserta kodePengajar noHp pangkat status createdAt kodeCabang")
      .sort({ nama: 1 })
      .lean();

    return responseHelper.success("Data pengajar dimuat.", serialize(pengajar));
  } catch (error) {
    return responseHelper.error("Gagal mengambil data pengajar.", error.message);
  }
}

export async function tambahJadwal(dataForm) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak: Anda tidak memiliki otoritas.");
    const sesi = await authHelper.ambilSesi();

    const kodeCari = dataForm.pengajar?.trim();
    
    let queryPengajar = { 
      peran: PERAN.PENGAJAR.id, 
      kodePengajar: { $regex: new RegExp(`^${kodeCari}$`, "i") } 
    };
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      queryPengajar.kodeCabang = sesi.kodeCabang;
    }

    const pengajarObj = await User.findOne(queryPengajar).select("_id nama kodePengajar").lean(); 
    if (!pengajarObj) return responseHelper.error(`Kode "${kodeCari}" tidak ditemukan di cabang Anda!`);

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
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak: Anda tidak memiliki otoritas.");
    const sesi = await authHelper.ambilSesi();

    // FIX KEAMANAN (IDOR): Pastikan jadwal yg diedit milik cabang sendiri
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetJadwal = await Jadwal.findById(id).populate("pengajarId", "kodeCabang").lean();
      if (!targetJadwal) return responseHelper.error("Jadwal tidak ditemukan.");
      if (targetJadwal.pengajarId?.kodeCabang !== sesi.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Mencoba mengedit jadwal lintas cabang (IDOR Terdeteksi).");
      }
    }

    let payloadUpdate = { ...dataBaru };
    if (dataBaru.pengajar) {
      let queryPengajar = { 
        peran: PERAN.PENGAJAR.id,
        $or: [{ kodePengajar: dataBaru.pengajar }, { nama: dataBaru.pengajar }]
      };
      if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) queryPengajar.kodeCabang = sesi.kodeCabang;

      const pengajarObj = await User.findOne(queryPengajar).select("_id nama kodePengajar").lean();
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
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak: Anda tidak memiliki otoritas.");
    const sesi = await authHelper.ambilSesi();

    // FIX KEAMANAN (IDOR): Pastikan jadwal yg dihapus milik cabang sendiri
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetJadwal = await Jadwal.findById(idJadwal).populate("pengajarId", "kodeCabang").lean();
      if (!targetJadwal) return responseHelper.error("Jadwal tidak ditemukan.");
      if (targetJadwal.pengajarId?.kodeCabang !== sesi.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Mencoba menghapus jadwal lintas cabang (IDOR Terdeteksi).");
      }
    }

    await Jadwal.deleteOne({ _id: idJadwal });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Jadwal dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal menghapus jadwal.", error);
  }
}

// ============================================================================
// 4. MANAJEMEN AKUN USER (DILARANG UNTUK KAKAK ASUH)
// ============================================================================
export async function editAkunSiswa(idSiswa, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await authHelper.ambilSesi();

    // FIX KEAMANAN (IDOR): Mencegah edit akun siswa cabang lain
    let queryFilter = { _id: idSiswa };
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      queryFilter.kodeCabang = sesi.kodeCabang;
    }

    const dataUpdate = { ...dataBaru };
    if (dataBaru.password?.trim()) {
      dataUpdate.password = await authHelper.buatHash(dataBaru.password);
    } else {
      delete dataUpdate.password;
    }

    if (dataUpdate.username) dataUpdate.username = validationHelper.sanitize(dataUpdate.username).toLowerCase();

    const hasil = await User.updateOne(queryFilter, { $set: dataUpdate });
    
    if (hasil.matchedCount === 0) {
      return responseHelper.error("Gagal! Siswa tidak ditemukan atau berasal dari cabang lain.");
    }

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Data berhasil diperbarui.");
  } catch (error) {
    return responseHelper.error("Gagal update user.", error);
  }
}

export async function hapusAkunSiswa(idSiswa) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await authHelper.ambilSesi();

    // FIX KEAMANAN (IDOR): Mencegah penghapusan akun siswa cabang lain
    let queryFilter = { _id: idSiswa };
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      queryFilter.kodeCabang = sesi.kodeCabang;
    }

    const hasil = await User.deleteOne(queryFilter);
    
    if (hasil.deletedCount === 0) {
      return responseHelper.error("Gagal! Siswa tidak ditemukan atau berasal dari cabang lain.");
    }

    // Jika berhasil dihapus, hapus juga riwayat sesinya
    await StudySession.deleteMany({ siswaId: idSiswa });

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
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await authHelper.ambilSesi();

    // FIX KEAMANAN (IDOR): Validasi siswa
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const validasiSiswa = await User.findOne({ _id: data.siswaId, kodeCabang: sesi.kodeCabang });
      if (!validasiSiswa) return responseHelper.error("Akses Ditolak: Siswa bukan dari cabang Anda.");
    }

    const { awal } = timeHelper.getRentangHari(data.tanggal);
    const statusFinal = data.catatan ? `${data.keterangan} (${data.catatan})`.toLowerCase() : data.keterangan.toLowerCase();

    await StudySession.updateOne(
      { siswaId: data.siswaId, jenisSesi: TIPE_SESI.KELAS, namaMapel: data.mapel, waktuMulai: { $gte: awal } },
      {
        $set: { status: statusFinal, waktuSelesai: awal },
        $setOnInsert: { siswaId: data.siswaId, jenisSesi: TIPE_SESI.KELAS, namaMapel: data.mapel, waktuMulai: awal, terlambatMenit: 0 }
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
    const sesi = await authHelper.ambilSesi();

    const jadwal = await Jadwal.findById(idJadwal).populate("pengajarId", "kodeCabang").lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    let querySiswa = { peran: PERAN.SISWA.id, kelas: jadwal.kelasTarget, status: STATUS_USER.AKTIF };

    if (jadwal.pengajarId && jadwal.pengajarId.kodeCabang) {
      querySiswa.kodeCabang = jadwal.pengajarId.kodeCabang;
    } else if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      querySiswa.kodeCabang = sesi.kodeCabang;
    }

    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find(querySiswa).select("_id nama nomorPeserta").sort({ nama: 1 }).lean(),
      StudySession.find({ jenisSesi: TIPE_SESI.KELAS, namaMapel: jadwal.mapel, waktuMulai: { $gte: awal, $lte: akhir } })
        .select("_id siswaId status waktuMulai waktuSelesai terlambatMenit konsulExtraMenit nilaiTest").lean()
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
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await authHelper.ambilSesi();

    // FIX KEAMANAN (IDOR):
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const targetJadwal = await Jadwal.findById(idJadwal).populate("pengajarId", "kodeCabang").lean();
      if (!targetJadwal || targetJadwal.pengajarId?.kodeCabang !== sesi.kodeCabang) {
        return responseHelper.error("Akses Ditolak: Anda tidak dapat menyimpan jurnal cabang lain.");
      }
    }

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

export async function paksaHentikanSesi(idSesi, durasiPilihan) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak.");
    const sesiUser = await authHelper.ambilSesi();

    const sesiMongoose = await StudySession.findById(idSesi).populate("siswaId", "kodeCabang").lean();
    if (!sesiMongoose) return responseHelper.error("Sesi tidak ditemukan.");

    // FIX KEAMANAN (IDOR):
    if (sesiUser.kodeCabang !== CABANG_QUANTUM.PUSAT.id && sesiMongoose.siswaId?.kodeCabang !== sesiUser.kodeCabang) {
       return responseHelper.error("Akses Ditolak: Sesi ini milik siswa dari cabang lain.");
    }

    const waktuMulaiObj = new Date(sesiMongoose.waktuMulai);
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
    return responseHelper.success(`Sesi dihentikan (${durasiPilihan === 0 ? "PINALTI" : durasiPilihan + " Menit"}).`);
  } catch (error) {
    return responseHelper.error("Gagal menghentikan sesi.", error.message);
  }
}

export async function prosesSimpanAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak.");

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
    if (!(await pastikanAdminBisaEdit())) return responseHelper.error("Akses Ditolak.");
    const sesi = await authHelper.ambilSesi();

    // FIX KEAMANAN (IDOR):
    if (sesi.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
       const targetAbsen = await AbsensiPengajar.findById(idAbsen).populate("pengajarId", "kodeCabang").lean();
       if (!targetAbsen || targetAbsen.pengajarId?.kodeCabang !== sesi.kodeCabang) {
          return responseHelper.error("Akses Ditolak: Anda tidak dapat menghapus absen staf cabang lain.");
       }
    }

    await AbsensiPengajar.deleteOne({ _id: idAbsen });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Data absensi staf dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal menghapus absensi.", error.message);
  }
}

// ============================================================================
// 6. LAPORAN BULANAN SISWA (RAPOR)
// ============================================================================
export async function ambilLaporanBulananSiswa(siswaId, bulan, tahun) {
  try {
    await connectToDatabase();
    if (!(await pastikanAdmin())) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK); 

    const siswa = await User.findById(siswaId)
      .select("nama nomorPeserta kelas jadwalKelas jamKelas totalExp koleksiLencana")
      .lean();
      
    if (!siswa) return responseHelper.error("Siswa tidak ditemukan.");

    const tanggalMulai = new Date(tahun, bulan - 1, 1);
    const tanggalAkhir = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    const sesiBulanan = await StudySession.find({
      siswaId: siswaId,
      waktuMulai: { $gte: tanggalMulai, $lte: tanggalAkhir },
      status: { $nin: [STATUS_SESI.BERJALAN.id] } 
    }).sort({ waktuMulai: 1 }).lean();

    const sesiKelas = sesiBulanan.filter(s => s.jenisSesi === TIPE_SESI.KELAS);
    const sesiKonsul = sesiBulanan.filter(s => s.jenisSesi === TIPE_SESI.KONSUL);

    const dataRapor = {
      profil: {
        nama: siswa.nama,
        nomorPeserta: siswa.nomorPeserta,
        kelas: siswa.kelas,
        jadwalKelas: siswa.jadwalKelas,
        jamKelas: siswa.jamKelas,
        totalExp: siswa.totalExp || 0,
        jumlahLencana: siswa.koleksiLencana?.length || 0
      },
      kelas: serialize(sesiKelas),
      konsul: serialize(sesiKonsul)
    };

    return responseHelper.success("Data rapor berhasil ditarik.", dataRapor);
  } catch (error) {
    return responseHelper.error("Gagal mengambil data rapor.", error.message);
  }
}

// ============================================================================
// 7. MANAJEMEN AKUN ADMIN CABANG (HANYA SUPER ADMIN)
// ============================================================================
export async function ambilSemuaAdmin() {
  try {
    await connectToDatabase();
    if (!(await pastikanSuperAdmin())) return responseHelper.error("Akses Ditolak: Hanya Super Admin.");
    
    const admins = await User.find({ peran: PERAN.ADMIN.id })
      .select("_id nama username noHp kodeCabang peran status")
      .sort({ kodeCabang: 1, nama: 1 })
      .lean();
    
    return responseHelper.success("Data admin ditarik", serialize(admins));
  } catch (err) { 
    return responseHelper.error("Gagal menarik data admin.", err); 
  }
}

export async function simpanAkunAdmin(idEdit, payload) {
  try {
    await connectToDatabase();
    if (!(await pastikanSuperAdmin())) return responseHelper.error("Akses Ditolak: Hanya Super Admin.");
    
    const dataSimpan = {
      nama: payload.nama,
      username: payload.username.trim().toLowerCase(), 
      noHp: payload.noHp,
      peran: PERAN.ADMIN.id, 
      kodeCabang: payload.kodeCabang,
      status: payload.status
    };
    
    if (payload.password) {
      dataSimpan.password = await authHelper.buatHash(payload.password);
    }
    
    if (idEdit) {
      const duplikat = await User.findOne({ username: dataSimpan.username, _id: { $ne: idEdit } });
      if (duplikat) return responseHelper.error("Username sudah dipakai oleh akun lain!");

      await User.updateOne({ _id: idEdit }, { $set: dataSimpan });
      revalidatePath(PERAN.ADMIN.home);
      return responseHelper.success("Admin berhasil diperbarui!");
    } else {
      const cekDuplikat = await User.exists({ username: dataSimpan.username });
      if (cekDuplikat) return responseHelper.error("Username sudah digunakan! Silakan gunakan username lain.");

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      dataSimpan.nomorPeserta = `${payload.kodeCabang}_ADMIN_${randomSuffix}`;
      
      if (!dataSimpan.password) {
         dataSimpan.password = await authHelper.buatHash(payload.noHp || KONFIGURASI_SISTEM.DEFAULT_PASSWORD);
      }
      
      await User.create(dataSimpan);
      revalidatePath(PERAN.ADMIN.home);
      return responseHelper.success("Akun Admin baru berhasil ditambahkan!");
    }
  } catch (error) {
    console.error("[CRITICAL ERROR SIMPAN ADMIN]:", error);
    return responseHelper.error(`Gagal menyimpan: ${error.message}`);
  }
}

export async function hapusAkunAdmin(id) {
  try {
    await connectToDatabase();
    if (!(await pastikanSuperAdmin())) return responseHelper.error("Akses Ditolak: Hanya Super Admin.");
    
    await User.deleteOne({ _id: id });
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Akses admin berhasil dicabut (dihapus).");
  } catch (err) { 
    return responseHelper.error("Gagal menghapus admin.", err); 
  }
}

// ============================================================================
// 🚨 SKRIP MIGRASI DATA LAMA (SATU KALI PAKAI)
// ============================================================================
export async function prosesMigrasiDataLama() {
  try {
    await connectToDatabase();
    if (!(await pastikanSuperAdmin())) return responseHelper.error("Akses Ditolak: Hanya Super Admin Pusat yang boleh melakukan Sinkronisasi.");

    const users = await User.find({});
    let jumlahDiperbarui = 0;

    for (const user of users) {
      let butuhUpdate = false;
      const dataUpdate = {};

      if (user.nomorPeserta && user.nomorPeserta.length >= 6) {
        const potonganCabang = user.nomorPeserta.substring(0, 6);
        if (/^\d{6}$/.test(potonganCabang)) {
          dataUpdate.kodeCabang = potonganCabang;
          butuhUpdate = true;
        } else if (!user.kodeCabang) {
          dataUpdate.kodeCabang = "010101"; 
          butuhUpdate = true;
        }
      }

      if (user.peran === PERAN.PENGAJAR.id && !user.pangkat) {
        dataUpdate.pangkat = PANGKAT_PENGAJAR.FREELANCE;
        dataUpdate.kelasAsuh = [];
        butuhUpdate = true;
      }

      if (butuhUpdate) {
        await User.updateOne({ _id: user._id }, { $set: dataUpdate });
        jumlahDiperbarui++;
      }
    }

    return responseHelper.success(`Selesai! ${jumlahDiperbarui} akun berhasil disinkronisasi.`);
  } catch (error) {
    console.error("[ERROR MIGRASI]:", error);
    return responseHelper.error("Gagal melakukan migrasi data.", error.message);
  }
}