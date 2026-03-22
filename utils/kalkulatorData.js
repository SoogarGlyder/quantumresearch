import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR } from "./constants"; // 👈 Import Timezone

// ============================================================================
// 1. INTERNAL HELPERS
// ============================================================================

function dapatkanTanggalJakartaStr(tanggalObj) {
  if (!tanggalObj) return "";
  const d = new Date(tanggalObj);
  // Gunakan Timezone dari Constants
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
// 2. FUNGSI UTAMA (SUPER LOGIC)
// ============================================================================

export function kalkulasiAbsensiLengkap(dataRiwayat = [], dataJadwal = [], dataSiswa = []) {
  let gabunganRiwayat = dataRiwayat.filter(sesi => sesi.jenisSesi === TIPE_SESI.KELAS);

  const setKehadiran = new Set(
    gabunganRiwayat.map(r => {
      const tgl = dapatkanTanggalJakartaStr(r.waktuMulai);
      const idSiswa = r.siswaId?._id ? r.siswaId._id.toString() : r.siswaId;
      return `${idSiswa}|${r.namaMapel}|${tgl}`;
    })
  );

  dataJadwal.forEach(jadwal => {
    if (!cekApakahJadwalLewat(jadwal.tanggal, jadwal.jamSelesai)) return;

    const tglJadwalStr = dapatkanTanggalJakartaStr(jadwal.tanggal);
    const siswaTarget = dataSiswa.filter(s => s.kelas === jadwal.kelasTarget);

    siswaTarget.forEach(siswa => {
      const idSiswaStr = siswa._id.toString();
      const kunciPencarian = `${idSiswaStr}|${jadwal.mapel}|${tglJadwalStr}`;
      
      if (!setKehadiran.has(kunciPencarian)) {
        gabunganRiwayat.push({
          _id: `virtual_${jadwal._id}_${idSiswaStr}`,
          isVirtual: true,
          jenisSesi: TIPE_SESI.KELAS,
          namaMapel: jadwal.mapel,
          siswaId: siswa,
          waktuMulai: new Date(`${jadwal.tanggal}T${jadwal.jamMulai}:00`),
          status: STATUS_SESI.ALPA.id, // 👈 Pastikan menggunakan .id dari Object ALPA
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

  const mapRiwayatSiswa = new Map();
  riwayat.forEach(r => {
    if (r.jenisSesi === TIPE_SESI.KELAS) {
      const tgl = dapatkanTanggalJakartaStr(r.waktuMulai);
      mapRiwayatSiswa.set(`${r.namaMapel}|${tgl}`, r);
    }
  });

  jadwal.filter(j => {
    const tgl = dapatkanTanggalJakartaStr(j.tanggal);
    return tgl >= periodeMulai && tgl <= periodeAkhir;
  }).forEach(j => {
    const tglJadwalStr = dapatkanTanggalJakartaStr(j.tanggal);
    const kunci = `${j.mapel}|${tglJadwalStr}`;
    const sesiTerkait = mapRiwayatSiswa.get(kunci) || null;
    const sudahLewat = cekApakahJadwalLewat(j.tanggal, j.jamSelesai);

    const statusSelesai = STATUS_SESI.SELESAI.id; // 👈 Gunakan .id
    const kelasSudahBerakhir = sudahLewat || (sesiTerkait && sesiTerkait.status === statusSelesai);
    
    const payload = { item: j, sesiTerkait, sudahLewat };
    kelasSudahBerakhir ? jadwalSelesai.push(payload) : jadwalAktif.push(payload);
  });

  return { jadwalAktif, jadwalSelesai };
}