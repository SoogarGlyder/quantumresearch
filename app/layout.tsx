import type { Metadata, Viewport } from "next";
import "./globals.css";
import UpdatePrompt from "@/components/UpdatePrompt";
import InstallPrompt from "@/components/InstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

// ============================================================================
// METADATA MASTER (Enterprise Level)
// ============================================================================
export const metadata: Metadata = {
  metadataBase: new URL("https://bimbel-qr.vercel.app"),
  title: {
    default: "QuRi | Portal Belajar",
    template: "%s | QuRi"
  },
  description: "QuRi: Sistem Manajemen Pembelajaran (LMS) Terpadu untuk Siswa dan Pengajar Bimbingan Belajar Quantum Research.",
  keywords: ["QuRi", "LMS", "Bimbel", "Quantum Research", "E-learning", "Absensi QR", "Portal Siswa"],
  authors: [{ name: "Quantum Research IT Team" }],
  creator: "Bimbingan Belajar Quantum Research",
  publisher: "Quantum Research",
  
  openGraph: {
    title: "QuRi - Portal Akademik",
    description: "Pantau progres belajar, statistik harian, dan absensi dalam satu genggaman digital bersama QuRi.",
    url: "https://bimbel-qr.vercel.app",
    siteName: "QuRi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QuRi by Quantum Research",
      },
    ],
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "QuRi Portal",
    description: "QuRi: Sistem LMS Modern Terintegrasi.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/logo-qr.png",
    apple: "/logo-qr.png",
  },
  appleWebApp: {
    capable: true,
    title: "QuRi",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  viewportFit: "cover",
  colorScheme: "light",
};

// ============================================================================
// ROOT LAYOUT
// ============================================================================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /**
     * 🚀 FIX HYDRATION ERROR:
     * suppressHydrationWarning ditambahkan pada <html> dan <body> 
     * untuk mengabaikan atribut ekstra yang disuntikkan oleh 
     * ekstensi browser (seperti Grammarly, Google Translate, dll).
     */
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <UpdatePrompt />
        <InstallPrompt />
        
        {children}

        {/* 🚀 RADAR VERCEL DIPASANG DI SINI (Paling Bawah Body) */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}