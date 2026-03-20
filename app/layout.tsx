import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Belajar | Quantum Research",
  description: "Sistem Manajemen Pembelajaran (LMS) Terpadu untuk Siswa dan Pengajar Quantum Research Academy.",
  keywords: ["LMS", "Bimbel", "Quantum Research", "E-learning", "Absensi QR"],
  authors: [{ name: "Quantum IT Team" }],
  openGraph: {
    title: "Quantum Research",
    description: "Pantau progres belajar dan absensi dalam satu genggaman.",
    url: "https://bimbel-qr.vercel.app",
    siteName: "Quantum LMS",
    locale: "id_ID",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}