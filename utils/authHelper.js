import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SESSION_KEY = "karcis_quantum";
const ROLE_KEY = "peran_quantum";

export const authHelper = {
  /**
   * 1. HASHING: Mengacak password agar aman di database
   */
  buatHash: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password || "123456", salt);
  },

  /**
   * 2. VERIFIKASI: Membandingkan password input dengan yang ada di DB
   */
  bandingkanPassword: async (input, hashed) => {
    if (!input || !hashed) return false;
    return await bcrypt.compare(input, hashed);
  },

  /**
   * 3. SET SESSION: Membuat cookie login (berlaku 7 hari)
   */
  setSesi: async (user) => {
    const cookieStore = await cookies();
    const opsi = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 Hari
    };
    cookieStore.set(SESSION_KEY, user._id.toString(), opsi);
    cookieStore.set(ROLE_KEY, user.peran, opsi);
  },

  /**
   * 4. GET SESSION: Mengambil data siapa yang sedang login
   */
  ambilSesi: async () => {
    const cookieStore = await cookies();
    return {
      userId: cookieStore.get(SESSION_KEY)?.value,
      peran: cookieStore.get(ROLE_KEY)?.value
    };
  },

  /**
   * 5. DELETE SESSION: Menghapus jejak login (Logout)
   */
  hapusSesi: async () => {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_KEY);
    cookieStore.delete(ROLE_KEY);
  }
};