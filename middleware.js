import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // 🚀 Ambil Karcis (Token) dan Peran dari Cookie
  const karcisId = request.cookies.get("karcis_quantum")?.value;
  const karcisPeran = request.cookies.get("peran_quantum")?.value;
  
  const isPublicPath = path === "/login";
  const isLoggedIn = !!karcisId;

  // 🛡️ PENAWAR INFINITE LOOP & PEMBERSIHAN SESI PAKSA
  // Jika user masuk ke /login?clear=true, hapus cookie dan biarkan dia tetap di halaman /login
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
  // 2. PROTEKSI PENGUNJUNG YANG SUDAH LOGIN (ROLE-BASED REDIRECT)
  // ============================================================================
  if (isLoggedIn) {
    
    // A. Mencegah akses ke halaman /login jika sudah punya karcis
    if (isPublicPath) {
      if (karcisPeran === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url)); // Siswa & Pengajar
    }

    // B. Mencegah selain Admin masuk ke jalur /admin/*
    if (path.startsWith("/admin") && karcisPeran !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // C. Mencegah Admin nyasar ke Beranda ("/") Siswa/Pengajar
    if (path === "/" && karcisPeran === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Lolos semua pemeriksaan, silakan lanjut ke halaman tujuan
  return NextResponse.next();
}

// ============================================================================
// TARGET PENJAGAAN (MATCHER STANDAR INDUSTRI)
// ============================================================================
export const config = {
  matcher: [
    /*
     * Mengecualikan jalur yang tidak perlu diperiksa oleh Middleware:
     * - api (Jalur internal API)
     * - _next/static & _next/image (File statis dan optimasi gambar Next.js)
     * - favicon.ico dan semua file berekstensi (seperti .png, .css)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ]
};