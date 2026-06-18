import type { Metadata, Viewport } from "next";
import { Encode_Sans, League_Spartan } from "next/font/google";
import "./globals.css";
import UpdatePrompt from "@/components/UpdatePrompt";
import InstallPrompt from "@/components/InstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

// ============================================================================
// KONFIGURASI FONT (Best Practice Self-Hosting)
// ============================================================================
const encodeSans = Encode_Sans({
  variable: "--font-encode-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const leagueSpartan = League_Spartan({
  variable: "--font-spartan",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// ============================================================================
// METADATA
// ============================================================================
export const metadata: Metadata = {
  metadataBase: new URL("https://bimbel-qr.vercel.app"),
  title: {
    default: "QuRi | Portal Belajar",
    template: "%s | QuRi",
  },
  description:
    "QuRi: Sistem Manajemen Pembelajaran (LMS) Terpadu untuk Siswa dan Pengajar Bimbingan Belajar Quantum Research.",
  keywords: [
    "QuRi",
    "LMS",
    "Bimbel",
    "Quantum Research",
    "E-learning",
    "Absensi QR",
    "Portal Siswa",
  ],
  authors: [{ name: "Quantum Research IT Team" }],
  creator: "Bimbingan Belajar Quantum Research",
  publisher: "Quantum Research",

  openGraph: {
    title: "QuRi - Portal Academik",
    description:
      "Pantau progres belajar, statistik harian, dan absensi dalam satu genggaman digital bersama QuRi.",
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

// ============================================================================
// VIEWPORT
// ============================================================================
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
    <html 
      lang="id" 
      className={`${encodeSans.variable} ${leagueSpartan.variable}`} 
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <UpdatePrompt />
        <InstallPrompt />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}