import { PERIODE_BELAJAR } from "./constants";

/**
 * @param {unknown} d
 * @returns {boolean}
 */
const isValidDate = (d) => d instanceof Date && !isNaN(d);

/**
 * @param {number} year
 * @param {number} monthIndex
 * @param {number} day
 * @returns {string}
 */
const buildSafeYMD = (year, monthIndex, day) => {
  const temp = new Date(Date.UTC(year, monthIndex, day));
  const y    = temp.getUTCFullYear();
  const m    = String(temp.getUTCMonth() + 1).padStart(2, "0");
  const d    = String(temp.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ============================================================================
// TIME HELPER (Public API)
// ============================================================================
export const timeHelper = {
  /**
   * @param {Date|string|number} [dateInput=new Date()]
   * @returns {string}
   * @example
   * timeHelper.getTglJakarta()                    // "2025-08-17"
   * timeHelper.getTglJakarta("2025-08-17T00:00Z") // "2025-08-17"
   */
  getTglJakarta: (dateInput = new Date()) => {
    const d = new Date(dateInput);
    if (!isValidDate(d)) return "";
    return d.toLocaleDateString("en-CA", { timeZone: PERIODE_BELAJAR.TIMEZONE });
  },

  /**
   * @param {Date|string} tanggalInput
   * @returns {string} Contoh: "Senin, 17 Agustus 2025"
   */
  formatTanggalLengkap: (tanggalInput) => {
    if (!tanggalInput) return "-";
    const d = new Date(tanggalInput);
    if (!isValidDate(d)) return "-";
    return d.toLocaleDateString("id-ID", {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  },

  /**
   * @param {Date|string} tanggalInput
   * @returns {string} Contoh: "Sen, 17 Agt 2025"
   */
  formatTanggalLaporan: (tanggalInput) => {
    if (!tanggalInput) return "-";
    const d = new Date(tanggalInput);
    if (!isValidDate(d)) return "-";
    return d.toLocaleDateString("id-ID", {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  },

  /**
   * @param {Date|string} waktuInput
   * @returns {string} Contoh: "14:30", atau "--:--" jika input tidak valid.
   */
  formatJam: (waktuInput) => {
    if (!waktuInput) return "--:--";
    const d = new Date(waktuInput);
    if (!isValidDate(d)) return "--:--";
    return d
      .toLocaleTimeString("id-ID", {
        timeZone: PERIODE_BELAJAR.TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  },

  /**
   * @param {Date|string} [tanggalInput=new Date()]
   * @returns {string} Contoh: "Agustus 2025"
   */
  formatBulanTahun: (tanggalInput = new Date()) => {
    const d = new Date(tanggalInput);
    if (!isValidDate(d)) return "";
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      month: "long",
      year: "numeric",
    }).format(d);
  },

  /**
   * @param {Date|string} waktuMulai
   * @param {Date|string} waktuSelesai
   * @returns {number} Durasi dalam menit (≥ 0).
   */
  hitungDurasiMenit: (waktuMulai, waktuSelesai) => {
    if (!waktuMulai || !waktuSelesai) return 0;
    const d1 = new Date(waktuMulai);
    const d2 = new Date(waktuSelesai);
    if (!isValidDate(d1) || !isValidDate(d2)) return 0;
    return Math.max(0, Math.floor((d2 - d1) / 60_000));
  },

  /**
   * @param {Date|string} tanggalJadwal
   * @param {string}      jamSelesai
   * @returns {boolean}
   */
  cekApakahJadwalLewat: (tanggalJadwal, jamSelesai) => {
    const sekarang      = new Date();
    const tglSekarang   = timeHelper.getTglJakarta(sekarang);
    const tglJadwal     = timeHelper.getTglJakarta(tanggalJadwal);

    if (tglJadwal < tglSekarang) return true;
    if (tglJadwal === tglSekarang) {
      const batasSelesai = new Date(`${tglJadwal}T${jamSelesai}:00${PERIODE_BELAJAR.ISO_OFFSET}`);
      return sekarang > batasSelesai;
    }
    return false;
  },

  /**
   * @param {Date|string} [dateInput=new Date()]
   * @returns {{ awal: Date, akhir: Date }}
   *
   * @example
   * const { awal, akhir } = timeHelper.getRentangBulanSiswa();
   * // awal  → 2025-08-01T00:00:00+07:00
   * // akhir → 2025-08-31T23:59:59+07:00
   */
  getRentangBulanSiswa: (dateInput = new Date()) => {
    const d = new Date(new Date(dateInput).toLocaleString("en-US", { timeZone: PERIODE_BELAJAR.TIMEZONE }));
    const y = d.getFullYear();
    const m = d.getMonth();

    const startYMD = buildSafeYMD(y, m, 1);
    const endYMD   = buildSafeYMD(y, m + 1, 0);

    return {
      awal:  new Date(`${startYMD}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${endYMD}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`),
    };
  },

  /**
   * @param {Date|string} [dateInput=new Date()]
   * @returns {{ awal: Date, akhir: Date }}
   */
  getRentangBulanStaf: (dateInput = new Date()) => {
    const d    = new Date(new Date(dateInput).toLocaleString("en-US", { timeZone: PERIODE_BELAJAR.TIMEZONE }));
    const y    = d.getFullYear();
    const m    = d.getMonth();
    const date = d.getDate();

    const [startYMD, endYMD] =
      date >= 29
        ? [buildSafeYMD(y, m, 29),     buildSafeYMD(y, m + 1, 28)]
        : [buildSafeYMD(y, m - 1, 29), buildSafeYMD(y, m, 28)];

    return {
      awal:  new Date(`${startYMD}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${endYMD}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`),
    };
  },

  /**
   * @param {Date|string} tglInput
   * @returns {{ awal: Date, akhir: Date }}
   */
  getRentangHari: (tglInput) => {
    const tglString =
      tglInput instanceof Date
        ? timeHelper.getTglJakarta(tglInput)
        : tglInput;

    return {
      awal:  new Date(`${tglString}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${tglString}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`),
    };
  },
};