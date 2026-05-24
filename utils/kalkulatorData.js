import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR } from "./constants"; 
import { timeHelper } from "./timeHelper"; // Memanggil dewa waktu

export function kalkulasiAbsensiLengkap(dataRiwayat = [], dataJadwal = [], dataSiswa = []) {
  const gabunganRiwayat = [...dataRiwayat.filter(sesi => sesi.jenisSesi === TIPE_SESI.KELAS)];

  const mapJadwalId = new Set();
  const mapFallback = new Set();

  gabunganRiwayat.forEach(r => {
    const idSiswa = r.siswaId?._id ? r.siswaId._id.toString() : String(r.siswaId);
    if (r.jadwalId) {
      mapJadwalId.add(`${idSiswa}|${r.jadwalId.toString()}`);
    }
    const tgl = timeHelper.getTglJakarta(r.waktuMulai);
    const mapelLower = r.namaMapel ? r.namaMapel.toLowerCase().trim() : "";
    mapFallback.add(`${idSiswa}|${mapelLower}|${tgl}`);
  });

  const siswaPerKelas = dataSiswa.reduce((acc, s) => {
    if (!acc[s.kelas]) acc[s.kelas] = [];
    acc[s.kelas].push(s);
    return acc;
  }, {});

  dataJadwal.forEach(jadwal => {
    if (!timeHelper.cekApakahJadwalLewat(jadwal.tanggal, jadwal.jamSelesai)) return;

    const tglJadwalStr = timeHelper.getTglJakarta(jadwal.tanggal);
    const mapelLower = jadwal.mapel ? jadwal.mapel.toLowerCase().trim() : "";
    const idJadwalStr = jadwal._id.toString();

    const siswaTarget = siswaPerKelas[jadwal.kelasTarget] || [];

    siswaTarget.forEach(siswa => {
      const idSiswaStr = siswa._id.toString();
      
      const jodohByJadwal = mapJadwalId.has(`${idSiswaStr}|${idJadwalStr}`);
      const jodohByFallback = mapFallback.has(`${idSiswaStr}|${mapelLower}|${tglJadwalStr}`);
      
      if (!jodohByJadwal && !jodohByFallback) {
        gabunganRiwayat.push({
          _id: `virtual_${jadwal._id}_${idSiswaStr}`,
          isVirtual: true,
          jenisSesi: TIPE_SESI.KELAS,
          namaMapel: jadwal.mapel,
          siswaId: siswa,
          jadwalId: jadwal._id,
          waktuMulai: new Date(`${jadwal.tanggal}T${jadwal.jamMulai}:00${PERIODE_BELAJAR.ISO_OFFSET}`),
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
      if (r.jadwalId) {
        mapRiwayatByJadwal.set(r.jadwalId.toString(), r);
      }
      const tgl = timeHelper.getTglJakarta(r.waktuMulai);
      const mapelLower = r.namaMapel ? r.namaMapel.toLowerCase().trim() : "";
      mapRiwayatByFallback.set(`${mapelLower}|${tgl}`, r);
    }
  });

  jadwal.filter(j => {
    const tgl = timeHelper.getTglJakarta(j.tanggal);
    return tgl >= periodeMulai && tgl <= periodeAkhir;
  }).forEach(j => {
    const tglJadwalStr = timeHelper.getTglJakarta(j.tanggal);
    const mapelLower = j.mapel ? j.mapel.toLowerCase().trim() : "";
    
    let sesiTerkait = mapRiwayatByJadwal.get(j._id.toString());
    if (!sesiTerkait) {
      sesiTerkait = mapRiwayatByFallback.get(`${mapelLower}|${tglJadwalStr}`) || null;
    }

    const sudahLewat = timeHelper.cekApakahJadwalLewat(j.tanggal, j.jamSelesai);
    const statusSelesai = STATUS_SESI.SELESAI.id; 
    const kelasSudahBerakhir = sudahLewat || (sesiTerkait && sesiTerkait.status === statusSelesai);
    
    const payload = { item: j, sesiTerkait, sudahLewat };
    kelasSudahBerakhir ? jadwalSelesai.push(payload) : jadwalAktif.push(payload);
  });

  return { jadwalAktif, jadwalSelesai };
}