import * as XLSX from "xlsx";
import { STATUS_SESI, TIPE_SESI, PERIODE_BELAJAR } from "./constants"; 

const TZ = PERIODE_BELAJAR.TIMEZONE;

// ============================================================================
// 1. HELPER INTERNAL (Format Khusus Laporan)
// ============================================================================
const formatTanggalLaporan = (tanggal) => {
  if (!tanggal) return "-";
  try {
    return new Date(tanggal).toLocaleDateString('id-ID', { 
      timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch (e) { return "-"; }
};

const formatJamLaporan = (tanggal) => {
  if (!tanggal) return "-";
  try {
    return new Date(tanggal).toLocaleTimeString('id-ID', {
      timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(/\./g, ':');
  } catch (e) { return "-"; }
};

// ============================================================================
// 2. FUNGSI MAPPER
// ============================================================================
const siapkanDataKelas = (data) => {
  return data.map(s => {
    const isVirtual = s.isVirtual === true;
    const isAlpha = s.status === STATUS_SESI.ALPA.id; 
    
    const namaSiswa = s.siswaId?.nama || "Siswa Dihapus";
    const kelasSiswa = s.siswaId?.kelas || "-";

    return {
      "Tanggal": formatTanggalLaporan(s.waktuMulai),
      "Mata Pelajaran": s.namaMapel || "-",
      "Nama Siswa": namaSiswa,
      "Kelas": kelasSiswa,
      "Jam Masuk": (isAlpha || isVirtual) ? "-" : formatJamLaporan(s.waktuMulai),
      "Jam Keluar": (isAlpha || isVirtual) ? "-" : (s.waktuSelesai ? formatJamLaporan(s.waktuSelesai) : "Belum Pulang"),
      "Status Kehadiran": isVirtual ? "ALPHA (SISTEM)" : (s.terlambatMenit > 0 ? `Telat ${s.terlambatMenit} mnt` : (s.status ? s.status.toUpperCase() : "-")),
      "Extra Konsul (Mnt)": s.konsulExtraMenit || 0,
      "Nilai Test": s.nilaiTest ?? "-",
      "Keterangan": isVirtual ? "Siswa tidak melakukan scan hingga jadwal berakhir" : "-"
    };
  });
};

const siapkanDataKonsul = (data) => {
  return data.map(s => {
    return {
      "Tanggal": formatTanggalLaporan(s.waktuMulai),
      "Nama Siswa": s.siswaId?.nama || "Siswa Dihapus",
      "Kelas": s.siswaId?.kelas || "-",
      "Mata Pelajaran": s.namaMapel || "Umum",
      "Jam Mulai": formatJamLaporan(s.waktuMulai),
      "Jam Selesai": s.waktuSelesai ? formatJamLaporan(s.waktuSelesai) : "Berjalan",
      "Durasi (Menit)": s.waktuSelesai ? Math.floor((new Date(s.waktuSelesai) - new Date(s.waktuMulai)) / 60000) : 0,
      "Status": s.status?.toUpperCase() || "-"
    };
  });
};

// 🚀 TAMBAHAN: Mapper Khusus Absen Staf / Pengajar
const siapkanDataAbsenStaf = (data) => {
  return data.map(a => {
    return {
      "Tanggal": formatTanggalLaporan(a.waktuMasuk),
      "Nama Pengajar": a.pengajarId?.nama || "Pengajar Dihapus",
      "Kode Pengajar": a.pengajarId?.kodePengajar || "-",
      "Clock-In (Masuk)": formatJamLaporan(a.waktuMasuk),
      "Clock-Out (Keluar)": a.waktuKeluar ? formatJamLaporan(a.waktuKeluar) : "Belum Pulang",
      "Durasi Kerja (Menit)": (a.waktuMasuk && a.waktuKeluar) ? Math.floor((new Date(a.waktuKeluar) - new Date(a.waktuMasuk)) / 60000) : 0,
      "Status": a.waktuKeluar ? "SELESAI" : "AKTIF BEKERJA"
    };
  });
};

// ============================================================================
// 3. FUNGSI UTAMA (DOWNLOADER)
// ============================================================================
export const unduhExcel = (data, tipe) => {
  if (typeof window === "undefined") return;

  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert("⚠️ Tidak ada data untuk diunduh pada filter ini.");
      return false;
    }

    let dataFormat = [];
    let namaSheet = "Laporan";

    // 🚀 PERBAIKAN: Routing data berdasarkan tipe menggunakan if-else
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
      // Fallback jika tipe tidak dikenali (Export data mentah)
      dataFormat = data;
      namaSheet = "Data_Mentah";
    }

    const worksheet = XLSX.utils.json_to_sheet(dataFormat);
    const workbook = XLSX.utils.book_new();
    
    // Auto-width kolom (Kode Bos yang sangat keren)
    const maxWidths = Object.keys(dataFormat[0] || {}).map(key => ({ wch: key.length + 12 }));
    worksheet["!cols"] = maxWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, namaSheet);
    
    // Format nama file
    const tglCetak = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
    const namaFileLabel = tipe.replace("-", "_").toUpperCase();
    
    XLSX.writeFile(workbook, `Laporan_Quantum_${namaFileLabel}_${tglCetak}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("[ERROR unduhExcel]:", error.message);
    alert("❌ Gagal mengunduh Excel: " + error.message);
    return false;
  }
};