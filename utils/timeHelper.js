import { PERIODE_BELAJAR } from "./constants"; 

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

  // 🚀 DI-UPGRADE: Sekarang kebal dari error! Bisa menerima String maupun Date Object.
  getRentangHari: (tglInput) => {
    // 1. Cek apakah yang dikirim itu objek Date? Kalau iya, ubah jadi string YYYY-MM-DD dulu.
    const tglString = (tglInput instanceof Date) 
      ? timeHelper.getTglJakarta(tglInput) 
      : tglInput;

    // 2. Sekarang formatnya dijamin pasti aman (YYYY-MM-DD)
    return {
      awal: new Date(`${tglString}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${tglString}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`)
    };
  }
};