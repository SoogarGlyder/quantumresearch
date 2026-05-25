import { PERIODE_BELAJAR } from "./constants"; 

const TZ = PERIODE_BELAJAR.TIMEZONE;

export const timeHelper = {
  /**
   * (Internal) Validasi keamanan: Mencegah error "Invalid Date" jika data corrupt.
   */
  _isValidDate: (d) => d instanceof Date && !isNaN(d),

  /**
   * (Internal) Helper untuk menangani overflow bulan (misal: bulan -1 menjadi Desember tahun lalu).
   * Mengembalikan string YYYY-MM-DD yang absolut dan aman dari pergeseran Timezone server.
   */
  _buildSafeYMD: (year, monthIndex, day) => {
    const temp = new Date(Date.UTC(year, monthIndex, day));
    const realY = temp.getUTCFullYear();
    const realM = String(temp.getUTCMonth() + 1).padStart(2, '0');
    const realD = String(temp.getUTCDate()).padStart(2, '0');
    return `${realY}-${realM}-${realD}`;
  },

  /**
   * Menghasilkan string tanggal format YYYY-MM-DD sesuai zona waktu.
   */
  getTglJakarta: (dateInput = new Date()) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (!timeHelper._isValidDate(d)) return "";
    return d.toLocaleDateString('en-CA', { timeZone: TZ }).split('T')[0];
  },

  /**
   * Format: "Senin, 17 Agustus 2025" (Untuk UI Aplikasi)
   */
  formatTanggalLengkap: (tanggalString) => {
    if (!tanggalString) return "-";
    const d = new Date(tanggalString);
    if (!timeHelper._isValidDate(d)) return "-";
    return d.toLocaleDateString('id-ID', { 
      timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  },

  /**
   * Format: "Sen, 17 Agt 2025" (Khusus untuk kolom sempit di Laporan Excel)
   */
  formatTanggalLaporan: (tanggalString) => {
    if (!tanggalString) return "-";
    const d = new Date(tanggalString);
    if (!timeHelper._isValidDate(d)) return "-";
    return d.toLocaleDateString('id-ID', { 
      timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  },

  /**
   * Format: "14:30"
   */
  formatJam: (waktuString) => {
    if (!waktuString) return "--:--";
    const d = new Date(waktuString);
    if (!timeHelper._isValidDate(d)) return "--:--";
    return d.toLocaleTimeString('id-ID', { 
      timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(/\./g, ':');
  },

  /**
   * Format: "Agustus 2025"
   */
  formatBulanTahun: (tanggalString = new Date()) => {
    if (!tanggalString) return "";
    const d = new Date(tanggalString);
    if (!timeHelper._isValidDate(d)) return "";
    const formatter = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, month: 'long', year: 'numeric' });
    return formatter.format(d);
  },

  /**
   * Mengembalikan selisih menit antara dua waktu.
   */
  hitungDurasiMenit: (waktuMulai, waktuSelesai) => {
    if (!waktuMulai || !waktuSelesai) return 0;
    const d1 = new Date(waktuMulai);
    const d2 = new Date(waktuSelesai);
    if (!timeHelper._isValidDate(d1) || !timeHelper._isValidDate(d2)) return 0;
    return Math.max(0, Math.floor((d2 - d1) / 60000));
  },

  /**
   * Mengecek apakah jam saat ini sudah melewati batas akhir jadwal.
   */
  cekApakahJadwalLewat: (tanggalJadwal, jamSelesai) => {
    const sekarang = new Date();
    const tglSekarangStr = timeHelper.getTglJakarta(sekarang);
    const tglJadwalStr = timeHelper.getTglJakarta(tanggalJadwal);
    
    if (tglJadwalStr < tglSekarangStr) return true;
    if (tglJadwalStr === tglSekarangStr) {
      const waktuBatasSelesai = new Date(`${tglJadwalStr}T${jamSelesai}:00${PERIODE_BELAJAR.ISO_OFFSET}`);
      return sekarang > waktuBatasSelesai;
    }
    return false;
  },

  /**
   * Mendapatkan rentang tanggal 1 hingga akhir bulan untuk Siswa. (Timezone Safe)
   */
  getRentangBulanSiswa: (dateInput = new Date()) => {
    const d = new Date(new Date(dateInput).toLocaleString("en-US", { timeZone: TZ }));
    const y = d.getFullYear();
    const m = d.getMonth();

    const startYMD = timeHelper._buildSafeYMD(y, m, 1);
    const endYMD = timeHelper._buildSafeYMD(y, m + 1, 0); // Hari ke-0 = hari terakhir bulan sebelumnya

    return {
      awal: new Date(`${startYMD}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${endYMD}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`)
    };
  },

  /**
   * Mendapatkan rentang cut-off tanggal 29 (bulan lalu/kini) s/d 28 (bulan kini/depan) untuk Pengajar. (Timezone Safe)
   */
  getRentangBulanStaf: (dateInput = new Date()) => {
    const d = new Date(new Date(dateInput).toLocaleString("en-US", { timeZone: TZ }));
    const y = d.getFullYear();
    const m = d.getMonth();
    const date = d.getDate();

    let startYMD, endYMD;
    if (date >= 29) {
      startYMD = timeHelper._buildSafeYMD(y, m, 29);
      endYMD = timeHelper._buildSafeYMD(y, m + 1, 28);
    } else {
      startYMD = timeHelper._buildSafeYMD(y, m - 1, 29);
      endYMD = timeHelper._buildSafeYMD(y, m, 28);
    }

    return {
      awal: new Date(`${startYMD}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${endYMD}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`)
    };
  },

  getAwalBulan: () => {
    return timeHelper.getRentangBulanSiswa().awal;
  },

  getRentangHari: (tglInput) => {
    const tglString = (tglInput instanceof Date) ? timeHelper.getTglJakarta(tglInput) : tglInput;
    return {
      awal: new Date(`${tglString}T00:00:00.000${PERIODE_BELAJAR.ISO_OFFSET}`),
      akhir: new Date(`${tglString}T23:59:59.999${PERIODE_BELAJAR.ISO_OFFSET}`)
    };
  }
};