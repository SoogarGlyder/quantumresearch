import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM } from "./constants"; 

export const authHelper = {
  /**
   * 1. HASHING: Mengacak password agar aman di database
   */
  buatHash: async (password) => {
    const salt = await bcrypt.genSalt(KONFIGURASI_SISTEM.SALT_ROUNDS);
    return await bcrypt.hash(password || KONFIGURASI_SISTEM.DEFAULT_PASSWORD, salt);
  },

  /**
   * 2. VERIFIKASI: Membandingkan password input dengan yang ada di DB
   */
  bandingkanPassword: async (input, hashed) => {
    if (!input || !hashed) return false;
    return await bcrypt.compare(input, hashed);
  },

  /**
   * 3. SET SESSION: Membuat cookie login
   */
  setSesi: async (user) => {
    //FIX 1: Guard Clause (Anti Crash jika data user kosong/rusak)
    if (!user || !user._id) {
      console.warn("authHelper: Gagal set sesi, objek user tidak valid.");
      return false;
    }

    const cookieStore = await cookies();
    const opsi = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * KONFIGURASI_SISTEM.SESSION_MAX_AGE_DAYS 
    };
    
    //FIX 2: Optional Chaining (Lebih aman)
    cookieStore.set(KONFIGURASI_SISTEM.COOKIE_NAME, user?._id?.toString(), opsi);
    cookieStore.set(KONFIGURASI_SISTEM.COOKIE_ROLE, user?.peran || "siswa", opsi);

    if (user?.kodeCabang) cookieStore.set("cabang_quantum", user.kodeCabang, opsi);
    if (user?.pangkat) cookieStore.set("pangkat_quantum", user.pangkat, opsi);
    
    if (user?.kelasAsuh && Array.isArray(user.kelasAsuh)) {
      cookieStore.set("kelas_asuh_quantum", JSON.stringify(user.kelasAsuh), opsi);
    }
    
    return true;
  },

  /**
   * 4. GET SESSION: Mengambil data siapa yang sedang login
   */
  ambilSesi: async () => {
    const cookieStore = await cookies();
    
    const kelasAsuhRaw = cookieStore.get("kelas_asuh_quantum")?.value;
    let daftarKelasAsuh = [];
    try {
      if (kelasAsuhRaw) daftarKelasAsuh = JSON.parse(kelasAsuhRaw);
    } catch (e) {
      console.error("Gagal mem-parsing kelas_asuh_quantum:", e);
    }

    return {
      userId: cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value,
      peran: cookieStore.get(KONFIGURASI_SISTEM.COOKIE_ROLE)?.value,
      kodeCabang: cookieStore.get("cabang_quantum")?.value,
      pangkat: cookieStore.get("pangkat_quantum")?.value,
      kelasAsuh: daftarKelasAsuh
    };
  },

  /**
   * 5. DELETE SESSION: Menghapus jejak login (Logout)
   */
  hapusSesi: async () => {
    const cookieStore = await cookies();
    cookieStore.delete(KONFIGURASI_SISTEM.COOKIE_NAME);
    cookieStore.delete(KONFIGURASI_SISTEM.COOKIE_ROLE);
    cookieStore.delete("cabang_quantum");
    cookieStore.delete("pangkat_quantum");
    cookieStore.delete("kelas_asuh_quantum");
  }
};