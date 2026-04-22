import { NextResponse } from "next/server";

// 🚀 NAMA FUNGSI DIUBAH MENJADI PROXY (STANDAR NEXT.JS 16)
export function proxy(request) {
  const path = request.nextUrl.pathname;
  
  // 🚀 Ambil Karcis (Token) dan Peran dari Cookie
  const karcisId = request.cookies.get("karcis_quantum")?.value;
  const karcisPeran = request.cookies.get("peran_quantum")?.value;
  
  const isPublicPath = path === "/login";
  const isLoggedIn = !!karcisId;

  // 🛡️ PENAWAR INFINITE LOOP (Gunakan Redirect agar Safari benar-benar bersih)
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
    
    // A. Jika di halaman login, arahkan ke dashboard masing-masing
    if (isPublicPath) {
      const destination = karcisPeran === "admin" ? "/admin" : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // B. Proteksi Area Admin: Hanya Admin yang boleh di /admin/*
    if (path.startsWith("/admin") && karcisPeran !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // C. Proteksi Halaman Utama: Admin tidak boleh di "/" (Dashboard Siswa/Umum)
    // Ini mencegah Admin terjebak di beranda yang bukan areanya
    if (path === "/" && karcisPeran === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ]
};