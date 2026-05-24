import { OPSI_KELAS, PERIODE_BELAJAR } from "./constants";
import { timeHelper } from "./timeHelper";

// ============================================================================
// 1. DATA MASTER KELAS
// ============================================================================
export const DAFTAR_KELAS_BIMBEL = [
  { id: "SMP-7", nama: OPSI_KELAS[0], sesi: 1 },
  { id: "SMP-8", nama: OPSI_KELAS[1], sesi: 1 },
  { id: "SMP-9", nama: OPSI_KELAS[2], sesi: 1 },
  { id: "OSN-MAT", nama: OPSI_KELAS[9], sesi: 1 },
  { id: "OSN-IPA", nama: OPSI_KELAS[10], sesi: 1 },
  { id: "OSN-IPS", nama: OPSI_KELAS[11], sesi: 1 },
  { id: "SMA-10", nama: OPSI_KELAS[3], sesi: 2 },
  { id: "SMA-11-IPA", nama: OPSI_KELAS[4], sesi: 2 },
  { id: "SMA-11-IPS", nama: OPSI_KELAS[5], sesi: 2 },
  { id: "SMA-12-IPA", nama: OPSI_KELAS[6], sesi: 3 },
  { id: "SMA-12-IPS", nama: OPSI_KELAS[7], sesi: 3 },
  { id: "SMA-ALUMNI", nama: OPSI_KELAS[8], sesi: 3 }
];

// ============================================================================
// 2. KAMUS WAKTU OTOMATIS
// ============================================================================
export const KAMUS_JAM_SESI = {
  normal: { 
    1: { mulai: "14:30", selesai: "16:00" },
    2: { mulai: "16:00", selesai: "17:30" },
    3: { mulai: "17:30", selesai: "19:00" }
  },
  sabtu: { 
    1: { mulai: "09:30", selesai: "11:00" },
    2: { mulai: "11:00", selesai: "12:30" },
    3: { mulai: "12:30", selesai: "14:00" }
  }
};

/**
 * Menentukan jam mulai dan selesai berdasarkan nomor sesi dan hari (Sabtu berbeda jam).
 * @param {number|string} nomorSesi - Sesi ke-1, 2, atau 3.
 * @param {string} tanggalString - Tanggal dalam format YYYY-MM-DD.
 * @returns {Object} Objek berisi { mulai: "HH:mm", selesai: "HH:mm" }
 */
export function getWaktuBerdasarkanSesi(nomorSesi, tanggalString) {
  const d = new Date(tanggalString);
  const isSabtu = d.getDay() === 6;
  const tipeHari = isSabtu ? "sabtu" : "normal";
  return KAMUS_JAM_SESI[tipeHari][nomorSesi] || { mulai: "", selesai: "" };
}

// ============================================================================
// 3. MESIN GENERATOR TANGGAL
// ============================================================================
/**
 * Menghasilkan array kalender selama 14 hari ke depan untuk keperluan pembuatan jadwal.
 * Mengabaikan hari Minggu (index 0).
 * @param {string} tanggalAwalSenin - Tanggal acuan awal (YYYY-MM-DD).
 * @returns {Array} Array objek data hari.
 */
export function generateDuaMingguKerja(tanggalAwalSenin) {
  const tanggalMulai = new Date(`${tanggalAwalSenin}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
  const tz = PERIODE_BELAJAR.TIMEZONE;
  const hariIni = timeHelper.getTglJakarta(new Date()); 
  const daftarHari = [];
  
  for (let i = 0; i < 14; i++) {
    const hariBidikan = new Date(tanggalMulai);
    hariBidikan.setDate(tanggalMulai.getDate() + i);

    const indexHari = hariBidikan.getDay();
    
    if (indexHari !== 0) { // Jika bukan hari Minggu
      const tglPenuh = timeHelper.getTglJakarta(hariBidikan); // Prinsip DRY
      
      daftarHari.push({
        tanggalPenuh: tglPenuh, 
        namaHari: hariBidikan.toLocaleDateString('id-ID', { timeZone: tz, weekday: 'long' }), 
        tanggalTampil: hariBidikan.toLocaleDateString('id-ID', { timeZone: tz, day: 'numeric', month: 'short' }), 
        isSabtu: indexHari === 6,
        isToday: tglPenuh === hariIni 
      });
    }
  }
  return daftarHari; 
}