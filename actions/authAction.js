"use server";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import connectToDatabase from "../lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs"; 
import User from "../models/User";
import { revalidatePath } from "next/cache";

// ============================================================================
// 2. INTERNAL HELPERS (Security & Validation)
// ============================================================================

/**
 * Memastikan pengakses adalah Admin yang sah sebelum eksekusi mutasi data.
 */
async function cekAdmin() {
  try {
    const cookieStore = await cookies();
    const karcis = cookieStore.get("karcis_quantum")?.value;
    const peran = cookieStore.get("peran_quantum")?.value;
    
    if (!karcis) return false;
    
    // Optimasi: Cek role dari cookie dulu
    if (peran === "admin") return true;
    
    // Validasi ulang ke database untuk keamanan ekstra
    const user = await User.findById(karcis).select("peran").lean();
    return user && user.peran === "admin";
  } catch (error) {
    console.error("[SECURITY cekAdmin]:", error.message);
    return false; 
  }
}

// ============================================================================
// 3. AUTHENTICATION & REGISTRATION ACTIONS
// ============================================================================

/**
 * Tambah satu siswa secara manual via form Admin.
 */
export async function prosesTambahSiswa(dataFormulir) {
  try {
    await connectToDatabase();
    
    if (!(await cekAdmin())) {
      return { sukses: false, pesan: "Akses Ditolak! Hanya Admin yang berhak." };
    }

    const formNomorPeserta = (dataFormulir.nomorPeserta || "").trim();
    const formNoHp = (dataFormulir.noHp || "").trim();
    let formUsername = (dataFormulir.username || formNomorPeserta).trim().toLowerCase();

    // Validasi format username
    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(formUsername)) {
      return { sukses: false, pesan: "Username hanya boleh huruf, angka, dan simbol (. - _)" };
    }

    // Cek duplikat
    const akunLama = await User.findOne({ 
      $or: [{ username: formUsername }, { nomorPeserta: formNomorPeserta }, { noHp: formNoHp }]
    }).select("_id").lean();

    if (akunLama) {
      return { sukses: false, pesan: "Gagal: ID, Username, atau No WA sudah terdaftar!" };
    }

    const passwordHashed = await bcrypt.hash(dataFormulir.password || "123456", 10);

    await User.create({
      ...dataFormulir,
      nama: (dataFormulir.nama || "").trim(),
      nomorPeserta: formNomorPeserta,
      username: formUsername,
      password: passwordHashed,
      peran: "siswa",
      status: dataFormulir.status || "aktif"
    });

    revalidatePath("/admin");
    return { sukses: true, pesan: "Berhasil! Akun siswa telah dibuat." };
  } catch (error) {
    console.error("[ERROR prosesTambahSiswa]:", error.message);
    return { sukses: false, pesan: "Terjadi kesalahan database." };
  }
}

/**
 * FUNGSI SAKTI: Bulk Upload (Poin 25)
 * Memproses pendaftaran massal siswa (CSV/Excel JSON).
 */
