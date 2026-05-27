import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR } from "./constants";
import { timeHelper } from "./timeHelper";

// ============================================================================
// FUNGSI PRIVAT
// ============================================================================
/**
 * @param {string|Object} ref
 * @returns {string}
 */
const toIdStr = (ref) => (ref?._id ? ref._id.toString() : String(ref));

/**
 * @param {string} idSiswa
 * @param {string} idJadwal
 * @returns {string}
 */
const buildKeyJadwal = (idSiswa, idJadwal) => `${idSiswa}|${idJadwal}`;

/**
 * @param {string} idSiswa
 * @param {string} namaMapel
 * @param {string} tglYMD
 * @returns {string}
 */
const buildKeyFallback = (idSiswa, namaMapel, tglYMD) =>
  `${idSiswa}|${(namaMapel ?? "").toLowerCase().trim()}|${tglYMD}`;

// ============================================================================
// FUNGSI PUBLIK
// ============================================================================
/**
 * @param {Object[]} [dataRiwayat=[]]
 * @param {Object[]} [dataJadwal=[]]
 * @param {Object[]} [dataSiswa=[]]
 * @returns {Object[]}
 */
export function kalkulasiAbsensiLengkap(
  dataRiwayat = [],
  dataJadwal  = [],
  dataSiswa   = []
) {
  const hasilGabungan = dataRiwayat.filter(
    (sesi) => sesi.jenisSesi === TIPE_SESI.KELAS
  );

  const setKeyJadwal   = new Set();
  const setKeyFallback = new Set();

  for (const sesi of hasilGabungan) {
    const idSiswa = toIdStr(sesi.siswaId);
    const tgl     = timeHelper.getTglJakarta(sesi.waktuMulai);

    if (sesi.jadwalId) {
      setKeyJadwal.add(buildKeyJadwal(idSiswa, sesi.jadwalId.toString()));
    }
    setKeyFallback.add(buildKeyFallback(idSiswa, sesi.namaMapel, tgl));
  }

  /** @type {Map<string, Object[]>} */
  const siswaPerKelas = dataSiswa.reduce((acc, siswa) => {
    const kelas = siswa.kelas ?? "";
    if (!acc.has(kelas)) acc.set(kelas, []);
    acc.get(kelas).push(siswa);
    return acc;
  }, new Map());

  for (const jadwal of dataJadwal) {
    if (!timeHelper.cekApakahJadwalLewat(jadwal.tanggal, jadwal.jamSelesai)) continue;

    const tglJadwal  = timeHelper.getTglJakarta(jadwal.tanggal);
    const idJadwal   = jadwal._id.toString();
    const siswaTarget = siswaPerKelas.get(jadwal.kelasTarget) ?? [];

    for (const siswa of siswaTarget) {
      const idSiswa = siswa._id.toString();

      const sudahHadir =
        setKeyJadwal.has(buildKeyJadwal(idSiswa, idJadwal)) ||
        setKeyFallback.has(buildKeyFallback(idSiswa, jadwal.mapel, tglJadwal));

      if (sudahHadir) continue;

      hasilGabungan.push({
        _id:             `virtual_${idJadwal}_${idSiswa}`,
        isVirtual:       true,
        jenisSesi:       TIPE_SESI.KELAS,
        namaMapel:       jadwal.mapel,
        siswaId:         siswa,
        jadwalId:        jadwal._id,
        waktuMulai:      new Date(`${tglJadwal}T${jadwal.jamMulai}:00${PERIODE_BELAJAR.ISO_OFFSET}`),
        status:          STATUS_SESI.ALPA.id,
        terlambatMenit:  0,
        konsulExtraMenit: 0,
      });
    }
  }

  return hasilGabungan.sort(
    (a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai)
  );
}

/**
 * @param {Object[]} [jadwal=[]]
 * @param {Object[]} [riwayat=[]]
 * @param {string}   periodeMulai
 * @param {string}   periodeAkhir
 * @returns {{
 *   jadwalAktif:   Array<{ item: Object, sesiTerkait: Object|null, sudahLewat: boolean }>,
 *   jadwalSelesai: Array<{ item: Object, sesiTerkait: Object|null, sudahLewat: boolean }>
 * }}
 */
export function pilahJadwalSiswa(jadwal = [], riwayat = [], periodeMulai, periodeAkhir) {
  const mapByJadwalId  = new Map();
  const mapByFallback  = new Map();

  for (const sesi of riwayat) {
    if (sesi.jenisSesi !== TIPE_SESI.KELAS) continue;

    if (sesi.jadwalId) {
      mapByJadwalId.set(sesi.jadwalId.toString(), sesi);
    }

    const tgl = timeHelper.getTglJakarta(sesi.waktuMulai);
    mapByFallback.set(
      `${(sesi.namaMapel ?? "").toLowerCase().trim()}|${tgl}`,
      sesi
    );
  }

  const jadwalAktif   = [];
  const jadwalSelesai = [];

  for (const j of jadwal) {
    const tglJadwal = timeHelper.getTglJakarta(j.tanggal);

    if (tglJadwal < periodeMulai || tglJadwal > periodeAkhir) continue;

    const sesiTerkait =
      mapByJadwalId.get(j._id.toString()) ??
      mapByFallback.get(
        `${(j.mapel ?? "").toLowerCase().trim()}|${tglJadwal}`
      ) ??
      null;

    const sudahLewat       = timeHelper.cekApakahJadwalLewat(j.tanggal, j.jamSelesai);
    const sesiSudahSelesai = sesiTerkait?.status === STATUS_SESI.SELESAI.id;
    const payload          = { item: j, sesiTerkait, sudahLewat };

    if (sudahLewat || sesiSudahSelesai) {
      jadwalSelesai.push(payload);
    } else {
      jadwalAktif.push(payload);
    }
  }

  return { jadwalAktif, jadwalSelesai };
}