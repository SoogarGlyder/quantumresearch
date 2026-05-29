import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { KONFIGURASI_SISTEM, PERAN } from "./constants";

// ============================================================================
// KONFIGURASI JWT
// ============================================================================

/**
 * @returns {Uint8Array}
 * @throws {Error}
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim() === "") {
    throw new Error(
      "[authHelper] JWT_SECRET belum diset di environment variables. " +
      "Tambahkan JWT_SECRET ke file .env.local Anda. " +
      "Generate secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }

  return new TextEncoder().encode(secret);
};

// ============================================================================
// OPSI COOKIE
// ============================================================================
/**
 * @returns {Object}
 */
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
   * @throws {Error}
   */
  buatHash: async (password) => {
    try {
      const pwd =
        typeof password === "string" && password.trim() !== ""
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
      if (
        !input || !hashed ||
        typeof input !== "string" ||
        typeof hashed !== "string"
      ) {
        return false;
      }
      return await bcrypt.compare(input, hashed);
    } catch (error) {
      console.error("[authHelper.bandingkanPassword] Gagal:", error.message);
      return false;
    }
  },

  /**
   * Payload JWT yang disimpan:
   *   - userId      : user._id sebagai string
   *   - peran       : peran user (siswa / pengajar / admin)
   *   - kodeCabang  : kode cabang user
   *   - pangkat     : pangkat pengajar (null jika bukan pengajar)
   *   - kelasAsuh   : array kelas asuh (hanya relevan untuk kakak asuh)
   *
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
        userId:     user._id.toString(),
        peran:      user.peran      ?? PERAN.SISWA.id,
        kodeCabang: user.kodeCabang ?? null,
        pangkat:    user.pangkat    ?? null,
        kelasAsuh:  Array.isArray(user.kelasAsuh) ? user.kelasAsuh : [],
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
   *   userId:     string|null,
   *   peran:      string|null,
   *   kodeCabang: string|null,
   *   pangkat:    string|null,
   *   kelasAsuh:  string[]
   * }>}
   */
  ambilSesi: async () => {
    const sesiKosong = {
      userId: null, peran: null, kodeCabang: null,
      pangkat: null, kelasAsuh: [],
    };

    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;

      if (!token) return sesiKosong;

      const { payload } = await jwtVerify(token, getJwtSecret());

      return {
        userId:     payload.userId     ?? null,
        peran:      payload.peran      ?? null,
        kodeCabang: payload.kodeCabang ?? null,
        pangkat:    payload.pangkat    ?? null,
        kelasAsuh:  Array.isArray(payload.kelasAsuh) ? payload.kelasAsuh : [],
      };
    } catch {
      console.warn("[authHelper.ambilSesi] Token tidak valid atau sudah expired.");
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