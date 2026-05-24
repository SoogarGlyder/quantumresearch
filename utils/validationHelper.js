import { VALIDASI_SISTEM } from "./constants"; 

/**
 * Kumpulan perkakas untuk memvalidasi dan membersihkan (sanitize) input dari pengguna
 * guna menjamin Prinsip Security by Design.
 */
export const validationHelper = {
  /**
   * Membersihkan karakter berbahaya untuk mencegah serangan ReDoS (Regular Expression Denial of Service).
   * @param {string} string - Teks mentah yang akan di-escape.
   * @returns {string} Teks yang aman untuk disisipkan ke dalam pencarian Regex.
   */
  escapeRegex: (string) => {
    if (typeof string !== "string") return "";
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Memastikan username hanya mengandung huruf kecil, angka, garis bawah, titik, atau strip.
   * @param {string} username - Input username dari pengguna.
   * @returns {boolean} True jika format valid.
   */
  isValidUsername: (username) => {
    if (!username || typeof username !== "string") return false;
    return VALIDASI_SISTEM.REGEX_USERNAME.test(username.trim());
  },
  
  /**
   * Memastikan panjang password memenuhi standar keamanan minimal sistem.
   * @param {string} password - Input password mentah.
   * @returns {boolean} True jika panjang password aman.
   */
  isValidPassword: (password) => {
    if (!password || typeof password !== "string") return false;
    return password.length >= VALIDASI_SISTEM.MIN_PASSWORD;
  },
  
  /**
   * Memastikan format nomor handphone sesuai dengan standar Indonesia (08 atau 628).
   * @param {string|number} phone - Input nomor handphone.
   * @returns {boolean} True jika format valid.
   */
  isValidPhone: (phone) => {
    if (!phone) return false;
    const phoneStr = String(phone).trim();
    return VALIDASI_SISTEM.REGEX_PHONE.test(phoneStr);
  },
  
  /**
   * Membersihkan spasi berlebih di awal dan akhir teks (Input Sanitization).
   * @param {string} text - Teks mentah.
   * @returns {string} Teks yang sudah dirapikan.
   */
  sanitize: (text) => {
    if (!text || typeof text !== "string") return "";
    return text.trim();
  }
};