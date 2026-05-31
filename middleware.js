import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { KONFIGURASI_SISTEM, PERAN, PANGKAT_PENGAJAR } from "./utils/constants";

// ============================================================================
// JWT SECRET
// ============================================================================
/**
 * @returns {Uint8Array}
 * @throws {Error}
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error(
      "[middleware] JWT_SECRET belum diset di environment variables."
    );
  }
  return new TextEncoder().encode(secret);
};

// ============================================================================
// MIDDLEWARE — Next.js Route Protection
//
// Dieksekusi di Edge Runtime sebelum setiap request.
// Memverifikasi JWT dari cookie dan menentukan redirect berdasarkan peran.
//
// Alur keputusan:
//   1. Pengguna dengan sesi aktif, tidak boleh akses halaman login
//   2. Pengguna tanpa sesi, tidak boleh akses halaman dalam
//   3. Area /admin, hanya Admin, Staff Akademik, dan Kakak Asuh
//   4. Admin murni di "/", redirect ke /admin
// ============================================================================

export async function middleware(request) {
  const path        = request.nextUrl.pathname;
  const token       = request.cookies.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  const isPublicPath = path === KONFIGURASI_SISTEM.PATH_LOGIN;

  let sesi = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      sesi = payload;
    } catch {
      sesi = null;
    }
  }

  if (isPublicPath && sesi) {
    const berhakAksesAdmin =
      sesi.peran === PERAN.ADMIN.id ||
      (sesi.peran === PERAN.PENGAJAR.id &&
        sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK);

    const tujuan = berhakAksesAdmin ? PERAN.ADMIN.home : PERAN.SISWA.home;
    return NextResponse.redirect(new URL(tujuan, request.url));
  }

  if (!isPublicPath && !sesi) {
    return NextResponse.redirect(
      new URL(KONFIGURASI_SISTEM.PATH_LOGIN, request.url)
    );
  }

  if (sesi && path.startsWith(PERAN.ADMIN.home)) {
    const adalahAdmin        = sesi.peran === PERAN.ADMIN.id;
    const adalahStafBerwenang =
      sesi.peran === PERAN.PENGAJAR.id &&
      (sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK ||
        sesi.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH);

    if (!adalahAdmin && !adalahStafBerwenang) {
      return NextResponse.redirect(new URL(PERAN.SISWA.home, request.url));
    }
  }

  if (sesi && path === PERAN.SISWA.home && sesi.peran === PERAN.ADMIN.id) {
    return NextResponse.redirect(new URL(PERAN.ADMIN.home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};