import { PERIODE_BELAJAR } from "./constants"; // 👈 Import Konstanta

export const timeHelper = {
  // Mendapatkan string YYYY-MM-DD menggunakan TIMEZONE konstanta
  getTglJakarta: (date = new Date()) => {
    return date.toLocaleDateString('en-CA', { timeZone: PERIODE_BELAJAR.TIMEZONE });
  },

  // Mendapatkan awal bulan dengan UTC OFFSET konstanta (-7 untuk WIB)
  getAwalBulan: () => {
    const d = new Date();
    return new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), 1, PERIODE_BELAJAR.UTC_OFFSET, 0, 0, 0)
    );
  },

  // Membuat rentang 00:00:00 sampai 23:59:59 menggunakan ISO OFFSET konstanta (+07:00)
  getRentangHari: (tglString) => {
    return {
      awal: new Date(`${tglString}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${tglString}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`)
    };
  }
};