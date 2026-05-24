import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM } from "./constants"; 

export const authHelper = {
  /**
   * Mengacak password menggunakan bcrypt untuk disimpan di database.
   * @param {string} password - Password mentah dari input pengguna.
   * @returns {Promise<string>} Password yang sudah di-hash.
   */
  buatHash: async (password) => {
    try {
      const pwd = typeof password === "string" && password.trim() !== "" ? password : KONFIGURASI_SISTEM.DEFAULT_PASSWORD;
      const salt = await bcrypt.genSalt(KONFIGURASI_SISTEM.SALT_ROUNDS);
      return await bcrypt.hash(pwd, salt);
    } catch (error) {
      console.error("[authHelper.buatHash] Error saat mengenkripsi password:", error);
      throw new Error("Terjadi kesalahan sistem saat memproses keamanan data.");
    }
  },

  /**
   * Membandingkan password input dengan hash yang ada di database.
   * @param {string} input - Password mentah dari form login.
   * @param {string} hashed - Password hash dari database.
   * @returns {Promise<boolean>} True jika password cocok.
   */
  bandingkanPassword: async (input, hashed) => {
    try {
      if (!input || !hashed || typeof input !== "string" || typeof hashed !== "string") {
        return false;
      }
      return await bcrypt.compare(input, hashed);
    } catch (error) {
      console.error("[authHelper.bandingkanPassword] Error saat validasi password:", error);
      return false; // Fail-safe (mencegah aplikasi crash)
    }
  },

  /**
   * Membuat dan menyimpan session pengguna ke dalam HTTP-Only Cookie.
   * @param {Object} user - Objek data user dari database.
   * @returns {Promise<boolean>} True jika proses set sesi berhasil.
   */
  setSesi: async (user) => {
    if (!user || !user._id) {
      console.warn("[authHelper.setSesi] Gagal: Objek user tidak valid atau kosong.");
      return false;
    }

    try {
      const cookieStore = await cookies();
      const opsi = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * KONFIGURASI_SISTEM.SESSION_MAX_AGE_DAYS 
      };
      
      cookieStore.set(KONFIGURASI_SISTEM.COOKIE_NAME, user._id.toString(), opsi);
      cookieStore.set(KONFIGURASI_SISTEM.COOKIE_ROLE, user.peran || "siswa", opsi);

      if (user.kodeCabang) cookieStore.set("cabang_quantum", user.kodeCabang, opsi);
      if (user.pangkat) cookieStore.set("pangkat_quantum", user.pangkat, opsi);
      
      if (Array.isArray(user.kelasAsuh) && user.kelasAsuh.length > 0) {
        cookieStore.set("kelas_asuh_quantum", JSON.stringify(user.kelasAsuh), opsi);
      }
      
      return true;
    } catch (error) {
      console.error("[authHelper.setSesi] Error saat menyimpan cookies:", error);
      return false;
    }
  },

  /**
   * Mengambil data session user yang sedang login dari Cookie.
   * @returns {Promise<Object>} Objek berisi informasi sesi aktif.
   */
  ambilSesi: async () => {
    try {
      const cookieStore = await cookies();
      
      const kelasAsuhRaw = cookieStore.get("kelas_asuh_quantum")?.value;
      let daftarKelasAsuh = [];
      
      if (kelasAsuhRaw) {
        try {
          daftarKelasAsuh = JSON.parse(kelasAsuhRaw);
        } catch (e) {
          console.error("[authHelper.ambilSesi] Gagal mem-parsing array kelas asuh:", e);
        }
      }

      return {
        userId: cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value || null,
        peran: cookieStore.get(KONFIGURASI_SISTEM.COOKIE_ROLE)?.value || null,
        kodeCabang: cookieStore.get("cabang_quantum")?.value || null,
        pangkat: cookieStore.get("pangkat_quantum")?.value || null,
        kelasAsuh: daftarKelasAsuh
      };
    } catch (error) {
      console.error("[authHelper.ambilSesi] Error saat membaca cookies:", error);
      return { userId: null, peran: null, kodeCabang: null, pangkat: null, kelasAsuh: [] };
    }
  },

  /**
   * Menghapus jejak login (Logout) dengan membersihkan Cookie.
   */
  hapusSesi: async () => {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(KONFIGURASI_SISTEM.COOKIE_NAME);
      cookieStore.delete(KONFIGURASI_SISTEM.COOKIE_ROLE);
      cookieStore.delete("cabang_quantum");
      cookieStore.delete("pangkat_quantum");
      cookieStore.delete("kelas_asuh_quantum");
    } catch (error) {
      console.error("[authHelper.hapusSesi] Error saat menghapus cookies:", error);
    }
  }
};