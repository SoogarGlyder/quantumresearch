import StudentApp from "@/components/StudentApp";
import { dapatkanDataDemoSiswa } from "./constant-demo";

// Memaksa Next.js untuk selalu merender halaman ini secara real-time
export const dynamic = "force-dynamic";

export default function DemoSiswaPage() {
  // Panggil data fiktif (Tanggalnya otomatis sinkron dengan hari ini)
  const { 
    mockSiswa, 
    mockStatistik, 
    mockJadwal, 
    mockRiwayat, 
    mockLatihan,
    mockKlasemen,
    mockKuis,
    mockRiwayatKuis
  } = dapatkanDataDemoSiswa();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* 🚀 PITA PERINGATAN DEMO (Agar pengguna tahu ini versi showcase) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999999,
        backgroundColor: '#facc15', color: '#111827',
        borderBottom: '3px solid #111827',
        textAlign: 'center', padding: '6px', fontSize: '12px', fontWeight: '900',
        textTransform: 'uppercase', letterSpacing: '1px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
      }}>
        <span>👀</span> MODE DEMO (READ-ONLY)
      </div>

      {/* AREA RENDER APLIKASI UTAMA */}
      <div style={{ height: '100%', paddingTop: '30px', overflowY: 'auto' }}>
        <StudentApp 
          siswa={mockSiswa}
          jadwal={mockJadwal}
          riwayat={mockRiwayat}
          statistik={mockStatistik}
          latihanHariIni={mockLatihan}
          klasemenDemo={mockKlasemen as any}
          kuisDemo={mockKuis as any}
          riwayatKuisDemo={mockRiwayatKuis as any}
          isDemoMode={true} 
        />
      </div>

    </div>
  );
}