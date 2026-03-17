import { NextResponse } from "next/server";

// ============================================================================
// 1. PENGATURAN MIDDLEWARE
// ============================================================================
export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  const karcisId = request.cookies.get("karcis_quantum")?.value;
  const karcisPeran = request.cookies.get("peran_quantum")?.value;
  
  const isPublicPath = path === "/login";
  const isLoggedIn = !!karcisId;

  // ============================================================================
  // 2. ATURAN 1: PENGUNJUNG GELAP
  // ============================================================================
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ============================================================================
  // 3. ATURAN 2: PENGUNJUNG RESMI
  // ============================================================================
  if (isLoggedIn) {
    // --- SKENARIO A: ADMIN ---
    if (karcisPeran === "admin") {
      if (path !== "/admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } 
    
    // --- SKENARIO B: SISWA ---
    else if (karcisPeran === "siswa") {
      if (path === "/admin" || isPublicPath) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  // ============================================================================
  // 4. JIKA SEMUA AMAN, SILAKAN LEWAT!
  // ============================================================================
  return NextResponse.next();
}

// ============================================================================
// 5. TARGET PENJAGAAN (MATCHER)
// ============================================================================
export const config = {
  matcher: [
    "/", 
    "/login", 
    "/admin"
  ]
};