import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // 🔥 Gunakan jose untuk edge runtime
import { KONFIGURASI_SISTEM, PERAN } from "./utils/constants";

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "quantum_secret_dev_key_2026_wajib_diganti_di_production");

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  
  const isPublicPath = path === KONFIGURASI_SISTEM.PATH_LOGIN;
  
  // Verifikasi JWT
  let sesi = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      sesi = payload;
    } catch {
      sesi = null; // Token tidak valid atau expired
    }
  }

  // 1. Jika mencoba akses login saat sudah login
  if (isPublicPath && sesi) {
    const destination = sesi.peran === PERAN.ADMIN.id ? PERAN.ADMIN.home : PERAN.SISWA.home;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. Jika akses area privat tanpa sesi
  if (!isPublicPath && !sesi) {
    return NextResponse.redirect(new URL(KONFIGURASI_SISTEM.PATH_LOGIN, request.url));
  }

  // 3. Proteksi Role (Admin vs Siswa)
  if (sesi) {
    if (path.startsWith(PERAN.ADMIN.home) && sesi.peran === PERAN.SISWA.id) {
      return NextResponse.redirect(new URL(PERAN.SISWA.home, request.url));
    }
    if (path === PERAN.SISWA.home && sesi.peran === PERAN.ADMIN.id) {
      return NextResponse.redirect(new URL(PERAN.ADMIN.home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};