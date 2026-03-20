export const validationHelper = {
  // Hanya huruf kecil, angka, titik, minus, dan underscore
  isValidUsername: (username) => /^[a-z0-9_.-]+$/.test(username),
  
  // Minimal 6 karakter
  isValidPassword: (password) => password && password.length >= 6,
  
  // Format nomor WA Indonesia (Harus diawali 08 atau 62)
  isValidPhone: (phone) => /^(08|628)\d{8,13}$/.test(phone),
  
  // Membersihkan teks dari karakter aneh
  sanitize: (text) => text?.trim() || ""
};