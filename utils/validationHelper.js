import { VALIDASI_SISTEM } from "./constants"; 

export const validationHelper = {
  // 🚀 FITUR BARU: Pembersih karakter berbahaya untuk Regex (Anti ReDoS)
  escapeRegex: (string) => {
    if (typeof string !== "string") return "";
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  isValidUsername: (username) => {
    // 🚀 FIX: Tolak jika tipe data bukan String
    if (!username || typeof username !== "string") return false;
    return VALIDASI_SISTEM.REGEX_USERNAME.test(username.trim());
  },
  
  isValidPassword: (password) => {
    if (!password || typeof password !== "string") return false;
    return password.length >= VALIDASI_SISTEM.MIN_PASSWORD;
  },
  
  isValidPhone: (phone) => {
    // 🚀 FIX: Paksa konversi ke String sebelum ditest (mencegah Number crash)
    if (!phone) return false;
    const phoneStr = String(phone).trim();
    return VALIDASI_SISTEM.REGEX_PHONE.test(phoneStr);
  },
  
  // 🚀 FIX: Type checking sebelum di trim()
  sanitize: (text) => {
    if (!text || typeof text !== "string") return "";
    return text.trim();
  }
};