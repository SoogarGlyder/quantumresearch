/**
 * Kontrak response:
 *   ok        {boolean} - true jika operasi berhasil
 *   pesan     {string}  - pesan yang aman ditampilkan ke pengguna
 *   data      {any}     - payload (hanya jika ok: true)
 *   detail    {string}  - detail error teknis untuk logging (hanya jika ok: false)
 *   kode      {string}  - kode error terstruktur untuk frontend & monitoring (opsional)
 *   timestamp {string}  - ISO string waktu response dibuat
 */
export const responseHelper = {
  /**
   * @param {string} pesan
   * @param {any}    [data]
   * @returns {{ ok: true, pesan: string, data: any, timestamp: string }}
   * @example
   * return responseHelper.success("Data berhasil disimpan.", { id: "abc123" });
   */
  success: (pesan, data = null) => ({
    ok: true,
    pesan,
    data,
    timestamp: new Date().toISOString(),
  }),

  /**
   * @param {string}       pesan
   * @param {Error|string} [errorRaw]
   * @param {string}       [kode]
   * @returns {{ ok: false, pesan: string, detail: string|null, kode: string|null, timestamp: string }}
   * @example
   * return responseHelper.error("Gagal menyimpan data.", err, "DB_ERROR");
   */
  error: (pesan, errorRaw = null, kode = null) => ({
    ok: false,
    pesan,
    detail: errorRaw?.message ?? (typeof errorRaw === "string" ? errorRaw : null),
    kode,
    timestamp: new Date().toISOString(),
  }),
};

// ============================================================================
// SERIALIZE HELPER
// ============================================================================

/**
 * @template T
 * @param {T} data
 * @returns {T}
 */
export const serialize = (data) => JSON.parse(JSON.stringify(data));