"use server";

import connectToDatabase from "../lib/db";
import LatihanSoal from "../models/LatihanSoal";
import User from "../models/User";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM, PERAN, PESAN_SISTEM, CABANG_QUANTUM, PANGKAT_PENGAJAR } from "../utils/constants"; 
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

async function getIdentitasValid() {
  const cookieStore = await cookies();
  const karcis = cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  if (!karcis) return null;
  return await User.findById(karcis).select("peran nama _id kodeCabang pangkat").lean(); 
}

export async function dapatkanLatihanSiswa(username, kelasSiswa, kodeCabangSiswa) {
  noStore(); 
  try {
    await connectToDatabase();
    
    let queryLatihan = {
      isAktif: true,
      $or: [{ tipeTarget: "SISWA", target: username }, { tipeTarget: "KELAS", target: kelasSiswa }]
    };

    if (kodeCabangSiswa && kodeCabangSiswa !== CABANG_QUANTUM.PUSAT.id) {
      const guruCabang = await User.find({ kodeCabang: kodeCabangSiswa }).select("_id").lean();
      const daftarIdGuru = guruCabang.map(g => String(g._id)); 
      
      queryLatihan.pembuatId = { $in: daftarIdGuru };
    }

    const latihan = await LatihanSoal.find(queryLatihan)
      .select("judul mapel tipeTarget target isAktif linkSoal url createdAt namaPembuat") 
      .sort({ createdAt: -1 })
      .lean();

    if (!latihan || latihan.length === 0) return [];

    // TRANSLASI ID -> NAMA SISWA
    let listPencarianSiswa = [];
    latihan.forEach(item => {
      if (item.tipeTarget === "SISWA") {
        if (Array.isArray(item.target)) listPencarianSiswa.push(...item.target);
        else if (item.target) listPencarianSiswa.push(item.target);
      }
    });

    if (listPencarianSiswa.length > 0) {
      const validIds = listPencarianSiswa.filter(id => /^[a-fA-F0-9]{24}$/.test(id));
      const orQuery = [
        { username: { $in: listPencarianSiswa } },
        { nomorPeserta: { $in: listPencarianSiswa } }
      ];
      if (validIds.length > 0) orQuery.push({ _id: { $in: validIds } });

      const dataSiswa = await User.find({ peran: PERAN.SISWA.id, $or: orQuery }).select("username nomorPeserta nama").lean();
      const mapNamaSiswa = {};
      dataSiswa.forEach(s => {
        if (s.username) mapNamaSiswa[s.username] = s.nama;
        if (s.nomorPeserta) mapNamaSiswa[s.nomorPeserta] = s.nama;
        mapNamaSiswa[s._id.toString()] = s.nama;
      });

      latihan.forEach(item => {
        if (item.tipeTarget === "SISWA") {
          if (Array.isArray(item.target)) item.target = item.target.map(t => mapNamaSiswa[t] || t);
          else item.target = mapNamaSiswa[item.target] || item.target;
        }
      });
    }

    return JSON.parse(JSON.stringify(latihan));
  } catch (error) {
    return [];
  }
}

export async function ambilSemuaLatihanSoal() {
  noStore(); 
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    if (!userAsli) return { sukses: false, pesan: PESAN_SISTEM.AKSES_DITOLAK };

    let query = {};
    const isStaffAkademik = String(userAsli.peran) === String(PERAN.PENGAJAR.id) && userAsli.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK;
    const isAdmin = String(userAsli.peran) === String(PERAN.ADMIN.id);
    
    if ((isAdmin || isStaffAkademik) && userAsli.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
      const guruCabang = await User.find({ kodeCabang: userAsli.kodeCabang }).select("_id").lean();
      query.pembuatId = { $in: guruCabang.map(g => String(g._id)) };
    } else if (String(userAsli.peran) === String(PERAN.PENGAJAR.id) && !isStaffAkademik) {
      query.pembuatId = String(userAsli._id);
    }

    const data = await LatihanSoal.find(query).select("-__v").sort({ createdAt: -1 }).lean();

    // TRANSLASI ID -> NAMA SISWA
    let listPencarianSiswa = [];
    data.forEach(item => {
      if (item.tipeTarget === "SISWA") {
        if (Array.isArray(item.target)) listPencarianSiswa.push(...item.target);
        else if (item.target) listPencarianSiswa.push(item.target);
      }
    });

    if (listPencarianSiswa.length > 0) {
      const validIds = listPencarianSiswa.filter(id => /^[a-fA-F0-9]{24}$/.test(id));
      const orQuery = [
        { username: { $in: listPencarianSiswa } },
        { nomorPeserta: { $in: listPencarianSiswa } }
      ];
      if (validIds.length > 0) orQuery.push({ _id: { $in: validIds } });

      const dataSiswa = await User.find({ peran: PERAN.SISWA.id, $or: orQuery }).select("username nomorPeserta nama").lean();
      const mapNamaSiswa = {};
      dataSiswa.forEach(s => {
        if (s.username) mapNamaSiswa[s.username] = s.nama;
        if (s.nomorPeserta) mapNamaSiswa[s.nomorPeserta] = s.nama;
        mapNamaSiswa[s._id.toString()] = s.nama;
      });

      data.forEach(item => {
        if (item.tipeTarget === "SISWA") {
          if (Array.isArray(item.target)) item.target = item.target.map(t => mapNamaSiswa[t] || t);
          else item.target = mapNamaSiswa[item.target] || item.target;
        }
      });
    }
      
    return { sukses: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    console.error("[ERROR ambilSemuaLatihanSoal]:", error); 
    return { sukses: false, pesan: "Gagal mengambil data soal." };
  }
}

export async function prosesSimpanLatihanSoal(id, dataForm) {
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    if (!userAsli) return { sukses: false, pesan: PESAN_SISTEM.AKSES_DITOLAK };

    // 🚀 BEST PRACTICE: Selalu simpan dengan "Kak [Nama]"
    let namaKreator = `Kak ${userAsli.nama}`;
    if (String(userAsli.peran) === String(PERAN.ADMIN.id)) {
      namaKreator = "Admin Quantum";
    }

    const payload = {
      ...dataForm,
      pembuatId: String(userAsli._id), 
      namaPembuat: namaKreator
    };

    if (id) await LatihanSoal.updateOne({ _id: id }, { $set: payload });
    else await LatihanSoal.create(payload);

    revalidatePath(PERAN.ADMIN.home);
    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath("/"); 
    return { sukses: true, pesan: id ? "Latihan diupdate!" : "Latihan dikirim!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menyimpan." };
  }
}

export async function prosesHapusLatihanSoal(id) {
  try {
    await connectToDatabase();
    await LatihanSoal.deleteOne({ _id: id });
    revalidatePath(PERAN.ADMIN.home);
    revalidatePath(PERAN.PENGAJAR.home);
    revalidatePath("/");
    return { sukses: true, pesan: "Data dihapus!" };
  } catch (error) {
    return { sukses: false, pesan: "Gagal menghapus." };
  }
}

export async function ambilDaftarSiswaDropdown() {
  noStore(); 
  try {
    await connectToDatabase();
    const userAsli = await getIdentitasValid();
    let querySiswa = { peran: PERAN.SISWA.id };
    
    if (userAsli && userAsli.kodeCabang && userAsli.kodeCabang !== CABANG_QUANTUM.PUSAT.id) {
       querySiswa.kodeCabang = userAsli.kodeCabang;
    }

    const data = await User.find(querySiswa).select("nama username kelas").sort({ nama: 1 }).lean();
    return { sukses: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    return { sukses: false, data: [] };
  }
}