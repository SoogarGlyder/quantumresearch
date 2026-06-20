import StudentApp from "@/components/StudentApp";
import { dapatkanDataDemoSiswa } from "./constant-demo";
import styles from "./Demo.module.css";

export const dynamic = "force-dynamic";

export default function DemoSiswaPage() {
  const {
    mockSiswa,
    mockStatistik,
    mockJadwal,
    mockRiwayat,
    mockLatihan,
    mockKlasemen,
    mockKuis,
    mockRiwayatKuis,
    mockMisiHarian,
  } = dapatkanDataDemoSiswa();

  return (
    <div className={styles.demoWrapper}>
      <div className={styles.demoBanner}>
        MODE DEMO (READ-ONLY)
      </div>

      <div className={styles.demoContent}>
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
          misiDemo={mockMisiHarian as any}
        />
      </div>
    </div>
  );
}