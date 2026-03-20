"use server";

import connectToDatabase from "../lib/db";
import User from "../models/User";
import Jadwal from "../models/Jadwal";
import { authHelper } from "../utils/authHelper";
import { responseHelper } from "../utils/responseHelper";
import { validationHelper } from "../utils/validationHelper";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

async function pastikanOtoritas(roleWajib = ["pengajar", "admin"]) {
  const { userId, peran } = await authHelper.ambilSesi();
  if (!userId || !roleWajib.includes(peran)) return null;
  return { userId, peran };
}

// Helper lokal untuk Cloudinary (Bisa dipindah ke validationHelper jika sering dipakai)
function isValidCloudinary(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes("res.cloudinary.com");
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

// ============================================================================
// 2. TEACHER ACTIONS (JURNAL & DOKUMENTASI)
// ============================================================================

export async function simpanJurnalGuru(idJadwal, dataJurnal) {
  try {
    await connectToDatabase();
    
    const auth = await pastikanOtoritas();
    if (!auth) return responseHelper.error("Sesi berakhir atau akses ditolak.");

    const babClean = validationHelper.sanitize(dataJurnal.bab);
    if (!babClean) return responseHelper.error("Materi (Bab) wajib diisi!");

    // Sanitasi Galeri Papan Tulis
    const rawLinks = Array.isArray(dataJurnal.galeriPapan) 
      ? dataJurnal.galeriPapan 
      : (dataJurnal.galeriPapan || "").split(",").filter(Boolean);

    const galeriBersih = [...new Set(
      rawLinks
        .map(link => link.trim())
        .filter(link => isValidCloudinary(link))
    )];

    // Query Keamanan: Guru hanya bisa edit jadwal miliknya sendiri (ID-based)
    const query = { _id: idJadwal };
    if (auth.peran !== "admin") {
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

    if (!update) return responseHelper.error("Jadwal tidak ditemukan atau Anda tidak berhak.");

    revalidatePath("/teacher"); 
    revalidatePath("/admin/jadwal");
    return responseHelper.success("✅ Jurnal & Dokumentasi Berhasil Disimpan!");

  } catch (error) {
    return responseHelper.error("Gagal menyimpan jurnal pengajar.", error);
  }
}

// ============================================================================
// 3. ADMIN ACTIONS (MANAGEMENT PENGAJAR)
// ============================================================================

export async function ambilSemuaGuru() {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas(["admin"]))) return responseHelper.error("Akses Ilegal.");

    const guru = await User.find({ peran: "pengajar" }).sort({ nama: 1 }).lean();
    return responseHelper.success("Data pengajar dimuat.", serialize(guru));
  } catch (error) {
    return responseHelper.error("Gagal memuat data pengajar.", error);
  }
}

export async function tambahGuruBaru(formData) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas(["admin"]))) return responseHelper.error("Akses Ilegal.");

    const username = validationHelper.sanitize(formData.username).toLowerCase();
    const kodePengajar = validationHelper.sanitize(formData.kodePengajar).toUpperCase();

    // Cek Duplikat
    const exist = await User.findOne({ 
      $or: [{ username }, { kodePengajar }] 
    }).select("_id").lean();
    
    if (exist) return responseHelper.error("Username atau Kode Pengajar sudah ada!");

    // Proteksi: Hash password sebelum simpan
    const hashed = await authHelper.buatHash(formData.password || "123456");

    await User.create({
      ...formData,
      username,
      kodePengajar,
      password: hashed,
      peran: "pengajar",
      status: "aktif"
    });

    revalidatePath("/admin/pengajar");
    return responseHelper.success(`🎉 Pengajar ${formData.nama} resmi terdaftar!`);
  } catch (error) {
    return responseHelper.error("Gagal mendaftarkan pengajar baru.", error);
  }
}

export async function hapusGuru(idGuru) {
  try {
    await connectToDatabase();
    if (!(await pastikanOtoritas(["admin"]))) return responseHelper.error("Akses Ditolak.");

    await User.findByIdAndDelete(idGuru);
    revalidatePath("/admin/pengajar");
    return responseHelper.success("Data pengajar telah dihapus.");
  } catch (error) {
    return responseHelper.error("Gagal menghapus data pengajar.", error);
  }
}