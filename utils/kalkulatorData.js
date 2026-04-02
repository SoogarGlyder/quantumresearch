import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR } from "./constants"; 

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

function dapatkanTanggalJakartaStr(tanggalObj) {
  if (!tanggalObj) return "";
  // Bypass jika format sudah YYYY-MM-DD
  if (typeof tanggalObj === 'string' && tanggalObj.length === 10) return tanggalObj;
  
  const d = new Date(tanggalObj);
  return isNaN(d) ? "" : d.toLocaleDateString('en-CA', { timeZone: PERIODE_BELAJAR.TIMEZONE });
}

function cekApakahJadwalLewat(tanggalJadwal, jamSelesai) {
  const sekarang = new Date();
  const tglSekarangStr = dapatkanTanggalJakartaStr(sekarang);
  const tglJadwalStr = dapatkanTanggalJakartaStr(tanggalJadwal);
  
  if (tglJadwalStr < tglSekarangStr) return true;
  
  if (tglJadwalStr === tglSekarangStr) {
    const [jamS, menitS] = jamSelesai.split(":").map(Number);
    const waktuBatasSelesai = new Date();
    waktuBatasSelesai.setHours(jamS, menitS, 0, 0);
    
    return sekarang > waktuBatasSelesai;
  }
  return false;
}

// ============================================================================
// 2. FUNGSI UTAMA (SUPER LOGIC DUAL-MATCHING)
// ============================================================================

export function kalkulasiAbsensiLengkap(dataRiwayat = [], dataJadwal = [], dataSiswa = []) {
  // Jangan manipulasi data asli, gunakan spread operator
  const gabunganRiwayat = [...dataRiwayat.filter(sesi => sesi.jenisSesi === TIPE_SESI.KELAS)];

  // 🚀 PENYELAMAT BUG: Kita gunakan 2 Peta Pencarian
  const mapJadwalId = new Set();
  const mapFallback = new Set();

  gabunganRiwayat.forEach(r => {
    const idSiswa = r.siswaId?._id ? r.siswaId._id.toString() : String(r.siswaId);
    
    // Peta 1: Jodohkan pakai ID Jadwal (Tingkat Akurasi 100%)
    if (r.jadwalId) {
      mapJadwalId.add(`${idSiswa}|${r.jadwalId.toString()}`);
    }
    
    // Peta 2: Jodohkan pakai Tanggal + Mapel (Untuk fallback data lama)
    const tgl = dapatkanTanggalJakartaStr(r.waktuMulai);
    const mapelLower = r.namaMapel ? r.namaMapel.toLowerCase().trim() : "";
    mapFallback.add(`${idSiswa}|${mapelLower}|${tgl}`);
  });

  dataJadwal.forEach(jadwal => {
    if (!cekApakahJadwalLewat(jadwal.tanggal, jadwal.jamSelesai)) return;

    const tglJadwalStr = dapatkanTanggalJakartaStr(jadwal.tanggal);
    const mapelLower = jadwal.mapel ? jadwal.mapel.toLowerCase().trim() : "";
    const idJadwalStr = jadwal._id.toString();

    const siswaTarget = dataSiswa.filter(s => s.kelas === jadwal.kelasTarget);

    siswaTarget.forEach(siswa => {
      const idSiswaStr = siswa._id.toString();
      
      // CEK JODOH PRIORITAS 1 & 2
      const jodohByJadwal = mapJadwalId.has(`${idSiswaStr}|${idJadwalStr}`);
      const jodohByFallback = mapFallback.has(`${idSiswaStr}|${mapelLower}|${tglJadwalStr}`);
      
      // Jika TIDAK ADA di kedua pencarian, baru buatkan ALPA
      if (!jodohByJadwal && !jodohByFallback) {
        gabunganRiwayat.push({
          _id: `virtual_${jadwal._id}_${idSiswaStr}`,
          isVirtual: true,
          jenisSesi: TIPE_SESI.KELAS,
          namaMapel: jadwal.mapel,
          siswaId: siswa,
          jadwalId: jadwal._id,
          waktuMulai: new Date(`${jadwal.tanggal}T${jadwal.jamMulai}:00`),
          status: STATUS_SESI.ALPA.id, 
          terlambatMenit: 0,
          konsulExtraMenit: 0,
          tanggalAsli: jadwal.tanggal
        });
      }
    });
  });

  return gabunganRiwayat.sort((a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai));
}

export function pilahJadwalSiswa(jadwal = [], riwayat = [], periodeMulai, periodeAkhir) {
  const jadwalAktif = [];
  const jadwalSelesai = [];

  const mapRiwayatByJadwal = new Map();
  const mapRiwayatByFallback = new Map();

  riwayat.forEach(r => {
    if (r.jenisSesi === TIPE_SESI.KELAS) {
      // Sama, kita buat 2 jenis pencocokan untuk UI Siswa
      if (r.jadwalId) {
        mapRiwayatByJadwal.set(r.jadwalId.toString(), r);
      }
      const tgl = dapatkanTanggalJakartaStr(r.waktuMulai);
      const mapelLower = r.namaMapel ? r.namaMapel.toLowerCase().trim() : "";
      mapRiwayatByFallback.set(`${mapelLower}|${tgl}`, r);
    }
  });

  jadwal.filter(j => {
    const tgl = dapatkanTanggalJakartaStr(j.tanggal);
    return tgl >= periodeMulai && tgl <= periodeAkhir;
  }).forEach(j => {
    const tglJadwalStr = dapatkanTanggalJakartaStr(j.tanggal);
    const mapelLower = j.mapel ? j.mapel.toLowerCase().trim() : "";
    
    // Cari pakai jadwalId dulu, kalau nggak ada baru coba pakai string mapel
    let sesiTerkait = mapRiwayatByJadwal.get(j._id.toString());
    if (!sesiTerkait) {
      sesiTerkait = mapRiwayatByFallback.get(`${mapelLower}|${tglJadwalStr}`) || null;
    }

    const sudahLewat = cekApakahJadwalLewat(j.tanggal, j.jamSelesai);
    const statusSelesai = STATUS_SESI.SELESAI.id; 
    const kelasSudahBerakhir = sudahLewat || (sesiTerkait && sesiTerkait.status === statusSelesai);
    
    const payload = { item: j, sesiTerkait, sudahLewat };
    kelasSudahBerakhir ? jadwalSelesai.push(payload) : jadwalAktif.push(payload);
  });

  return { jadwalAktif, jadwalSelesai };
}