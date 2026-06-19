import dynamic from "next/dynamic";
import FallbackLoading from "@/components/ui/FallbackLoading";

export const TabBerandaSiswa = dynamic(() => import("./home"), {
  loading: () => <FallbackLoading teks="MEMUAT MODUL..." />,
});

export const TabKelasSiswa = dynamic(() => import("./class"), {
  loading: () => <FallbackLoading teks="MEMUAT KELAS..." />,
});

export const TabScanSiswa = dynamic(() => import("./scan"), {
  ssr:     false, // Navigator/Camera API tidak tersedia di server
  loading: () => <FallbackLoading teks="MENYIAPKAN KAMERA..." />,
});

export const TabKonsulSiswa = dynamic(() => import("./consul"), {
  loading: () => <FallbackLoading teks="MEMUAT KONSUL..." />,
});

export const TabProfilSiswa = dynamic(() => import("./profile"), {
  loading: () => <FallbackLoading teks="MEMUAT PROFIL..." />,
});