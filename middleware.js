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
// ============================================================================

export async function middleware(request) {
  const path  = request.nextUrl.pathname;
  const token = request.cookies.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  
  // 👇 1. PISAHKAN DEFINISI RUTE PUBLIK & DEMO
  const isLoginPath = path === KONFIGURASI_SISTEM.PATH_LOGIN;
  const isDemoPath  = path === "/demo";

  let sesi = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      sesi = payload;
    } catch {
      sesi = null;
    }
  }

  // 👇 2. BERIKAN JALUR VIP UNTUK DEMO (Boleh masuk dengan atau tanpa sesi)
  if (isDemoPath) {
    return NextResponse.next();
  }

  // 👇 3. PENGGUNA SUDAH LOGIN TAPI KE HALAMAN LOGIN -> TENDANG KE BERANDA
  if (isLoginPath && sesi) {
    const berhakAksesAdmin =
      sesi.peran === PERAN.ADMIN.id ||
      (sesi.peran === PERAN.PENGAJAR.id &&
        sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK);

    const tujuan = berhakAksesAdmin ? PERAN.ADMIN.home : PERAN.SISWA.home;
    return NextResponse.redirect(new URL(tujuan, request.url));
  }

  // 👇 4. PENGGUNA BELUM LOGIN DAN BUKAN DI HALAMAN LOGIN -> TENDANG KE LOGIN
  if (!isLoginPath && !sesi) {
    return NextResponse.redirect(
      new URL(KONFIGURASI_SISTEM.PATH_LOGIN, request.url)
    );
  }

  // 👇 5. PROTEKSI AREA ADMIN
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

  // 👇 6. ADMIN MURNI NYASAR KE BERANDA SISWA -> KEMBALIKAN KE ADMIN
  if (sesi && path === PERAN.SISWA.home && sesi.peran === PERAN.ADMIN.id) {
    return NextResponse.redirect(new URL(PERAN.ADMIN.home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};