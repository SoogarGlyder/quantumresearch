// ============================================================================
// 1. INTERNAL HELPERS (Pemisah Logika Kompleks & Timezone)
// ============================================================================
function dapatkanTanggalJakartaStr(tanggalObj) {
  if (!tanggalObj) return "";
  const d = new Date(tanggalObj);
  return isNaN(d) ? "" : d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}
function cekApakahJadwalLewat(tanggalJadwal, jamSelesai) {
  const sekarang = new Date();
  
  const tglSekarangStr = dapatkanTanggalJakartaStr(sekarang);
  const tglJadwalStr = dapatkanTanggalJakartaStr(tanggalJadwal);
  
  if (tglJadwalStr < tglSekarangStr) return true;
  
  if (tglJadwalStr === tglSekarangStr) {
    const [jamS, menitS] = jamSelesai.split(":").map(Number);
    
    const waktuBatasSelesai = new Date(sekarang.getTime());
    waktuBatasSelesai.setHours(jamS, menitS, 0, 0);
    
    return sekarang > waktuBatasSelesai;
  }

  return false;
}


// ============================================================================
// 2. FUNGSI UTAMA KALKULASI DATA
// ============================================================================
export function kalkulasiAbsensiLengkap(dataRiwayat = [], dataJadwal = [], dataSiswa = []) {
  let gabunganRiwayatKelas = dataRiwayat.filter(sesi => sesi.jenisSesi === "Kelas");

  const setKehadiran = new Set(
    gabunganRiwayatKelas.map(r => {
      const tgl = dapatkanTanggalJakartaStr(r.waktuMulai);
      const idSiswa = r.siswaId?._id ? r.siswaId._id.toString() : r.siswaId;
      return `${idSiswa}|${r.namaMapel}|${tgl}`;
    })
  );

  dataJadwal.forEach(jadwal => {
    const sudahLewat = cekApakahJadwalLewat(jadwal.tanggal, jadwal.jamSelesai);

    if (!sudahLewat) return;

    const tglJadwalStr = dapatkanTanggalJakartaStr(jadwal.tanggal);
    const siswaTarget = dataSiswa.filter(s => s.kelas === jadwal.kelasTarget);

    siswaTarget.forEach(siswa => {
      const idSiswaStr = siswa._id.toString();
      const kunciPencarian = `${idSiswaStr}|${jadwal.mapel}|${tglJadwalStr}`;
      
      if (!setKehadiran.has(kunciPencarian)) {
        gabunganRiwayatKelas.push({
          _id: `virtual_${jadwal._id}_${idSiswaStr}`,
          isVirtual: true,
          jenisSesi: "Kelas",
          namaMapel: jadwal.mapel,
          siswaId: siswa,
          waktuMulai: new Date(`${jadwal.tanggal}T${jadwal.jamMulai}:00`),
          status: "Tidak Hadir - Alpa", 
          terlambatMenit: 0,
          konsulExtraMenit: 0,
          tanggalAsli: jadwal.tanggal
        });
      }
    });
  });

  return gabunganRiwayatKelas.sort((a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai));
}

export function pilahJadwalSiswa(jadwal = [], riwayat = [], periodeMulai, periodeAkhir) {
  const jadwalAktif = [];
  const jadwalSelesai = [];

  const mapRiwayatSiswa = new Map();
  riwayat.forEach(r => {
    if (r.jenisSesi === "Kelas") {
      const tgl = dapatkanTanggalJakartaStr(r.waktuMulai);
      mapRiwayatSiswa.set(`${r.namaMapel}|${tgl}`, r);
    }
  });

  const jadwalDalamPeriode = jadwal.filter(j => {
    const tglJadwalStr = dapatkanTanggalJakartaStr(j.tanggal);
    return tglJadwalStr >= periodeMulai && tglJadwalStr <= periodeAkhir;
  });

  jadwalDalamPeriode.forEach(j => {
    const tglJadwalStr = dapatkanTanggalJakartaStr(j.tanggal);
    const kunciPencarian = `${j.mapel}|${tglJadwalStr}`;
    
    const sesiTerkait = mapRiwayatSiswa.get(kunciPencarian) || null;
    const sudahLewat = cekApakahJadwalLewat(j.tanggal, j.jamSelesai);

    const kelasSudahBerakhir = sudahLewat || (sesiTerkait && sesiTerkait.status === 'Selesai');
    
    const dataJadwalSiswa = { item: j, sesiTerkait, sudahLewat };

    if (kelasSudahBerakhir) {
      jadwalSelesai.push(dataJadwalSiswa);
    } else {
      jadwalAktif.push(dataJadwalSiswa);
    }
  });

  return { jadwalAktif, jadwalSelesai };
}