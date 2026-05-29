import { authHelper } from "./authHelper";
import { PERAN, PANGKAT_PENGAJAR, CABANG_QUANTUM } from "./constants";

// ============================================================================
// GUARD HELPER — Otorisasi Terpusat (RBAC)
// ============================================================================

/**
 * @returns {Promise<import("./authHelper").SesiData|null>}
 */
export async function ambilSesiAktif() {
  const sesi = await authHelper.ambilSesi();
  if (!sesi?.userId) return null;
  return sesi;
}

/**
 * @returns {Promise<import("./authHelper").SesiData|null>}
 */
export async function guardSiswa() {
  const sesi = await ambilSesiAktif();
  if (!sesi) return null;
  if (sesi.peran !== PERAN.SISWA.id) return null;
  return sesi;
}

/**
 * @param {string[]} [roleWajib=[PERAN.PENGAJAR.id, PERAN.ADMIN.id]]
 * @returns {Promise<{ userId: string, peran: string }|null>}
 */
export async function guardPengajar(
  roleWajib = [PERAN.PENGAJAR.id, PERAN.ADMIN.id]
) {
  const sesi = await ambilSesiAktif();
  if (!sesi) return null;

  if (
    roleWajib.includes(PERAN.ADMIN.id) &&
    sesi.peran === PERAN.PENGAJAR.id &&
    sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK
  ) {
    return { userId: sesi.userId, peran: sesi.peran, kodeCabang: sesi.kodeCabang };
  }

  if (!roleWajib.includes(sesi.peran)) return null;
  return { userId: sesi.userId, peran: sesi.peran, kodeCabang: sesi.kodeCabang };
}

/**
 * @returns {Promise<boolean>}
 */
export async function guardAdmin() {
  const sesi = await ambilSesiAktif();
  if (!sesi) return false;
  if (sesi.peran === PERAN.ADMIN.id) return true;
  if (
    sesi.peran === PERAN.PENGAJAR.id &&
    (sesi.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH ||
      sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK)
  ) {
    return true;
  }
  return false;
}

/**
 * @returns {Promise<boolean>}
 */
export async function guardAdminEdit() {
  const sesi = await ambilSesiAktif();
  if (!sesi) return false;
  if (sesi.peran === PERAN.ADMIN.id) return true;
  if (
    sesi.peran === PERAN.PENGAJAR.id &&
    sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK
  ) {
    return true;
  }
  return false;
}

/**
 * @returns {Promise<boolean>}
 */
export async function guardSuperAdmin() {
  const sesi = await ambilSesiAktif();
  if (!sesi) return false;
  return (
    sesi.peran === PERAN.ADMIN.id &&
    sesi.kodeCabang === CABANG_QUANTUM.PUSAT.id
  );
}

// ============================================================================
// HELPER: FILTER QUERY CABANG
// ============================================================================

/**
 * @param {string|null} kodeCabang
 * @returns {{ kodeCabang: string }|{}}
 *
 * @example
 * const filterCabang = buildFilterCabang(sesi.kodeCabang);
 * const data = await User.find({ peran: PERAN.SISWA.id, ...filterCabang });
 */
export function buildFilterCabang(kodeCabang) {
  if (!kodeCabang || kodeCabang === CABANG_QUANTUM.PUSAT.id) return {};
  return { kodeCabang };
}