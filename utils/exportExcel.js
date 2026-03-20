import * as XLSX from "xlsx";

// ============================================================================
// 1. HELPER FUNGSI (Poin 29: Proteksi & Format Data)
// ============================================================================
const formatTanggal = (tanggal) => {
  if (!tanggal) return "-";
  try {
    return new Date(tanggal).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
  } catch (e) { return "-"; }
};

const formatJam = (tanggal) => {
  if (!tanggal) return "-";
  try {
    return new Date(tanggal).toLocaleTimeString('id-ID', {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  } catch (e) { return "-"; }
};

const hitungDurasiMenit = (mulai, selesai) => {
  if (!mulai || !selesai) return 0;
  try {
    const durasi = Math.floor((new Date(selesai) - new Date(mulai)) / 60000);
    return durasi > 0 ? durasi : 0;
  } catch (e) { return 0; }
};


// ============================================================================
// 2. FUNGSI MAPPER (Transformasi Data ke Format Excel)
// ============================================================================
const siapkanDataKelas = (data) => {
  return data.map(s => {
    const isTidakHadir = s.status?.toLowerCase().includes('tidak hadir');
    const namaSiswa = s.siswaId?.nama || "Siswa Dihapus";
    const kelasSiswa = s.siswaId?.kelas || "-";

    return {
      "Tanggal": formatTanggal(s.waktuMulai),
      "Mata Pelajaran": s.namaMapel || "-",
      "Nama Siswa": namaSiswa,
      "Kelas": kelasSiswa,
      "Jam Masuk": isTidakHadir ? "-" : formatJam(s.waktuMulai),
      "Jam Keluar": isTidakHadir ? "-" : (s.waktuSelesai ? formatJam(s.waktuSelesai) : "Belum Pulang"),
      "Status Kehadiran": isTidakHadir ? s.status : (s.terlambatMenit > 0 ? `Telat ${s.terlambatMenit} menit` : "Tepat Waktu"),
      "Extra Konsul (Menit)": s.konsulExtraMenit || 0,
      "Status Sesi": s.status || "-"
    };
  });
};

const siapkanDataKonsul = (data) => {
  return data.map(s => {
    const namaSiswa = s.siswaId?.nama || "Siswa Dihapus";
    const kelasSiswa = s.siswaId?.kelas || "-";

    return {
      "Tanggal": formatTanggal(s.waktuMulai),
      "Nama Siswa": namaSiswa,
      "Kelas": kelasSiswa,
      "Mata Pelajaran": s.namaMapel || "Umum",
      "Jam Mulai": formatJam(s.waktuMulai),
      "Jam Selesai": s.waktuSelesai ? formatJam(s.waktuSelesai) : "Berjalan",
      "Durasi (Menit)": hitungDurasiMenit(s.waktuMulai, s.waktuSelesai),
      "Status Sesi": s.status || "-"
    };
  });
};


// ============================================================================
// 3. FUNGSI UTAMA (EKSPORT EXCEL)
// ============================================================================
export const unduhExcel = (data, tipe) => {
  if (typeof window === "undefined") return;

  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("[EXPORT EXCEL]: Data kosong, pembatalan ekspor.");
      return false;
    }

    let dataFormat = [];
    if (tipe === "kelas") {
      dataFormat = siapkanDataKelas(data);
    } else if (tipe === "konsul") {
      dataFormat = siapkanDataKonsul(data);
    } else {
      throw new Error("Tipe ekspor tidak dikenal.");
    }

    const worksheet = XLSX.utils.json_to_sheet(dataFormat);
    const workbook = XLSX.utils.book_new();
    
    const maxWidths = Object.keys(dataFormat[0] || {}).map(key => ({ wch: key.length + 10 }));
    worksheet["!cols"] = maxWidths;

    const namaSheet = tipe === "kelas" ? "Rekap_Kelas" : "Rekap_Konsul";
    XLSX.utils.book_append_sheet(workbook, worksheet, namaSheet);
    
    const tglCetak = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\//g, '-');
    const namaFile = `Laporan_Quantum_${tipe.toUpperCase()}_${tglCetak}.xlsx`;
    
    XLSX.writeFile(workbook, namaFile);
    return true;

  } catch (error) {
    console.error("[ERROR unduhExcel]:", error.message);
    return false;
  }
};