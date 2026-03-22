import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM } from "./constants"; // 👈 Import Konstanta

export const authHelper = {
  /**
   * 1. HASHING: Mengacak password agar aman di database
   */
  buatHash: async (password) => {
    // Menggunakan SALT_ROUNDS dari konstanta (10)
    const salt = await bcrypt.genSalt(KONFIGURASI_SISTEM.SALT_ROUNDS);
    // Menggunakan DEFAULT_PASSWORD jika kosong
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
    const cookieStore = await cookies();
    const opsi = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // Menggunakan umur sesi dari konstanta
      maxAge: 60 * 60 * 24 * KONFIGURASI_SISTEM.SESSION_MAX_AGE_DAYS 
    };
    
    // Set cookie menggunakan nama dari konstanta
    cookieStore.set(KONFIGURASI_SISTEM.COOKIE_NAME, user._id.toString(), opsi);
    cookieStore.set(KONFIGURASI_SISTEM.COOKIE_ROLE, user.peran, opsi);
  },

  /**
   * 4. GET SESSION: Mengambil data siapa yang sedang login
   */
  ambilSesi: async () => {
    const cookieStore = await cookies();
    return {
      userId: cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value,
      peran: cookieStore.get(KONFIGURASI_SISTEM.COOKIE_ROLE)?.value
    };
  },

  /**
   * 5. DELETE SESSION: Menghapus jejak login (Logout)
   */
  hapusSesi: async () => {
    const cookieStore = await cookies();
    cookieStore.delete(KONFIGURASI_SISTEM.COOKIE_NAME);
    cookieStore.delete(KONFIGURASI_SISTEM.COOKIE_ROLE);
  }
};