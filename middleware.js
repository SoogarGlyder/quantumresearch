import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  const karcisId = request.cookies.get("karcis_quantum")?.value;
  const karcisPeran = request.cookies.get("peran_quantum")?.value;
  
  const isPublicPath = path === "/login";
  const isLoggedIn = !!karcisId;

  // 🛡️ PENAWAR INFINITE LOOP: Jika sistem memaksa pembersihan sesi
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
  // 2. PROTEKSI PENGUNJUNG YANG SUDAH LOGIN
  // ============================================================================
  if (isLoggedIn) {
    // A. JIKA MENCOBA AKSES HALAMAN LOGIN (SAAT SUDAH LOGIN)
    if (isPublicPath) {
      if (karcisPeran === "admin") return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.redirect(new URL("/", request.url)); // Siswa & Pengajar
    }

    // B. PROTEKSI JALUR KHUSUS ADMIN
    if (path.startsWith("/admin") && karcisPeran !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // C. PROTEKSI JALUR KHUSUS NON-ADMIN (LOCK ADMIN DI /ADMIN)
    if (path === "/" && karcisPeran === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

// ============================================================================
// TARGET PENJAGAAN (MATCHER STANDAR INDUSTRI)
// Melindungi SEMUA halaman, kecuali API, file Next, dan gambar statis.
// ============================================================================
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ]
};