export const timeHelper = {
  // Mendapatkan string YYYY-MM-DD (WIB)
  getTglJakarta: (date = new Date()) => {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  },

  // Mendapatkan awal bulan (WIB) untuk Klasemen
  getAwalBulan: () => {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, -7, 0, 0, 0));
  },

  // Membuat rentang 00:00:00 sampai 23:59:59 (WIB)
  getRentangHari: (tglString) => {
    return {
      awal: new Date(`${tglString}T00:00:00.000+07:00`),
      akhir: new Date(`${tglString}T23:59:59.999+07:00`)
    };
  }
};