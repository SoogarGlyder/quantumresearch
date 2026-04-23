import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QuRi | Bimbingan Belajar Quantum Research',
    short_name: 'QuRi',
    description: 'Portal Pembelajaran Terpadu (LMS) QuRi untuk Siswa dan Pengajar Bimbingan Belajar Quantum Research.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
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