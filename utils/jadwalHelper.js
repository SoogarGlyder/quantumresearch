import { OPSI_KELAS, PERIODE_BELAJAR } from "./constants";

// ============================================================================
// 1. DATA MASTER KELAS
// ============================================================================
export const DAFTAR_KELAS_BIMBEL = [
  { id: "SMP-7", nama: OPSI_KELAS[0], sesi: 1 },
  { id: "SMP-8", nama: OPSI_KELAS[1], sesi: 1 },
  { id: "SMP-9", nama: OPSI_KELAS[2], sesi: 1 },
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

export function getWaktuBerdasarkanSesi(nomorSesi, tanggalString) {
  const d = new Date(tanggalString);
  const isSabtu = d.getDay() === 6;
  const tipeHari = isSabtu ? "sabtu" : "normal";
  return KAMUS_JAM_SESI[tipeHari][nomorSesi] || { mulai: "", selesai: "" };
}

// ============================================================================
// 3. MESIN GENERATOR TANGGAL
// ============================================================================
export function generateDuaMingguKerja(tanggalAwalSenin) {
  // 👈 Gunakan offset ISO dari constants
  const tanggalMulai = new Date(`${tanggalAwalSenin}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
  const tz = PERIODE_BELAJAR.TIMEZONE;
  const hariIni = new Date().toLocaleDateString('en-CA', { timeZone: tz });
  const daftarHari = [];
  
  for (let i = 0; i < 14; i++) {
    const hariBidikan = new Date(tanggalMulai);
    hariBidikan.setDate(tanggalMulai.getDate() + i);

    const indexHari = hariBidikan.getDay();
    
    if (indexHari !== 0) {
      const tglPenuh = hariBidikan.toLocaleDateString('en-CA', { timeZone: tz });
      
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