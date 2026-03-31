"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import Jadwal from "../models/Jadwal";
import StudySession from "../models/StudySession"; 
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { timeHelper } from "../utils/timeHelper";  
import { 
  PERAN, 
  STATUS_USER, 
  KONFIGURASI_MEDIA, 
  PESAN_SISTEM,
  TIPE_SESI,       
  LABEL_SISTEM,    
  STATUS_SESI,
  KONFIGURASI_SISTEM
} from "../utils/constants";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

/**
 * Memastikan user memiliki otoritas sebelum melanjutkan aksi
 */
async function pastikanOtoritas(roleWajib = [PERAN.PENGAJAR.id, PERAN.ADMIN.id]) {
  const { userId, peran } = await authHelper.ambilSesi();
  if (!userId || !roleWajib.includes(peran)) return null;
  return { userId, peran };
}

/**
 * Validasi apakah URL berasal dari domain Cloudinary resmi
 */
function isValidCloudinary(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes(KONFIGURASI_MEDIA.DOMAIN_RESMI); 
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 2. TEACHER ACTIONS (JURNAL, DOKUMENTASI, ABSENSI & NILAI)
// ============================================================================

/**
 * Mengambil detail jurnal untuk ditampilkan di modal pengajar
 */
export async function ambilDetailJurnalPengajar(idJadwal) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) return responseHelper.error("ID Jadwal tidak valid.");

    await connectToDatabase();
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const jadwal = await Jadwal.findById(idJadwal).lean();
    if (!jadwal) return responseHelper.error("Jadwal tidak ditemukan.");

    if (auth.peran !== PERAN.ADMIN.id && jadwal.pengajarId?.toString() !== auth.userId) {
       return responseHelper.error("Akses Ditolak: Ini bukan kelas Anda.");
    }

    const { awal, akhir } = timeHelper.getRentangHari(jadwal.tanggal);
    
    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find({ 
        peran: PERAN.SISWA.id, 
        kelas: jadwal.kelasTarget, 
        status: STATUS_USER.AKTIF 
      }).select("nama nomorPeserta").sort({ nama: 1 }).lean(),
      StudySession.find({
        jenisSesi: TIPE_SESI.KELAS,
        namaMapel: jadwal.mapel,
        waktuMulai: { $gte: awal, $lte: akhir }
      }).lean()
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
        siswaId: siswa._id.toString(),
        nama: siswa.nama,
        nomorPeserta: siswa.nomorPeserta,
        sesiId: sesi ? sesi._id.toString() : null,
        statusAbsen: baseStatus,
        catatan: ekstrakCatatan,
        nilaiTest: sesi ? sesi.nilaiTest ?? "" : ""
      };
    });

    return responseHelper.success("Detail jurnal dimuat.", {
      jadwal: serialize(jadwal),
      dataSiswa: dataSiswaJurnal
    });
  } catch (error) {
    console.error("[ERROR ambilDetailJurnalPengajar]:", error);
    return responseHelper.error("Gagal mengambil detail jurnal kelas.");
  }
}

/**
 * Menyimpan data Jurnal (Materi & Foto) serta Absensi massal
 */
export async function simpanJurnalPengajar(idJadwal, dataJurnal, arrayNilaiSiswa = []) {
  try {
    if (!mongoose.Types.ObjectId.isValid(idJadwal)) return responseHelper.error("ID Jadwal tidak valid.");

    await connectToDatabase();
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const babClean = validationHelper.sanitize(dataJurnal.bab);
    if (!babClean) return responseHelper.error("Materi (Bab) wajib diisi!");

    const rawLinks = Array.isArray(dataJurnal.galeriPapan) 
      ? dataJurnal.galeriPapan 
      : (dataJurnal.galeriPapan || "").split(",").filter(Boolean);

    const galeriBersih = [...new Set(
      rawLinks.map(link => link.trim()).filter(link => isValidCloudinary(link))
    )];

    const query = { _id: idJadwal };
    if (auth.peran !== PERAN.ADMIN.id) query.pengajarId = auth.userId; 

    // 1. Update data Jadwal (Jurnal)
    const updateJadwal = await Jadwal.findOneAndUpdate(
      query,
      {
        $set: {
          bab: babClean,
          subBab: validationHelper.sanitize(dataJurnal.subBab),
          galeriPapan: galeriBersih,
          fotoBersama: isValidCloudinary(dataJurnal.fotoBersama) ? dataJurnal.fotoBersama : "",
          jurnalTerakhirUpdate: new Date()
        }
      },
      { new: true }
    );

    if (!updateJadwal) return responseHelper.error("Jadwal tidak ditemukan atau akses ditolak.");

    // 2. Proses Absensi Masal (BulkWrite)
    // 🚀 LOGIKA BARU: Jangan pernah menimpa waktuSelesai yang sudah dicatat oleh Scanner!
    if (arrayNilaiSiswa.length > 0) {
      const { awal, akhir } = timeHelper.getRentangHari(updateJadwal.tanggal);
      
      const ops = arrayNilaiSiswa
        .filter(item => item.statusAbsen !== LABEL_SISTEM.BELUM_ABSEN) 
        .map(item => {
          const statusFinal = item.catatan?.trim() 
            ? `${item.statusAbsen} (${item.catatan.trim()})`.toLowerCase() 
            : item.statusAbsen.toLowerCase();

          return {
            updateOne: {
              filter: {
                siswaId: item.siswaId,
                jenisSesi: TIPE_SESI.KELAS,
                namaMapel: updateJadwal.mapel,
                waktuMulai: { $gte: awal, $lte: akhir }
              },
              update: {
                // $set digunakan untuk mengubah status dan nilai saja (Tanpa menyentuh waktuSelesai/Mulai)
                $set: {
                  status: statusFinal,
                  nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest)
                },
                // $setOnInsert HANYA dieksekusi jika data sesi ini belum pernah ada di database
                // (Kasus di mana siswa tidak pernah scan, tapi diabsen manual oleh pengajar)
                $setOnInsert: {
                  waktuMulai: awal,
                  waktuSelesai: awal, // Kasih waktu default agar tidak error di laporan admin
                  terlambatMenit: 0
                }
              },
              upsert: true // Izinkan upsert untuk mengakomodasi anak yang lupa absen tapi diabsen manual guru
            }
          };
        });

      if (ops.length > 0) {
        await StudySession.bulkWrite(ops);
      }
    }

    revalidatePath(PERAN.PENGAJAR.home); 
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("✅ Jurnal Kelas & Absensi Siswa Berhasil Disimpan.");

  } catch (error) {
    console.error("[ERROR simpanJurnalPengajar]:", error);
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

// ============================================================================
// 3. ADMIN ACTIONS (MANAGEMENT PENGAJAR)
// ============================================================================

export async function ambilSemuaPengajar() {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const pengajar = await User.find({ peran: PERAN.PENGAJAR.id }).sort({ nama: 1 }).lean();
    return responseHelper.success("Data pengajar dimuat.", serialize(pengajar));
  } catch (error) {
    return responseHelper.error("Gagal memuat data pengajar.");
  }
}

