import dynamic from "next/dynamic";
import FallbackLoading from "@/components/ui/FallbackLoading";

export const TabBerandaPengajar = dynamic(() => import("./home"), {
  loading: () => <FallbackLoading teks="MEMUAT JADWAL..." />,
});

export const TabJurnalKelas = dynamic(() => import("./journal"), {
  loading: () => <FallbackLoading teks="MEMUAT JURNAL..." />,
});

export const TabScanPengajar = dynamic(() => import("./scan"), {
  ssr:     false, // Navigator/Camera API tidak tersedia di server
  loading: () => <FallbackLoading teks="MENYIAPKAN KAMERA..." />,
});

export const TabTugasPengajar = dynamic(() => import("./task"), {
  loading: () => <FallbackLoading teks="MEMUAT TUGAS..." />,
});

export const TabProfilPengajar = dynamic(() => import("./profile"), {
  loading: () => <FallbackLoading teks="MEMUAT PROFIL..." />,
});