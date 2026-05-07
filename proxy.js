import { NextResponse } from "next/server";

export function proxy(request) {
  const path = request.nextUrl.pathname;
  
  // Ambil Karcis (Token) dan Peran dari Cookie
  const karcisId = request.cookies.get("karcis_quantum")?.value;
  const karcisPeran = request.cookies.get("peran_quantum")?.value;
  
  const isPublicPath = path === "/login";
  const isLoggedIn = !!karcisId;

  // 🛡️ PENAWAR INFINITE LOOP
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
    
    if (isPublicPath) {
      const destination = karcisPeran === "admin" ? "/admin" : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // FIX: Proteksi Area Admin yang Baru
    // Siswa mutlak kita blokir. Tapi "pengajar" kita izinkan lewat, 
    // nanti pangkat mereka (Kakak Asuh/Staff) akan diseleksi langsung oleh halaman /admin.
    if (path.startsWith("/admin") && karcisPeran === "siswa") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // C. Admin Tulen tidak boleh di "/" (Dashboard Siswa/Umum)
    // Catatan: Jika dia Staff Akademik (yang perannya pengajar), dia TETAP BISA ke "/"
    // Inilah yang membuat sistem "Topi Ganda" bekerja sempurna!
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