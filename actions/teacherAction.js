"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import Jadwal from "../models/Jadwal";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { 
  PERAN, 
  STATUS_USER, 
  KONFIGURASI_MEDIA, 
  KONFIGURASI_SISTEM, 
  PESAN_SISTEM 
} from "../utils/constants";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

async function pastikanOtoritas(roleWajib = [PERAN.PENGAJAR.id, PERAN.ADMIN.id]) {
  const { userId, peran } = await authHelper.ambilSesi();
  if (!userId || !roleWajib.includes(peran)) return null;
  return { userId, peran };
}

function isValidCloudinary(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes(KONFIGURASI_MEDIA.DOMAIN_RESMI); // 👈 Ambil dari konstanta
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 2. TEACHER ACTIONS (JURNAL & DOKUMENTASI)
// ============================================================================

export async function simpanJurnalGuru(idJadwal, dataJurnal) {
  try {
    await connectToDatabase();
    
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const babClean = validationHelper.sanitize(dataJurnal.bab);
    if (!babClean) return responseHelper.error("Materi (Bab) wajib diisi!");

    const rawLinks = Array.isArray(dataJurnal.galeriPapan) 
      ? dataJurnal.galeriPapan 
      : (dataJurnal.galeriPapan || "").split(",").filter(Boolean);

    const galeriBersih = [...new Set(
      rawLinks
        .map(link => link.trim())
        .filter(link => isValidCloudinary(link))
    )];

    const query = { _id: idJadwal };
    if (auth.peran !== PERAN.ADMIN.id) {
      query.pengajarId = auth.userId; 
    }

    const update = await Jadwal.findOneAndUpdate(
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

    if (!update) return responseHelper.error("Jadwal tidak ditemukan.");

    revalidatePath(PERAN.PENGAJAR.home); 
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("✅ Jurnal & Dokumentasi Disimpan.");

  } catch (error) {
    return responseHelper.error(PESAN_SISTEM.GAGAL_SIMPAN);
  }
}

// ============================================================================
// 3. ADMIN ACTIONS (MANAGEMENT PENGAJAR)
// ============================================================================

export async function ambilSemuaGuru() {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const pengajar = await User.find({ peran: PERAN.PENGAJAR.id }).sort({ nama: 1 }).lean();
    return responseHelper.success("Data pengajar dimuat.", serialize(pengajar));
  } catch (error) {
    return responseHelper.error("Gagal memuat data pengajar.");
  }
}

export async function tambahGuruBaru(formData) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    const username = validationHelper.sanitize(formData.username).toLowerCase();
    const kodePengajar = validationHelper.sanitize(formData.kodePengajar).toUpperCase();

    const exist = await User.findOne({ 
      $or: [{ username }, { kodePengajar }] 
    }).select("_id").lean();
    
    if (exist) return responseHelper.error("Username/Kode sudah terdaftar.");

    // Gunakan password default dari konstanta
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

export async function hapusGuru(idGuru) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas([PERAN.ADMIN.id]))) return responseHelper.error(PESAN_SISTEM.AKSES_DITOLAK);

    await User.findByIdAndDelete(idGuru);
    revalidatePath(PERAN.ADMIN.home);
    return responseHelper.success("Pengajar dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal hapus pengajar.");
  }
}