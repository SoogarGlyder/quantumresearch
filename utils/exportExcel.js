import { STATUS_SESI, TIPE_SESI } from "./constants";
import { timeHelper } from "./timeHelper";

// ============================================================================
// FORMATTER — FUNGSI PRIVAT
// ============================================================================
/**
 * @param {Object[]}
 * @returns {Object[]}
 */
const formatDataKelas = (data) =>
  data.map((sesi) => {
    const isVirtual = sesi.isVirtual === true;
    const isAlpa    = sesi.status === STATUS_SESI.ALPA.id;
    const tidakScan = isAlpa || isVirtual;

    return {
      "Tanggal":           timeHelper.formatTanggalLaporan(sesi.waktuMulai),
      "Mata Pelajaran":    sesi.namaMapel ?? "-",
      "Nama Siswa":        sesi.siswaId?.nama ?? sesi.namaSiswa ?? "Siswa Tidak Ditemukan",
      "Kelas":             sesi.siswaId?.kelas ?? "-",
      "Jam Masuk":         tidakScan ? "-" : timeHelper.formatJam(sesi.waktuMulai),
      "Jam Keluar":        tidakScan
                             ? "-"
                             : (sesi.waktuSelesai
                                 ? timeHelper.formatJam(sesi.waktuSelesai)
                                 : "Belum Pulang"),
      "Status Kehadiran":  isVirtual
                             ? "ALPHA (SISTEM)"
                             : (sesi.terlambatMenit > 0
                                 ? `Telat ${sesi.terlambatMenit} mnt`
                                 : (sesi.status?.toUpperCase() ?? "-")),
      "Extra Konsul (Mnt)": sesi.konsulExtraMenit ?? 0,
      "Nilai Test":         sesi.nilaiTest ?? "-",
      "Keterangan":         isVirtual
                              ? "Siswa tidak melakukan scan hingga jadwal berakhir"
                              : "-",
    };
  });

/**
 * @param {Object[]} data
 * @returns {Object[]}
 */
const formatDataKonsul = (data) =>
  data.map((sesi) => ({
    "Tanggal":        timeHelper.formatTanggalLaporan(sesi.waktuMulai),
    "Nama Siswa":     sesi.siswaId?.nama ?? sesi.namaSiswa ?? "Siswa Tidak Ditemukan",
    "Kelas":          sesi.siswaId?.kelas ?? "-",
    "Mata Pelajaran": sesi.namaMapel ?? "Umum",
    "Jam Mulai":      timeHelper.formatJam(sesi.waktuMulai),
    "Jam Selesai":    sesi.waktuSelesai
                        ? timeHelper.formatJam(sesi.waktuSelesai)
                        : "Berjalan",
    "Durasi (Menit)": timeHelper.hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai),
    "Status":         sesi.status?.toUpperCase() ?? "-",
  }));

/**
 * @param {Object[]} data
 * @returns {Object[]}
 */
const formatDataAbsenStaf = (data) =>
  data.map((absen) => ({
    "Tanggal":              timeHelper.formatTanggalLaporan(absen.waktuMasuk),
    "Nama Pengajar":        absen.pengajarId?.nama ?? absen.namaPengajar ?? "Pengajar Tidak Ditemukan",
    "Kode Pengajar":        absen.pengajarId?.kodePengajar ?? "-",
    "Clock-In (Masuk)":     timeHelper.formatJam(absen.waktuMasuk),
    "Clock-Out (Keluar)":   absen.waktuKeluar
                              ? timeHelper.formatJam(absen.waktuKeluar)
                              : "Belum Pulang",
    "Durasi Kerja (Menit)": timeHelper.hitungDurasiMenit(absen.waktuMasuk, absen.waktuKeluar),
    "Status":               absen.waktuKeluar ? "SELESAI" : "AKTIF BEKERJA",
  }));

// ============================================================================
// LOOKUP TABLE FORMATTER
// ============================================================================

/** @type {Record<string, { format: Function, namaSheet: string }>} */
const FORMATTER_MAP = {
  [TIPE_SESI.KELAS]:  { format: formatDataKelas,     namaSheet: "Laporan_Kelas"  },
  [TIPE_SESI.KONSUL]: { format: formatDataKonsul,    namaSheet: "Laporan_Konsul" },
  "absen-staf":       { format: formatDataAbsenStaf, namaSheet: "Laporan_Staf"  },
};

// ============================================================================
// FUNGSI UTAMA
// ============================================================================
/**

 * @param {Object[]} data - Array data yang akan diekspor.
 * @param {string}   tipe - Tipe laporan: "kelas" | "konsul" | "absen-staf".
 * @returns {Promise<boolean>} True jika file berhasil dibuat dan diunduh.
 * @throws {Error} Jika tipe tidak dikenal atau proses XLSX gagal.
 *
 * @example
 * // Di komponen / Server Action caller:
 * try {
 *   const berhasil = await unduhExcel(dataSesi, "kelas");
 *   if (!berhasil) toast.warning("Tidak ada data untuk diunduh.");
 * } catch (err) {
 *   toast.error("Gagal mengunduh laporan: " + err.message);
 * }
 */
export const unduhExcel = async (data, tipe) => {
  if (typeof window === "undefined") return false;

  if (!Array.isArray(data) || data.length === 0) return false;

  const formatter = FORMATTER_MAP[tipe];
  if (!formatter) {
    throw new Error(
      `[exportExcel] Tipe laporan "${tipe}" tidak dikenal. ` +
      `Tipe yang valid: ${Object.keys(FORMATTER_MAP).join(", ")}.`
    );
  }

  const XLSX = await import("xlsx");

  const dataFormatted = formatter.format(data);
  const worksheet     = XLSX.utils.json_to_sheet(dataFormatted);
  const workbook      = XLSX.utils.book_new();

  worksheet["!cols"] = Object.keys(dataFormatted[0] ?? {}).map((key) => ({
    wch: key.length + 12,
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, formatter.namaSheet);

  const tglCetak      = timeHelper.getTglJakarta(new Date());
  const labelFile     = tipe.replaceAll("-", "_").toUpperCase();
  const namaFile      = `Laporan_Quantum_${labelFile}_${tglCetak}.xlsx`;

  XLSX.writeFile(workbook, namaFile);

  return true;
};