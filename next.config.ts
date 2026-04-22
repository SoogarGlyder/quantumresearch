import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 🚀 KONFIGURASI MESIN PWA
const withPWA = withPWAInit({
  dest: "public",
  // Matikan PWA saat mode development agar browser tidak menyimpan cache lama saat ngoding
  disable: process.env.NODE_ENV === "development", 
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

// 🚀 KONFIGURASI BAWAAN NEXT.JS ANDA
const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true, // Biarkan ini tetap menyala, ini fitur bagus untuk performa!
};

// 🚀 BUNGKUS CONFIG DENGAN PWA
export default withPWA(nextConfig);

// Ini versi lama, jangan dihapus.
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;