export async function prosesBulkTambahSiswa(daftarSiswaRaw) {
  try {
    await connectToDatabase();
    
    if (!(await cekAdmin())) {
      return { sukses: false, pesan: "Akses Ditolak! Fitur ini khusus Admin." };
    }

    if (!Array.isArray(daftarSiswaRaw) || daftarSiswaRaw.length === 0) {
      return { sukses: false, pesan: "Tidak ada data untuk diproses." };
    }

    // 1. Ambil data unik dari DB untuk validasi massal yang cepat (Set lookup O(1))
    const allUsers = await User.find({}, "username nomorPeserta noHp").lean();
    const setUsername = new Set(allUsers.map(u => u.username));
    const setNomor = new Set(allUsers.map(u => u.nomorPeserta));
    const setWA = new Set(allUsers.map(u => u.noHp));

    const laporanGagal = [];
    const dataSiapSimpan = [];

    // 2. Iterasi & Validasi Data
    for (const s of daftarSiswaRaw) {
      const nama = (s.nama || "").trim();
      const idPeserta = (s.nomorPeserta || "").toString().trim();
      const wa = (s.noHp || "").toString().trim();
      const user = (s.username || idPeserta).toLowerCase().trim();
      const pass = (s.password || "123456").toString(); // Default pass: 123456

      if (!nama || !idPeserta) {
        laporanGagal.push(`${nama || 'Tanpa Nama'}: Data tidak lengkap (Nama/ID Kosong).`);
        continue;
      }

      // Cek Duplikat di DB atau Duplikat di dalam file yang sedang diupload
      if (setUsername.has(user) || setNomor.has(idPeserta) || setWA.has(wa)) {
        laporanGagal.push(`${nama}: ID/Username/WA sudah ada di sistem.`);
        continue;
      }

      // Hashing Password (CPU Heavy - tapi perlu dilakukan per user)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(pass, salt);

      dataSiapSimpan.push({
        nama,
        nomorPeserta: idPeserta,
        username: user,
        password: hashedPassword,
        noHp: wa,
        kelas: s.kelas || "-",
        peran: "siswa",
        status: "aktif"
      });

      // Update set sementara agar tidak duplikat dalam satu batch upload
      setUsername.add(user);
      setNomor.add(idPeserta);
      if (wa) setWA.add(wa);
    }

    // 3. Eksekusi Batch Insert (Atomic Write)
    if (dataSiapSimpan.length > 0) {
      await User.insertMany(dataSiapSimpan);
    }

    revalidatePath("/admin");
    
    const suksesCount = dataSiapSimpan.length;
    const gagalCount = laporanGagal.length;

    return { 
      sukses: true, 
      pesan: `Proses Selesai! ${suksesCount} Siswa Berhasil, ${gagalCount} Gagal.`,
      laporan: laporanGagal 
    };

  } catch (error) {
    console.error("[ERROR prosesBulkTambahSiswa]:", error.message);
    return { sukses: false, pesan: "Gangguan Server: " + error.message };
  }
}

/**
 * Login Multi-Identifier (Username / ID / WA)
 */
export async function prosesLogin(dataFormulir) {
  try {
    await connectToDatabase();

    const idInput = (dataFormulir.identifier || dataFormulir.username || "").trim().toLowerCase();
    const passwordInput = dataFormulir.password;

    if (!idInput || !passwordInput) {
      return { sukses: false, pesan: "ID dan Kata Sandi wajib diisi." };
    }

    const user = await User.findOne({
      $or: [
        { username: idInput },
        { nomorPeserta: idInput },
        { noHp: idInput }
      ]
    }).lean();

    if (!user) {
      return { sukses: false, pesan: "Akun tidak ditemukan!" };
    }

    if (user.status === "tidak aktif") {
      return { sukses: false, pesan: "Akun dinonaktifkan. Hubungi Admin." };
    }

    const valid = await bcrypt.compare(passwordInput, user.password);
    if (!valid) return { sukses: false, pesan: "Kata sandi salah!" };

    // Set Cookies
    const cookieStore = await cookies();
    const opsiCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 Hari
    };

    cookieStore.set("karcis_quantum", user._id.toString(), opsiCookie);
    cookieStore.set("peran_quantum", user.peran, opsiCookie);

    return { sukses: true, pesan: "Login Berhasil! Memuat portal..." };

  } catch (error) {
    console.error("[ERROR prosesLogin]:", error.message);
    return { sukses: false, pesan: "Gagal memproses login." };
  }
}

/**
 * Logout & Bersihkan Sesi
 */
export async function prosesLogout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("karcis_quantum");
    cookieStore.delete("peran_quantum");
    return { sukses: true, pesan: "Berhasil keluar sesi." };
  } catch (error) {
    return { sukses: false, pesan: "Gagal logout." };
  }
}