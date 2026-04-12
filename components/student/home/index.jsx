"use client";

import { useMemo, useState, useEffect } from "react"; 
import { useRouter } from "next/navigation"; 

import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, TIPE_SESI, STATUS_SESI, EVENT_PENTING, GAMIFIKASI } from "@/utils/constants";
import { cekDanGenerateMisiHarian, klaimHadiahMisi } from "@/actions/misiAction"; 
import { formatYYYYMMDD, formatBulanTahun } from "@/utils/formatHelper";
import styles from "@/components/App.module.css";

import HeaderSiswa from "./HeaderSiswa";
import ArenaMisiBulanan from "./ArenaMisiBulanan";
import ArenaMisiHarian from "./ArenaMisiHarian";
import JadwalHariIni from "./JadwalHariIni";
import LatihanHariIni from "./LatihanHariIni";
import ModalKlasemen from "./ModalKlasemen";
import ModalIframeTugas from "./ModalIframeTugas";


export default function TabBerandaSiswa({ siswa, jadwal, riwayat, setTab, setModeScan, resetScanner, latihanHariIni }) {
  const router = useRouter();
  
  const [isKlasemenOpen, setIsKlasemenOpen] = useState(false);
  const [misiHarian, setMisiHarian] = useState([]);
  const [loadingMisi, setLoadingMisi] = useState(true);
  const [urlMitra, setUrlMitra] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoadingMisi(true);
    cekDanGenerateMisiHarian().then(res => {
      if (isMounted && res.sukses) {
        setMisiHarian(res.data);
      }
      if (isMounted) setLoadingMisi(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleKlaimMisi = async (idMisi) => {
    const hasil = await klaimHadiahMisi(idMisi);
    if (hasil.sukses) {
      setMisiHarian(prev => prev.map(m => m._id === idMisi ? { ...m, diklaim: true } : m));
      router.refresh();
      alert(hasil.pesan);
    } else {
      alert(hasil.pesan);
    }
  };

  const { jadwalAktif } = useMemo(() => pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR), [jadwal, riwayat]);

  const streakKonsul = useMemo(() => {
    if (!riwayat || riwayat.length === 0) return 0;
    const daftarLibur = EVENT_PENTING.TANGGAL_LIBUR || [];
    const tanggalUnikKonsul = new Set(
      riwayat.filter(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuMulai)
             .map(r => formatYYYYMMDD(r.waktuMulai))
    );
    const hariIni = new Date();
    let tanggalCek = new Date(hariIni);
    let totalStreak = 0;

    while (true) {
      const tglStr = formatYYYYMMDD(tanggalCek);
      const isMinggu = tanggalCek.getDay() === 0;
      const isLibur = daftarLibur.includes(tglStr);
      if (tanggalUnikKonsul.has(tglStr)) break; 
      if (isMinggu || isLibur) { tanggalCek.setDate(tanggalCek.getDate() - 1); continue; }
      tanggalCek.setDate(tanggalCek.getDate() - 1);
      const tglKemarinStr = formatYYYYMMDD(tanggalCek);
      if (!tanggalUnikKonsul.has(tglKemarinStr) && tanggalCek.getDay() !== 0 && !daftarLibur.includes(tglKemarinStr)) return 0;
      break;
    }
    
    while (true) {
      const tglStr = formatYYYYMMDD(tanggalCek);
      const isMinggu = tanggalCek.getDay() === 0;
      const isLibur = daftarLibur.includes(tglStr);
      if (tanggalUnikKonsul.has(tglStr)) { totalStreak++; tanggalCek.setDate(tanggalCek.getDate() - 1); }
      else if (isMinggu || isLibur) { tanggalCek.setDate(tanggalCek.getDate() - 1); }
      else { break; }
    }
    return totalStreak;
  }, [riwayat]);

  const statsBulanIni = useMemo(() => {
    const sekarang = new Date();
    const bulanIniStr = formatBulanTahun(sekarang);
    const tglSekarangString = formatYYYYMMDD(sekarang);
    const riwayatBulanIni = riwayat?.filter(r => formatBulanTahun(r.waktuMulai) === bulanIniStr) || [];
    let totalMenitKonsul = 0;
    let mapelCount = {};
    let kelasHadir = 0;

    riwayatBulanIni.forEach(r => {
      if (r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuSelesai) {
        totalMenitKonsul += Math.floor((new Date(r.waktuSelesai) - new Date(r.waktuMulai)) / 60000);
        const namaMapel = r.namaMapel || "Umum";
        mapelCount[namaMapel] = (mapelCount[namaMapel] || 0) + 1;
      }
      if (r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.SELESAI.id) {
        kelasHadir++;
        totalMenitKonsul += (r.konsulExtraMenit || 0); 
      }
    });

    const jadwalWajibBulanIni = jadwal?.filter(j => {
      const tglJadwalStr = formatYYYYMMDD(j.tanggal);
      return formatBulanTahun(j.tanggal) === bulanIniStr && tglJadwalStr <= tglSekarangString && j.kelasTarget === siswa.kelas;
    }).length || 0;
    
    const persenHadir = jadwalWajibBulanIni > 0 ? Math.round((kelasHadir / jadwalWajibBulanIni) * 100) : 100;
    const jamKonsul = Math.floor(totalMenitKonsul / 60);
    const menitSisa = totalMenitKonsul % 60;
    const mapelTerambis = Object.keys(mapelCount).length > 0 ? Object.keys(mapelCount).reduce((a, b) => mapelCount[a] > mapelCount[b] ? a : b) : "-";
    const gelarMatch = GAMIFIKASI.GELAR_KLASEMEN.find(g => jamKonsul >= g.minJam);
    const gelar = gelarMatch ? gelarMatch.gelar : "🐢 Masih Pemanasan";
    const tanggalUTBK = new Date(EVENT_PENTING.TANGGAL_UTBK);
    const selisihHariUTBK = Math.max(0, Math.ceil((tanggalUTBK - sekarang) / (1000 * 60 * 60 * 24)));

    return { jamKonsul, menitSisa, persenHadir, kelasHadir, jadwalWajibBulanIni, mapelTerambis, gelar, selisihHariUTBK };
  }, [riwayat, jadwal, siswa.kelas]);

  const targetKonsul = statsBulanIni.jamKonsul >= 30 ? 50 : statsBulanIni.jamKonsul >= 20 ? 30 : statsBulanIni.jamKonsul >= 10 ? 20 : statsBulanIni.jamKonsul >= 5 ? 10 : 5;
  const persenMisiKonsul = (Math.min(statsBulanIni.jamKonsul, targetKonsul) / targetKonsul) * 100;
  const targetStreak = streakKonsul >= 14 ? 30 : streakKonsul >= 7 ? 14 : streakKonsul >= 3 ? 7 : 3;
  const persenMisiStreak = (Math.min(streakKonsul, targetStreak) / targetStreak) * 100;

  return (
    <div className={styles.contentArea}>
      <HeaderSiswa siswa={siswa} statsBulanIni={statsBulanIni} streakKonsul={streakKonsul} onBukaKlasemen={() => setIsKlasemenOpen(true)} />
      
      <ArenaMisiBulanan targetKonsul={targetKonsul} persenMisiKonsul={persenMisiKonsul} statsBulanIni={statsBulanIni} targetStreak={targetStreak} persenMisiStreak={persenMisiStreak} streakKonsul={streakKonsul} />
      
      <ArenaMisiHarian misiHarian={misiHarian} loadingMisi={loadingMisi} onKlaim={handleKlaimMisi} />
      
      <JadwalHariIni jadwalAktif={jadwalAktif} setTab={setTab} setModeScan={setModeScan} resetScanner={resetScanner} />
      
      <LatihanHariIni latihanHariIni={latihanHariIni} setUrlMitra={setUrlMitra} />

      {isKlasemenOpen && <ModalKlasemen onClose={() => setIsKlasemenOpen(false)} kelasSiswa={siswa.kelas} />}
      {urlMitra && <ModalIframeTugas urlMitra={urlMitra} onClose={() => setUrlMitra(null)} />}

    </div>
  );
}