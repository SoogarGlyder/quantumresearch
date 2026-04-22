import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bimbingan Belajar Quantum Research',
    short_name: 'Quantum Research',
    description: 'Sistem Manajemen Pembelajaran (LMS) Terpadu untuk Siswa dan Pengajar Bimbingan Belajar Quantum Research.',
    start_url: '/',
    display: 'standalone',
    background_color: '#2563eb',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/logo-qr.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/logo-qr.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}