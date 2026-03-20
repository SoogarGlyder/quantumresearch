"use server";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import User from "../models/User";
import StudySession from "../models/StudySession";
import Jadwal from "../models/Jadwal"; 

// ============================================================================
// 2. INTERNAL HELPERS & SECURITY
// ============================================================================
async function cekAdmin() {
  try {
    const cookieStore = await cookies();
    const karcis = cookieStore.get("karcis_quantum")?.value;
    const peran = cookieStore.get("peran_quantum")?.value;
    
    if (!karcis) return false;

    if (peran === "admin") return true;
    
    const user = await User.findById(karcis).select("peran").lean();
    return user && user.peran === "admin";
  } catch (error) {
    console.error("[SECURITY cekAdmin]:", error.message);
    return false;
  }
}

/**
 * Membuat rentang waktu 1 hari penuh (00:00 - 23:59) dalam zona waktu WIB
 */
function buatRentangHariWIB(tanggalString) {
  const awal = new Date(`${tanggalString}T00:00:00.000Z`);
  awal.setHours(awal.getHours() - 7); 
  
  const akhir = new Date(`${tanggalString}T23:59:59.999Z`);
  akhir.setHours(akhir.getHours() - 7);
  
  return { awal, akhir };
}

// ============================================================================
// 3. DASHBOARD ACTIONS
// ============================================================================
export async function ambilDataDashboard() {
  try {
    await connectToDatabase();
    
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };

    const [riwayat, siswa] = await Promise.all([
      StudySession.find()
        .populate("siswaId", "nama username nomorPeserta kelas")
        .sort({ waktuMulai: -1 }) 
        .lean(),
      User.find({ peran: "siswa" })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    return {
      sukses: true,
      riwayat: JSON.parse(JSON.stringify(riwayat)),
      siswa: JSON.parse(JSON.stringify(siswa))
    };
  } catch (error) {
    console.error("[ERROR ambilDataDashboard]:", error.message);
    return { sukses: false, riwayat: [], siswa: [] };
  }
}

// ============================================================================
// 4. MANAJEMEN SISWA ACTIONS
// ============================================================================
export async function editAkunSiswa(idSiswa, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };
    
    const cekDuplikat = await User.findOne({
      _id: { $ne: idSiswa }, 
      $or: [
        { username: dataBaru.username },
        { nomorPeserta: dataBaru.nomorPeserta },
        { noHp: dataBaru.noHp }
      ]
    }).select("_id").lean();

    if (cekDuplikat) {
      return { sukses: false, pesan: "Username, Nomor Peserta, atau No WhatsApp sudah dipakai akun lain!" };
    }

    const dataUpdate = {
      nama: dataBaru.nama,
      nomorPeserta: dataBaru.nomorPeserta, 
      username: dataBaru.username,
      noHp: dataBaru.noHp,
      kelas: dataBaru.kelas,
      jadwalKelas: dataBaru.jadwalKelas,
      jamKelas: dataBaru.jamKelas,
      status: dataBaru.status, 
    };

    if (dataBaru.password && dataBaru.password.trim() !== "") {
      dataUpdate.password = await bcrypt.hash(dataBaru.password, 10);
    }

    await User.findByIdAndUpdate(idSiswa, dataUpdate);
    return { sukses: true, pesan: "Data siswa berhasil diperbarui!" };
  } catch (error) {
    console.error("[ERROR editAkunSiswa]:", error.message);
    return { sukses: false, pesan: "Gagal menyimpan perubahan sistem." };
  }
}

export async function hapusAkunSiswa(idSiswa) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };

    await Promise.all([
      User.findByIdAndDelete(idSiswa),
      StudySession.deleteMany({ siswaId: idSiswa })
    ]);

    return { sukses: true, pesan: "Siswa & riwayat belajarnya berhasil dihapus." };
  } catch (error) {
    console.error("[ERROR hapusAkunSiswa]:", error.message);
    return { sukses: false, pesan: "Sistem gagal menghapus siswa." };
  }
}

// ============================================================================
// 5. MANAJEMEN JADWAL ACTIONS
// ============================================================================
export async function ambilSemuaJadwal() {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, data: [] };

    const jadwal = await Jadwal.find({}).sort({ tanggal: 1 }).lean();
    return { 
      sukses: true, 
      data: JSON.parse(JSON.stringify(jadwal)) 
    };
  } catch (error) {
    console.error("[ERROR ambilSemuaJadwal]:", error.message);
    return { sukses: false, data: [] };
  }
}

export async function tambahJadwal(dataForm) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };

    await Jadwal.create(dataForm);
    return { sukses: true, pesan: "Jadwal baru berhasil ditambahkan!" };
  } catch (error) {
    console.error("[ERROR tambahJadwal]:", error.message);
    return { sukses: false, pesan: "Gagal menyimpan: " + error.message };
  }
}

