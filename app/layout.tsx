import type { Metadata, Viewport } from "next";
import "./globals.css";

// ============================================================================
// METADATA MASTER (Poin 7 - Enterprise Level)
// ============================================================================
export const metadata: Metadata = {
  title: {
    default: "Portal Belajar | Quantum Research",
    template: "%s | Quantum Research"
  },
  description: "Sistem Manajemen Pembelajaran (LMS) Terpadu untuk Siswa dan Pengajar Quantum Research Academy.",
  keywords: ["LMS", "Bimbel", "Quantum Research", "E-learning", "Absensi QR", "Portal Siswa"],
  authors: [{ name: "Quantum IT Team" }],
  creator: "Quantum Research Academy",
  publisher: "Quantum Research",
  
  openGraph: {
    title: "Quantum Research - Portal Akademik",
    description: "Pantau progres belajar, statistik harian, dan absensi dalam satu genggaman digital.",
    url: "https://bimbel-qr.vercel.app",
    siteName: "Quantum LMS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quantum Research Academy Portal",
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
};

export const viewport: Viewport = {
  themeColor: "#facc15", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      {/* 👇 body sekarang bersih dari class font eksternal */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}