import dynamic from "next/dynamic";
import FallbackLoading from "@/components/ui/FallbackLoading";

// 1. HOME 
export const TabBerandaPengajar = dynamic(() => import("./home"), {
  loading: () => <FallbackLoading teks="MEMUAT JADWAL..." />,
});

// 2. JOURNAL 
export const TabJurnalKelas = dynamic(() => import("./journal"), {
  loading: () => <FallbackLoading teks="MEMUAT JURNAL..." />,
});

// 3. SCAN
export const TabScanPengajar = dynamic(() => import("./scan"), {
  loading: () => <FallbackLoading teks="MENYIAPKAN KAMERA..." />,
});

// 4. TASK
export const TabTugasPengajar = dynamic(() => import("./task"), {
  loading: () => <FallbackLoading teks="MEMUAT TUGAS..." />,
});

// 5. PROFILE
export const TabProfilPengajar = dynamic(() => import("./profile"), { 
  loading: () => <FallbackLoading teks="MEMUAT PROFIL..." /> 
});