export async function tambahPengajarBaru(formData) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const username = validationHelper.sanitize(formData.username).toLowerCase();
    const kodePengajar = validationHelper.sanitize(formData.kodePengajar).toUpperCase();

    const exist = await User.findOne({ 
      $or: [{ username }, { kodePengajar }] 
    }).select("_id").lean();
    
    if (exist) return responseHelper.error("Username/Kode sudah terdaftar.");

    const hashed = await authHelper.buatHash(formData.password || KONFIGURASI_SISTEM.DEFAULT_PASSWORD);

    await User.create({
      ...formData,
      username,
      kodePengajar,
      password: hashed,
      peran: PERAN.PENGAJAR.id,
      status: STATUS_USER.AKTIF
    });

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

    await User.findByIdAndDelete(idPengajar);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Pengajar dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal hapus pengajar.");
  }
}

export async function editPengajar(idPengajar, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const dataUpdate = { ...dataBaru };
    
    if (dataBaru.password?.trim()) {
      dataUpdate.password = await authHelper.buatHash(dataBaru.password);
    } else {
      delete dataUpdate.password;
    }

    if (dataUpdate.username) {
      dataUpdate.username = validationHelper.sanitize(dataUpdate.username).toLowerCase();
    }
    
    if (dataUpdate.kodePengajar) {
      dataUpdate.kodePengajar = validationHelper.sanitize(dataUpdate.kodePengajar).toUpperCase();
    }

    await User.findByIdAndUpdate(idPengajar, dataUpdate);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Data pengajar berhasil diperbarui.");
  } catch (error) {
    return responseHelper.error("Gagal mengupdate pengajar.", error);
  }
}

export async function prosesBulkTambahPengajar(dataArray) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    let suksesCount = 0;
    let laporan = [];

    for (let [index, item] of dataArray.entries()) {
      try {
        if (!item.nama || !item.kodePengajar) {
          laporan.push(`Baris ${index + 1}: Nama & Kode Pengajar wajib diisi.`);
          continue;
        }

        const usernameTarget = item.username || item.kodePengajar;
        const username = validationHelper.sanitize(usernameTarget).toLowerCase();
        const kodePengajar = validationHelper.sanitize(item.kodePengajar).toUpperCase();

        const exist = await User.findOne({ 
          $or: [{ username }, { kodePengajar }] 
        }).select("_id").lean();
        
        if (exist) {
          laporan.push(`Baris ${index + 1} (${item.nama}): Username '${username}' atau Kode '${kodePengajar}' sudah dipakai.`);
          continue;
        }

        const pwd = item.password || KONFIGURASI_SISTEM.DEFAULT_PASSWORD;
        const hashed = await authHelper.buatHash(pwd);

        await User.create({
          nama: item.nama,
          nomorPeserta: item.nomorPeserta || "",
          username,
          kodePengajar,
          noHp: item.noHp || "",
          password: hashed,
          peran: PERAN.PENGAJAR.id,
          status: STATUS_USER.AKTIF
        });

        suksesCount++;
      } catch (err) {
        laporan.push(`Baris ${index + 1} (${item.nama}): Gagal menyimpan (${err.message}).`);
      }
    }

    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success(
      `Selesai: ${suksesCount} berhasil terdaftar, ${laporan.length} gagal.`, 
      { laporan }
    );
  } catch (error) {
    return responseHelper.error("Gagal melakukan upload massal.", error);
  }
}