/**
 * Perkakas untuk menstandarkan format balasan (response) dari Server Actions ke Client/Frontend.
 * Memastikan Prinsip Konsistensi (Standarisasi) di seluruh aplikasi.
 */
export const responseHelper = {
  /**
   * Format standar ketika operasi (database/logika) berhasil dilakukan.
   * @param {string} pesan - Pesan sukses yang ramah pengguna (contoh: "Data berhasil disimpan").
   * @param {any} [data=null] - Payload atau objek data yang ingin dikirimkan ke frontend (opsional).
   * @returns {Object} Objek response sukses.
   */
  success: (pesan, data = null) => ({
    sukses: true,
    pesan,
    data,
    timestamp: new Date().toISOString()
  }),
  
  /**
   * Format standar ketika terjadi kegagalan sistem atau penolakan validasi.
   * @param {string} pesan - Pesan error yang aman ditampilkan ke pengguna (contoh: "Gagal menyimpan absen").
   * @param {Error|string} [errorRaw=null] - Detail error asli dari sistem/database untuk keperluan debugging log (opsional).
   * @returns {Object} Objek response gagal.
   */
  error: (pesan, errorRaw = null) => ({
    sukses: false,
    pesan,
    error: errorRaw?.message || errorRaw,
    timestamp: new Date().toISOString()
  })
};