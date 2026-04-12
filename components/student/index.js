import dynamic from "next/dynamic";

const LoadingSiswa = () => (
  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', fontWeight: '900', color: '#2563eb' }}>
    MEMUAT MODUL...
  </div>
);

const LoadingScanner = () => (
  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px', color: '#2563eb', padding: '40px' }}>
    <div style={{ animation: 'pulse 1.5s infinite', fontSize: '32px' }}>📷</div>
    <p style={{ fontWeight: '900', textTransform: 'uppercase' }}>Menyiapkan Kamera...</p>
  </div>
);

export const TabBerandaSiswa = dynamic(() => import("./home"), { loading: LoadingSiswa });
export const TabKelasSiswa = dynamic(() => import("./class"), { loading: LoadingSiswa });
export const TabScanSiswa = dynamic(() => import("./scan"), { ssr: false, loading: LoadingScanner });
export const TabKonsulSiswa = dynamic(() => import("./consul"), { loading: LoadingSiswa });
export const TabProfilSiswa = dynamic(() => import("./profile"), { loading: LoadingSiswa });