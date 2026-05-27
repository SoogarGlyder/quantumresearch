//ada perbaikan.

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM, PERAN } from "./constants";

// ============================================================================
// KONFIGURASI JWT & COOKIE
// ============================================================================
const getJwtSecret = () => {
  let secret = process.env.JWT_SECRET;
  
  if (!secret || secret.trim() === "") {
    secret = "quantum_secret_dev_key_2026_wajib_diganti_di_production";
  }
  
  return new TextEncoder().encode(secret);
};

const buatOpsiCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: KONFIGURASI_SISTEM.SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
});

// ============================================================================
// AUTH HELPER
// ============================================================================
export const authHelper = {
  /**
   * @param {string} password
   * @returns {Promise<string>}
   */
  buatHash: async (password) => {
    try {
      const pwd = typeof password === "string" && password.trim() !== "" 
        ? password 
        : KONFIGURASI_SISTEM.DEFAULT_PASSWORD;

      const salt = await bcrypt.genSalt(KONFIGURASI_SISTEM.SALT_ROUNDS);
      return await bcrypt.hash(pwd, salt);
    } catch (error) {
      console.error("[authHelper.buatHash] Gagal meng-hash password:", error.message);
      throw new Error("Terjadi kesalahan sistem saat memproses keamanan data.");
    }
  },

  /**
   * @param {string} input
   * @param {string} hashed
   * @returns {Promise<boolean>}
   */
  bandingkanPassword: async (input, hashed) => {
    try {
      if (!input || !hashed || typeof input !== "string" || typeof hashed !== "string") {
        return false;
      }
      return await bcrypt.compare(input, hashed);
    } catch (error) {
      console.error("[authHelper.bandingkanPassword] Gagal:", error.message);
      return false;
    }
  },

  /**
   * @param {Object} user
   * @returns {Promise<boolean>}
   */
  setSesi: async (user) => {
    if (!user?._id) {
      console.warn("[authHelper.setSesi] Gagal: objek user tidak punya _id.");
      return false;
    }

    try {
      const payload = {
        userId: user._id.toString(),
        peran: user.peran ?? PERAN.SISWA.id,
        kodeCabang: user.kodeCabang ?? null,
        pangkat: user.pangkat ?? null,
        kelasAsuh: Array.isArray(user.kelasAsuh) ? user.kelasAsuh : [],
      };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${KONFIGURASI_SISTEM.SESSION_MAX_AGE_DAYS}d`)
        .sign(getJwtSecret());

      const cookieStore = await cookies();
      cookieStore.set(KONFIGURASI_SISTEM.COOKIE_NAME, token, buatOpsiCookie());

      return true;
    } catch (error) {
      console.error("[authHelper.setSesi] Gagal sign JWT:", error.message);
      return false;
    }
  },

  /**
   * @returns {Promise<{
   * userId: string|null, peran: string|null, kodeCabang: string|null, 
   * pangkat: string|null, kelasAsuh: string[]
   * }>}
   */
  ambilSesi: async () => {
    const sesiKosong = { userId: null, peran: null, kodeCabang: null, pangkat: null, kelasAsuh: [] };
    
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;

      if (!token) return sesiKosong;

      // Verifikasi Signature JWT
      const { payload } = await jwtVerify(token, getJwtSecret());

      return {
        userId: payload.userId,
        peran: payload.peran,
        kodeCabang: payload.kodeCabang,
        pangkat: payload.pangkat,
        kelasAsuh: payload.kelasAsuh,
      };
    } catch (error) {
      console.warn("[authHelper.ambilSesi] Sesi tidak valid / Expired.");
      return sesiKosong;
    }
  },

  /**
   * @returns {Promise<void>}
   */
  hapusSesi: async () => {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(KONFIGURASI_SISTEM.COOKIE_NAME);
    } catch (error) {
      console.error("[authHelper.hapusSesi] Gagal menghapus cookie:", error.message);
    }
  },
};