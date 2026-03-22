import { VALIDASI_SISTEM } from "./constants"; // 👈 Import Konstanta

export const validationHelper = {
  // Hanya huruf kecil, angka, titik, minus, dan underscore (Ditarik dari constants)
  isValidUsername: (username) => VALIDASI_SISTEM.REGEX_USERNAME.test(username),
  
  // Minimal karakter berdasarkan aturan di constants
  isValidPassword: (password) => password && password.length >= VALIDASI_SISTEM.MIN_PASSWORD,
  
  // Format nomor WA Indonesia (Ditarik dari constants)
  isValidPhone: (phone) => VALIDASI_SISTEM.REGEX_PHONE.test(phone),
  
  // Membersihkan teks dari spasi berlebih atau karakter aneh (tetap dinamis)
  sanitize: (text) => text?.trim() || ""
};