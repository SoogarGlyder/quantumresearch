import { NextResponse } from "next/server";
import { KONFIGURASI_SISTEM, PERAN } from "./utils/constants";

export function proxy(request) {
  const path = request.nextUrl.pathname;
  
  const karcisId = request.cookies.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  const karcisPeran = request.cookies.get(KONFIGURASI_SISTEM.COOKIE_ROLE)?.value;
  
  const isPublicPath = path === KONFIGURASI_SISTEM.PATH_LOGIN;
  const isLoggedIn = !!karcisId;

  if (isPublicPath && request.nextUrl.searchParams.get("clear") === "true") {
    const response = NextResponse.next();
    response.cookies.delete(KONFIGURASI_SISTEM.COOKIE_NAME);
    response.cookies.delete(KONFIGURASI_SISTEM.COOKIE_ROLE);
    return response;
  }

  // ============================================================================
  // 1. PROTEKSI PENGUNJUNG TANPA LOGIN
  // ============================================================================
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL(KONFIGURASI_SISTEM.PATH_LOGIN, request.url));
  }

  // ============================================================================
  // 2. PROTEKSI PENGUNJUNG YANG SUDAH LOGIN
  // ============================================================================
  if (isLoggedIn) {
    
    // A. Jika sudah login tapi mencoba kembali ke halaman /login
    if (isPublicPath) {
      const destination = karcisPeran === PERAN.ADMIN.id ? PERAN.ADMIN.home : PERAN.SISWA.home;
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // B. Proteksi Area Admin (Siswa Mutlak Diblokir)
    if (path.startsWith(PERAN.ADMIN.home) && karcisPeran === PERAN.SISWA.id) {
      return NextResponse.redirect(new URL(PERAN.SISWA.home, request.url));
    }

    // C. Admin Tulen tidak boleh di halaman Dashboard Siswa/Umum ("/")
    if (path === PERAN.SISWA.home && karcisPeran === PERAN.ADMIN.id) {
      return NextResponse.redirect(new URL(PERAN.ADMIN.home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ]
};