export async function editJadwal(id, dataBaru) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };
    
    const jadwalDiupdate = await Jadwal.findByIdAndUpdate(
      id,
      {
        pengajar: dataBaru.pengajar,
        pertemuan: dataBaru.pertemuan,
        jamMulai: dataBaru.jamMulai,
        jamSelesai: dataBaru.jamSelesai
      },
      { new: true } 
    );

    if (!jadwalDiupdate) return { sukses: false, pesan: "Jadwal tidak ditemukan." };
    return { sukses: true, pesan: "Jadwal berhasil diperbarui!" };
  } catch (error) {
    console.error("[ERROR editJadwal]:", error.message);
    return { sukses: false, pesan: "Terjadi kesalahan server saat mengedit jadwal." };
  }
}

export async function hapusJadwal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };

    await Jadwal.findByIdAndDelete(idJadwal);
    return { sukses: true, pesan: "Jadwal berhasil dihapus!" };
  } catch (error) {
    console.error("[ERROR hapusJadwal]:", error.message);
    return { sukses: false, pesan: "Sistem gagal menghapus jadwal." };
  }
}

// ============================================================================
// 6. MANAJEMEN ABSENSI & JURNAL (LMS)
// ============================================================================
export async function inputAbsenManual(data) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };
    
    if (!data.siswaId) return { sukses: false, pesan: "ID Siswa tidak ditemukan atau tidak valid." };

    const statusAkhir = data.catatan 
      ? `Tidak Hadir - ${data.keterangan} (${data.catatan})` 
      : `Tidak Hadir - ${data.keterangan}`;

    const { awal, akhir } = buatRentangHariWIB(data.tanggal);

    await StudySession.findOneAndUpdate(
      {
        siswaId: data.siswaId,
        jenisSesi: "Kelas",
        namaMapel: data.mapel,
        waktuMulai: { $gte: awal, $lte: akhir }
      },
      {
        $set: {
          status: statusAkhir,
          $setOnInsert: {
            siswaId: data.siswaId,
            jenisSesi: "Kelas",
            namaMapel: data.mapel,
            waktuMulai: awal,
            waktuSelesai: awal,
            terlambatMenit: 0,
            konsulExtraMenit: 0
          }
        }
      },
      { upsert: true, new: true }
    );

    return { sukses: true, pesan: "Keterangan absensi berhasil disimpan!" };
  } catch (error) {
    console.error("[ERROR inputAbsenManual]:", error.message);
    return { sukses: false, pesan: "Gagal memproses absensi." };
  }
}

export async function ambilDetailJurnal(idJadwal) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };

    const jadwal = await Jadwal.findById(idJadwal).lean();
    if (!jadwal) return { sukses: false, pesan: "Jadwal tidak ditemukan!" };

    const { awal, akhir } = buatRentangHariWIB(jadwal.tanggal);
    
    const [siswaKelas, sesiHariIni] = await Promise.all([
      User.find({ peran: "siswa", kelas: jadwal.kelasTarget, status: "aktif" })
        .select("nama nomorPeserta")
        .sort({ nomorPeserta: 1 })
        .lean(),
      StudySession.find({
        jenisSesi: "Kelas",
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
        statusAbsen: sesi ? sesi.status : "Belum Absen",
        nilaiTest: sesi ? sesi.nilaiTest : ""
      };
    });

    return {
      sukses: true,
      jadwal: JSON.parse(JSON.stringify(jadwal)),
      dataSiswa: JSON.parse(JSON.stringify(dataSiswaJurnal))
    };
  } catch (error) {
    console.error("[ERROR ambilDetailJurnal]:", error.message);
    return { sukses: false, pesan: "Gagal mengambil detail jurnal." };
  }
}

export async function simpanJurnal(idJadwal, dataJurnal, arrayNilaiSiswa) {
  try {
    await connectToDatabase();
    if (!(await cekAdmin())) return { sukses: false, pesan: "Akses Ditolak!" };

    const updateJadwalPromise = Jadwal.findByIdAndUpdate(idJadwal, {
      bab: dataJurnal.bab,
      subBab: dataJurnal.subBab,
      galeriPapan: dataJurnal.galeriPapan,
      fotoBersama: dataJurnal.fotoBersama
    });

    let bulkWritePromise = Promise.resolve();
    if (arrayNilaiSiswa && arrayNilaiSiswa.length > 0) {
      const operasiUpdate = arrayNilaiSiswa
        .filter(item => item.sesiId)
        .map(item => ({
          updateOne: {
            filter: { _id: item.sesiId },
            update: { $set: { nilaiTest: item.nilaiTest === "" ? null : Number(item.nilaiTest) } }
          }
        }));

      if (operasiUpdate.length > 0) {
        bulkWritePromise = StudySession.bulkWrite(operasiUpdate);
      }
    }

    const hasil = await Promise.allSettled([updateJadwalPromise, bulkWritePromise]);

    const adaGagal = hasil.some(res => res.status === "rejected");
    if (adaGagal) {
      return { sukses: true, pesan: "Jurnal disimpan dengan beberapa catatan/peringatan sistem." };
    }

    return { sukses: true, pesan: "Jurnal & Nilai berhasil disimpan!" };
  } catch (error) {
    console.error("[ERROR simpanJurnal]:", error.message);
    return { sukses: false, pesan: "Gagal menyimpan karena gangguan server." };
  }
}