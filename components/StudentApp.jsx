"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

import { prosesHasilScan, ambilDaftarGuruDropdown } from "@/actions/scanAction";
import { prosesLogout } from "@/actions/authAction";
import { MODE_SCAN, PREFIX_BARCODE, TIPE_SESI, STATUS_SESI, KONFIGURASI_SISTEM } from "@/utils/constants";
import { formatHelper } from "@/utils/formatHelper";
import styles from "@/components/App.module.css";

import { 
  TabBerandaSiswa, 
  TabKelasSiswa, 
  TabScanSiswa, 
  TabKonsulSiswa, 
  TabProfilSiswa 
} from "./student";

import StudentBottomNav from "./student/StudentBottomNav";

export default function StudentApp({ 
  siswa, 
  riwayat, 
  jadwal, 
  statistik, 
  latihanHariIni, 
  klasemenDemo = [],       
  kuisDemo = [],           
  riwayatKuisDemo = [],    
  isDemoMode = false,
  misiDemo = []            
}) {
  const router = useRouter();

  const adaKonsulAktif = useMemo(() => riwayat?.some(
    r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id
  ), [riwayat]);

  const adaKelasAktif = useMemo(() => riwayat?.some(
    r => r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.BERJALAN.id
  ), [riwayat]);

  const [tab, setTab] = useState("home"); 
  const [modeScan, setModeScan] = useState(() => adaKonsulAktif ? MODE_SCAN.KONSUL : MODE_SCAN.KELAS);

  const [hasilScan, setHasilScan] = useState("");
  const [pesanSistem, setPesanSistem] = useState("");
  const [sedangLoading, setSedangLoading] = useState(false);
  
  const [mapelPilihan, setMapelPilihan] = useState(() => {
    if (adaKonsulAktif) {
      const sesi = riwayat.find(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id);
      return sesi?.namaMapel || "";
    }
    return "";
  });

  const [guruPilihan, setGuruPilihan] = useState(() => {
    if (adaKonsulAktif) {
      const sesi = riwayat.find(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id);
      return sesi?.pengajarPendamping || ""; 
    }
    return "";
  });
  const [daftarGuru, setDaftarGuru] = useState([]);

  const apakahError = formatHelper.cekPesanErrorScanner(pesanSistem);

  useEffect(() => {
    const muatDaftarGuru = async () => {
      try {
        const res = await ambilDaftarGuruDropdown();
        if (res && res.ok) {
          setDaftarGuru(res.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat daftar guru pendamping:", err);
      }
    };
    muatDaftarGuru();
  }, []);

  useEffect(() => {
    if (tab === "scan") {
      if (adaKonsulAktif) setModeScan(MODE_SCAN.KONSUL);
      if (adaKelasAktif) setModeScan(MODE_SCAN.KELAS);
    }
  }, [tab, adaKonsulAktif, adaKelasAktif]);

  const resetScanner = () => { 
    setHasilScan(""); 
    setPesanSistem(""); 
  };

  const klikLogout = async () => { 
    await prosesLogout(); 
    router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
  };

  async function saatBarcodeTerbaca(teksDariKamera) {
    if (sedangLoading) return;

    let pesanErrorLokal = "";
    const isScanKonsul = teksDariKamera === PREFIX_BARCODE.KONSUL;
    const isScanKelas = teksDariKamera.startsWith(PREFIX_BARCODE.KELAS);

    if (adaKonsulAktif && isScanKonsul) {
      setModeScan(MODE_SCAN.KONSUL); 
    } else if (adaKelasAktif && isScanKelas) {
      setModeScan(MODE_SCAN.KELAS); 
    } else {
      if (modeScan === MODE_SCAN.KELAS && !isScanKelas) { 
        pesanErrorLokal = "Ups! Ini bukan barcode Kelas."; 
      } else if (modeScan === MODE_SCAN.KONSUL && !isScanKonsul) { 
        pesanErrorLokal = "Ups! Arahkan ke barcode Konsul."; 
      } else if (modeScan === MODE_SCAN.KONSUL && (!mapelPilihan || mapelPilihan.trim() === "") && !adaKonsulAktif) { 
        pesanErrorLokal = "Oops! Silakan pilih mapel terlebih dahulu."; 
      } else if (modeScan === MODE_SCAN.KONSUL && (!guruPilihan || guruPilihan.trim() === "") && !adaKonsulAktif) {
        pesanErrorLokal = "Oops! Silakan pilih guru pendamping terlebih dahulu.";
      }
    }

    if (pesanErrorLokal) {
      setHasilScan(teksDariKamera);
      setPesanSistem(pesanErrorLokal);
      setTimeout(() => resetScanner(), 3000);
      return; 
    }

    setSedangLoading(true);
    setHasilScan(teksDariKamera);
    setPesanSistem("Mengirim data ke pusat...");

    try {
      const laporan = await prosesHasilScan(teksDariKamera, mapelPilihan, guruPilihan);
      setPesanSistem(laporan.pesan);
      
      if (laporan.sukses) { 
        router.refresh();
        setTimeout(() => {
          resetScanner();
          const isCheckOut = laporan.pesan.includes("Selesai") || 
                             laporan.pesan.includes("Check-out") || 
                             laporan.pesan.includes("dibatalkan");
                             
          if (isCheckOut) {
            setMapelPilihan(""); 
            setGuruPilihan("");
          }
        }, 3000);

      } else {
        setTimeout(() => resetScanner(), 3000);
      }
    } catch (error) {
      setPesanSistem("Gagal menghubungi server. Periksa koneksi.");
      setTimeout(() => resetScanner(), 3000);
    } finally {
      setSedangLoading(false);
    }
  }

  return (
    <div className={styles.mainContainer}>
      <main>
        {tab === "home" && (
          <TabBerandaSiswa 
            siswa={siswa} 
            jadwal={jadwal} 
            riwayat={riwayat} 
            setTab={setTab} 
            setModeScan={setModeScan} 
            resetScanner={resetScanner} 
            latihanHariIni={latihanHariIni} 
            klasemenDemo={klasemenDemo} 
            kuisDemo={kuisDemo} 
            isDemoMode={isDemoMode} 
            misiDemo={misiDemo} 
          />
        )}
        
        {tab === "kelas" && (
          <TabKelasSiswa 
            jadwal={jadwal} 
            riwayat={riwayat} 
            siswa={siswa} 
            isDemoMode={isDemoMode} 
            riwayatKuisDemo={riwayatKuisDemo}
          />
        )}
        
        {tab === "scan" && (
          <TabScanSiswa 
            modeScan={modeScan} 
            setModeScan={setModeScan} 
            hasilScan={hasilScan} 
            pesanSistem={pesanSistem} 
            sedangLoading={sedangLoading} 
            mapelPilihan={mapelPilihan} 
            setMapelPilihan={setMapelPilihan} 
            guruPilihan={guruPilihan}
            setGuruPilihan={setGuruPilihan}
            daftarGuru={daftarGuru}
            saatBarcodeTerbaca={saatBarcodeTerbaca} 
            resetScanner={resetScanner} 
            apakahError={apakahError} 
            adaKonsulAktif={adaKonsulAktif} 
            adaKelasAktif={adaKelasAktif} 
          />
        )}
        
        {tab === "riwayat" && <TabKonsulSiswa riwayat={riwayat} />}
        {tab === "profil" && <TabProfilSiswa siswa={siswa} klikLogout={klikLogout} />}
      </main>

      <StudentBottomNav tab={tab} setTab={setTab} />
    </div>
  );
}