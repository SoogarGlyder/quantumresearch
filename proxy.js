import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; 
import { KONFIGURASI_SISTEM, PERAN, PANGKAT_PENGAJAR } from "./utils/constants";

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "quantum_secret_dev_key_2026_wajib_diganti_di_production");

export async function proxy(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get(KONFIGURASI_SISTEM.COOKIE_NAME)?.value;
  
  const isPublicPath = path === KONFIGURASI_SISTEM.PATH_LOGIN;
  
  // Verifikasi JWT secara instan di Edge Runtime
  let sesi = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      sesi = payload;
    } catch {
      sesi = null;
    }
  }

  // 1. Jika sudah punya sesi tapi malah akses halaman Login
  if (isPublicPath && sesi) {
    // Opsional: Jika dia Admin Tulen ATAU Staff Akademik, arahkan ke /admin
    const isVvip = sesi.peran === PERAN.ADMIN.id || 
                   (sesi.peran === PERAN.PENGAJAR.id && sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK);
    
    const destination = isVvip ? PERAN.ADMIN.home : PERAN.SISWA.home;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. Jika mencoba akses area dalam tanpa sesi
  if (!isPublicPath && !sesi) {
    return NextResponse.redirect(new URL(KONFIGURASI_SISTEM.PATH_LOGIN, request.url));
  }

  // 3. PROTEKSI KETAT AREA /admin
  if (sesi && path.startsWith(PERAN.ADMIN.home)) {
    const isAdminTulen = sesi.peran === PERAN.ADMIN.id;
    const isStaffAtauKakakAsuh = sesi.peran === PERAN.PENGAJAR.id && 
          (sesi.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK || sesi.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH);
    
    // Jika BUKAN admin murni dan BUKAN staf akademik, tendang ke base!
    if (!isAdminTulen && !isStaffAtauKakakAsuh) {
      return NextResponse.redirect(new URL(PERAN.SISWA.home, request.url));
    }
  }

  // 4. Admin Tulen tidak boleh nyasar di Base "/" (Dashboard Siswa/Guru biasa)
  if (sesi && path === PERAN.SISWA.home && sesi.peran === PERAN.ADMIN.id) {
     return NextResponse.redirect(new URL(PERAN.ADMIN.home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};