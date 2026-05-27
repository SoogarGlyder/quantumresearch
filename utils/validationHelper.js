import { VALIDASI_SISTEM } from "./constants";

/**
 * Kumpulan perkakas untuk memvalidasi dan membersihkan (sanitize) input pengguna.
 * Semua fungsi murni (pure) — tidak ada side effect.
 */
export const validationHelper = {
  /**
   * Meng-escape karakter spesial regex untuk mencegah serangan ReDoS.
   * Wajib dipakai sebelum menyisipkan input pengguna ke dalam RegExp atau query MongoDB $regex.
   *
   * @param {string} string
   * @returns {string}
   * @example
   * const aman = validationHelper.escapeRegex(req.query.search);
   * const regex = new RegExp(aman, "i");
   */
  escapeRegex: (string) => {
    if (typeof string !== "string") return "";
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  /**
   * Memvalidasi format username: hanya huruf kecil, angka, underscore, titik, atau strip.
   *
   * @param {string} username
   * @returns {boolean}
   */
  isValidUsername: (username) => {
    if (!username || typeof username !== "string") return false;
    return VALIDASI_SISTEM.REGEX_USERNAME.test(username.trim());
  },

  /**
   * Memvalidasi panjang password memenuhi standar keamanan minimal.
   *
   * @param {string} password
   * @returns {boolean}
   */
  isValidPassword: (password) => {
    if (!password || typeof password !== "string") return false;
    return password.length >= VALIDASI_SISTEM.MIN_PASSWORD;
  },

  /**
   * Memvalidasi format nomor handphone Indonesia (diawali 08 atau 628).
   *
   * @param {string|number} phone
   * @returns {boolean}
   */
  isValidPhone: (phone) => {
    if (!phone) return false;
    return VALIDASI_SISTEM.REGEX_PHONE.test(String(phone).trim());
  },

  /**
   * Memvalidasi bahwa string adalah MongoDB ObjectId yang valid (24 hex characters).
   * Dipakai di API routes sebelum meneruskan ID ke query database.
   *
   * @param {string} id
   * @returns {boolean}
   * @example
   * if (!validationHelper.isValidObjectId(params.id)) {
   *   return responseHelper.error("ID tidak valid.", null, "INVALID_ID");
   * }
   */
  isValidObjectId: (id) => {
    if (!id) return false;
    return /^[a-f\d]{24}$/i.test(String(id));
  },

  /**
   * Memvalidasi bahwa string adalah URL http/https yang valid.
   * Dipakai sebelum menyimpan URL eksternal ke database (mencegah javascript: URI dll).
   *
   * @param {string} url
   * @returns {boolean}
   * @example
   * if (!validationHelper.isValidUrl(body.url)) {
   *   return responseHelper.error("Format URL tidak valid.", null, "INVALID_URL");
   * }
   */
  isValidUrl: (url) => {
    if (!url || typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  },

  /**
   * Menghapus spasi di awal dan akhir string input.
   * Nama diperjelaskan dari "sanitize" terus "trimInput" agar jujur tentang apa yang dilakukan.
   *
   * @param {string} text
   * @returns {string}
   */
  trimInput: (text) => {
    if (!text || typeof text !== "string") return "";
    return text.trim();
  },

  /**
   * @param {Object} data 
   * @returns {Object}
   */
  bersihkanDataVirtual: (data) => {
    const dataBersih = { ...data };
    
    if (typeof dataBersih._id === 'string' && dataBersih._id.startsWith('virtual_')) {
      delete dataBersih._id;
    }
    
    if (dataBersih.isVirtual) {
      delete dataBersih.isVirtual;
    }
    
    return dataBersih;
  },
};