import { OPSI_KELAS, PERIODE_BELAJAR } from "./constants";
import { timeHelper } from "./timeHelper";

// ============================================================================
// 1. DATA MASTER KELAS
// ============================================================================

/** @type {Readonly<Array<{ id: string, nama: string, sesi: number }>>} */
export const DAFTAR_KELAS = Object.freeze([
  { id: "SMP-7",       nama: "7 SMP",              sesi: 1 },
  { id: "SMP-8",       nama: "8 SMP",              sesi: 1 },
  { id: "SMP-9",       nama: "9 SMP",              sesi: 1 },
  { id: "OSN-MAT",     nama: "OSN MAT",            sesi: 1 },
  { id: "OSN-IPA",     nama: "OSN IPA",            sesi: 1 },
  { id: "OSN-IPS",     nama: "OSN IPS",            sesi: 1 },
  { id: "SMA-10",      nama: "10 SMA",             sesi: 2 },
  { id: "SMA-11-IPA",  nama: "11 IPA SMA",         sesi: 2 },
  { id: "SMA-11-IPS",  nama: "11 IPS SMA",         sesi: 2 },
  { id: "SMA-12-IPA",  nama: "12 IPA SMA",         sesi: 3 },
  { id: "SMA-12-IPS",  nama: "12 IPS SMA",         sesi: 3 },
  { id: "SMA-ALUMNI",  nama: "Alumni / Gap Year",  sesi: 3 },
]);

const opsiKelasSet = new Set(OPSI_KELAS);
for (const kelas of DAFTAR_KELAS) {
  if (!opsiKelasSet.has(kelas.nama)) {
    throw new Error(
      `[jadwalHelper] Nama kelas "${kelas.nama}" (id: ${kelas.id}) tidak ditemukan di OPSI_KELAS. ` +
      `Pastikan DAFTAR_KELAS dan OPSI_KELAS selalu sinkron.`
    );
  }
}

// ============================================================================
// 2. KAMUS WAKTU PER SESI
// ============================================================================

/** @type {Readonly<Record<string, Record<number, { mulai: string, selesai: string }>>>} */
export const JAM_SESI = Object.freeze({
  normal: {
    1: { mulai: "14:30", selesai: "16:00" },
    2: { mulai: "16:00", selesai: "17:30" },
    3: { mulai: "17:30", selesai: "19:00" },
  },
  sabtu: {
    1: { mulai: "09:30", selesai: "11:00" },
    2: { mulai: "11:00", selesai: "12:30" },
    3: { mulai: "12:30", selesai: "14:00" },
  },
});

// ============================================================================
// 3. HELPER: JAM SESI
// ============================================================================
/**
 * @param {number|string} nomorSesi
 * @param {Date|string}   tanggalInput
 * @returns {{ mulai: string, selesai: string }}
 * @example
 * getWaktuBerdasarkanSesi(1, "2025-08-16") // { mulai: "09:30", selesai: "11:00" } (Sabtu)
 * getWaktuBerdasarkanSesi(2, "2025-08-18") // { mulai: "16:00", selesai: "17:30" } (Senin)
 */
export function getWaktuBerdasarkanSesi(nomorSesi, tanggalInput) {
  const tglStr  = timeHelper.getTglJakarta(tanggalInput);
  const [y, m, d] = tglStr.split("-").map(Number);

  const hariIndex = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const tipeHari  = hariIndex === 6 ? "sabtu" : "normal";

  return JAM_SESI[tipeHari][nomorSesi] ?? { mulai: "", selesai: "" };
}

// ============================================================================
// 4. GENERATOR KALENDER KERJA
// ============================================================================
/**
 * @param {string} tanggalAwalSenin
 * @param {number} [jumlahHari=14]
 * @returns {Array<{
 *   tanggalPenuh:   string,
 *   namaHari:       string,
 *   tanggalTampil:  string,
 *   isSabtu:        boolean,
 *   isToday:        boolean
 * }>}
 *
 * @example
 * generateKalenderKerja("2025-08-11", 7)
 * // → [{ tanggalPenuh: "2025-08-11", namaHari: "Senin", ... }, ...]
 */
export function generateKalenderKerja(tanggalAwalSenin, jumlahHari = 14) {
  const tanggalMulai = new Date(`${tanggalAwalSenin}T00:00:00${PERIODE_BELAJAR.ISO_OFFSET}`);
  const hariIni      = timeHelper.getTglJakarta(new Date());
  const daftarHari   = [];

  for (let i = 0; i < jumlahHari; i++) {
    const hariBidikan = new Date(tanggalMulai);
    hariBidikan.setDate(tanggalMulai.getDate() + i);

    const indexHari = hariBidikan.getDay();
    if (indexHari === 0) continue;

    const tglPenuh = timeHelper.getTglJakarta(hariBidikan);

    daftarHari.push({
      tanggalPenuh:  tglPenuh,
      namaHari:      hariBidikan.toLocaleDateString("id-ID", {
                       timeZone: PERIODE_BELAJAR.TIMEZONE,
                       weekday: "long",
                     }),
      tanggalTampil: hariBidikan.toLocaleDateString("id-ID", {
                       timeZone: PERIODE_BELAJAR.TIMEZONE,
                       day: "numeric",
                       month: "short",
                     }),
      isSabtu: indexHari === 6,
      isToday: tglPenuh === hariIni,
    });
  }

  return daftarHari;
}