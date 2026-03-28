import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // 🚀 Ambil Karcis (Token) dan Peran dari Cookie
  const karcisId = request.cookies.get("karcis_quantum")?.value;
  const karcisPeran = request.cookies.get("peran_quantum")?.value;
  
  const isPublicPath = path === "/login";
  const isLoggedIn = !!karcisId;

  // 🛡️ PENAWAR INFINITE LOOP: Pembersihan Sesi Paksa
  if (isPublicPath && request.nextUrl.searchParams.get("clear") === "true") {
    const response = NextResponse.next();
    response.cookies.delete("karcis_quantum");
    response.cookies.delete("peran_quantum");
    return response;
  }

  // ============================================================================
  // 1. PROTEKSI PENGUNJUNG TANPA LOGIN
  // ============================================================================
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ============================================================================
  // 2. PROTEKSI PENGUNJUNG YANG SUDAH LOGIN (REDIRECT DARI /LOGIN)
  // ============================================================================
  if (isLoggedIn) {
    
    // A. JIKA SUDAH LOGIN TAPI COBA BUKA /LOGIN (Banting ke Dashboard masing-masing)
    if (isPublicPath) {
      if (karcisPeran === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url)); // Siswa & Pengajar ke Beranda
    }

    // B. PROTEKSI JALUR ADMIN (Hanya Admin yang boleh masuk /admin/*)
    if (path.startsWith("/admin") && karcisPeran !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // C. PROTEKSI JALUR SISWA/PENGAJAR (Admin dilarang masuk ke beranda siswa /)
    // Jika Admin coba buka "/", paksa dia balik ke "/admin"
    if (path === "/" && karcisPeran === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

// ============================================================================
// TARGET PENJAGAAN (MATCHER STANDAR INDUSTRI)
// ============================================================================
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo-qr.png, logo-qr-panjang.png, dsb (pencocokan file statis umum)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ]
};