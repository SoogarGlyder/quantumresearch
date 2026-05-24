import { STATUS_SESI, TIPE_SESI } from "./constants"; 
import { timeHelper } from "./timeHelper";

const siapkanDataKelas = (data) => {
  return data.map(s => {
    const isVirtual = s.isVirtual === true;
    const isAlpha = s.status === STATUS_SESI.ALPA.id; 
    const namaSiswa = s.siswaId?.nama || s.namaSiswa || "Siswa Tidak Ditemukan";
    const kelasSiswa = s.siswaId?.kelas || "-";

    return {
      "Tanggal": timeHelper.formatTanggalLaporan(s.waktuMulai),
      "Mata Pelajaran": s.namaMapel || "-",
      "Nama Siswa": namaSiswa,
      "Kelas": kelasSiswa,
      "Jam Masuk": (isAlpha || isVirtual) ? "-" : timeHelper.formatJam(s.waktuMulai),
      "Jam Keluar": (isAlpha || isVirtual) ? "-" : (s.waktuSelesai ? timeHelper.formatJam(s.waktuSelesai) : "Belum Pulang"),
      "Status Kehadiran": isVirtual ? "ALPHA (SISTEM)" : (s.terlambatMenit > 0 ? `Telat ${s.terlambatMenit} mnt` : (s.status ? s.status.toUpperCase() : "-")),
      "Extra Konsul (Mnt)": s.konsulExtraMenit || 0,
      "Nilai Test": s.nilaiTest ?? "-",
      "Keterangan": isVirtual ? "Siswa tidak melakukan scan hingga jadwal berakhir" : "-"
    };
  });
};

const siapkanDataKonsul = (data) => {
  return data.map(s => ({
    "Tanggal": timeHelper.formatTanggalLaporan(s.waktuMulai),
    "Nama Siswa": s.siswaId?.nama || s.namaSiswa || "Siswa Tidak Ditemukan",
    "Kelas": s.siswaId?.kelas || "-",
    "Mata Pelajaran": s.namaMapel || "Umum",
    "Jam Mulai": timeHelper.formatJam(s.waktuMulai),
    "Jam Selesai": s.waktuSelesai ? timeHelper.formatJam(s.waktuSelesai) : "Berjalan",
    "Durasi (Menit)": timeHelper.hitungDurasiMenit(s.waktuMulai, s.waktuSelesai),
    "Status": s.status?.toUpperCase() || "-"
  }));
};

const siapkanDataAbsenStaf = (data) => {
  return data.map(a => ({
    "Tanggal": timeHelper.formatTanggalLaporan(a.waktuMasuk),
    "Nama Pengajar": a.pengajarId?.nama || a.namaPengajar || "Pengajar Tidak Ditemukan",
    "Kode Pengajar": a.pengajarId?.kodePengajar || "-",
    "Clock-In (Masuk)": timeHelper.formatJam(a.waktuMasuk),
    "Clock-Out (Keluar)": a.waktuKeluar ? timeHelper.formatJam(a.waktuKeluar) : "Belum Pulang",
    "Durasi Kerja (Menit)": timeHelper.hitungDurasiMenit(a.waktuMasuk, a.waktuKeluar),
    "Status": a.waktuKeluar ? "SELESAI" : "AKTIF BEKERJA"
  }));
};

/**
 * Mengunduh array data menjadi file Excel secara Asynchronous
 */
export const unduhExcel = async (data, tipe) => {
  if (typeof window === "undefined") return;

  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert("⚠️ Tidak ada data untuk diunduh pada filter ini.");
      return false;
    }

    const XLSX = await import("xlsx");

    let dataFormat = [];
    let namaSheet = "Laporan";

    if (tipe === TIPE_SESI.KELAS || tipe === "kelas") {
      dataFormat = siapkanDataKelas(data);
      namaSheet = "Laporan_Kelas";
    } else if (tipe === TIPE_SESI.KONSUL || tipe === "konsul") {
      dataFormat = siapkanDataKonsul(data);
      namaSheet = "Laporan_Konsul";
    } else if (tipe === "absen-staf") {
      dataFormat = siapkanDataAbsenStaf(data);
      namaSheet = "Laporan_Staf";
    } else {
      dataFormat = data;
      namaSheet = "Data_Mentah";
    }

    const worksheet = XLSX.utils.json_to_sheet(dataFormat);
    const workbook = XLSX.utils.book_new();
    const maxWidths = Object.keys(dataFormat[0] || {}).map(key => ({ wch: key.length + 12 }));
    worksheet["!cols"] = maxWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, namaSheet);
    
    const tglCetak = timeHelper.getTglJakarta(new Date());
    const namaFileLabel = tipe.replace("-", "_").toUpperCase();
    
    XLSX.writeFile(workbook, `Laporan_Quantum_${namaFileLabel}_${tglCetak}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("[exportExcel] Error:", error.message);
    alert("❌ Gagal mengunduh Excel: " + error.message);
    return false;
  }
};