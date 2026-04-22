import type { Metadata, Viewport } from "next";
import "./globals.css";

// ============================================================================
// METADATA MASTER (Enterprise Level)
// ============================================================================
export const metadata: Metadata = {
  metadataBase: new URL("https://bimbel-qr.vercel.app"),
  title: {
    default: "Portal Belajar | Quantum Research",
    template: "%s | Quantum Research"
  },
  description: "Sistem Manajemen Pembelajaran (LMS) Terpadu untuk Siswa dan Pengajar Quantum Research.",
  keywords: ["LMS", "Bimbel", "Quantum Research", "E-learning", "Absensi QR", "Portal Siswa"],
  authors: [{ name: "Quantum IT Team" }],
  creator: "Bimbingan Belajar Quantum Research",
  publisher: "Quantum Research",
  
  openGraph: {
    title: "Quantum Research - Portal Akademik",
    description: "Pantau progres belajar, statistik harian, dan absensi dalam satu genggaman digital.",
    url: "https://bimbel-qr.vercel.app",
    siteName: "Quantum Research LMS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bimbingan Belajar Quantum Research",
      },
    ],
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Quantum Research Portal",
    description: "Sistem LMS Modern Terintegrasi.",
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
    title: "Quantum Research LMS",
    statusBarStyle: "default",
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
        {children}
      </body>
    </html>
  );
}