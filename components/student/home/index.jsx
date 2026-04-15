"use client";

import { useMemo, useState, useEffect } from "react"; 
import { useRouter } from "next/navigation"; 

import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, TIPE_SESI, STATUS_SESI, EVENT_PENTING, GAMIFIKASI } from "@/utils/constants";
import { cekDanGenerateMisiHarian, klaimHadiahMisi } from "@/actions/misiAction"; 
import styles from "@/components/App.module.css";

import HeaderSiswa from "./HeaderSiswa";
import ArenaMisiBulanan from "./ArenaMisiBulanan";
import ArenaMisiHarian from "./ArenaMisiHarian";
import JadwalHariIni from "./JadwalHariIni";
import LatihanHariIni from "./LatihanHariIni";
import ModalKlasemen from "./ModalKlasemen";
import ModalIframeTugas from "./ModalIframeTugas";

import QuizHariIni from "./QuizHariIni"; 
import ModalUjianCBT from "./ModalUjianCBT";

// --- HELPER WAKTU JAKARTA ---
const getTglJakarta = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function TabBerandaSiswa({ siswa, jadwal, riwayat, setTab, setModeScan, resetScanner, latihanHariIni }) {
  const router = useRouter();
  
  const [isKlasemenOpen, setIsKlasemenOpen] = useState(false);
  const [misiHarian, setMisiHarian] = useState([]);
  const [loadingMisi, setLoadingMisi] = useState(true);
  const [urlMitra, setUrlMitra] = useState(null);

  const [kuisAktif, setKuisAktif] = useState(null);
  
  // 🚀 TAMBAHAN STATE UNTUK MODE REVIEW
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  useEffect(() => {
    let isMounted = true;
    setLoadingMisi(true);
    cekDanGenerateMisiHarian().then(res => {
      if (isMounted && res.sukses) setMisiHarian(res.data);
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
    } else alert(hasil.pesan);
  };

  const { jadwalAktif } = useMemo(() => pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR), [jadwal, riwayat]);

  const formatYYYYMMDD_lama = (dateData) => {
    if (!dateData) return "";
    const d = new Date(dateData);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const formatBulanTahun_lama = (dateData) => {
    if (!dateData) return "";
    const d = new Date(dateData);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const streakKonsul = useMemo(() => {
    if (!riwayat || riwayat.length === 0) return 0;
    const daftarLibur = EVENT_PENTING.TANGGAL_LIBUR || [];
    const tanggalUnikKonsul = new Set(riwayat.filter(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuMulai).map(r => formatYYYYMMDD_lama(r.waktuMulai)));
    const hariIni = new Date();
    let tanggalCek = new Date(hariIni);
    let totalStreak = 0;
    while (true) {
      const tglStr = formatYYYYMMDD_lama(tanggalCek);
      if (tanggalUnikKonsul.has(tglStr)) break; 
      if (tanggalCek.getDay() === 0 || daftarLibur.includes(tglStr)) { tanggalCek.setDate(tanggalCek.getDate() - 1); continue; }
      tanggalCek.setDate(tanggalCek.getDate() - 1);
      const tglKemarinStr = formatYYYYMMDD_lama(tanggalCek);
      if (!tanggalUnikKonsul.has(tglKemarinStr) && tanggalCek.getDay() !== 0 && !daftarLibur.includes(tglKemarinStr)) return 0;
      break;
    }
    while (true) {
      const tglStr = formatYYYYMMDD_lama(tanggalCek);
      if (tanggalUnikKonsul.has(tglStr)) { totalStreak++; tanggalCek.setDate(tanggalCek.getDate() - 1); }
      else if (tanggalCek.getDay() === 0 || daftarLibur.includes(tglStr)) { tanggalCek.setDate(tanggalCek.getDate() - 1); }
      else { break; }
    }
    return totalStreak;
  }, [riwayat]);

  const statsBulanIni = useMemo(() => {
    const sekarang = new Date();
    const bulanIniStr = formatBulanTahun_lama(sekarang);
    const tglSekarangString = formatYYYYMMDD_lama(sekarang);
    const riwayatBulanIni = riwayat?.filter(r => formatBulanTahun_lama(r.waktuMulai) === bulanIniStr) || [];
    let totalMenitKonsul = 0, mapelCount = {}, kelasHadir = 0;

    riwayatBulanIni.forEach(r => {
      if (r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuSelesai) {
        totalMenitKonsul += Math.floor((new Date(r.waktuSelesai) - new Date(r.waktuMulai)) / 60000);
        mapelCount[r.namaMapel || "Umum"] = (mapelCount[r.namaMapel || "Umum"] || 0) + 1;
      }
      if (r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.SELESAI.id) {
        kelasHadir++;
        totalMenitKonsul += (r.konsulExtraMenit || 0); 
      }
    });

    const jadwalWajibBulanIni = jadwal?.filter(j => formatBulanTahun_lama(j.tanggal) === bulanIniStr && formatYYYYMMDD_lama(j.tanggal) <= tglSekarangString && j.kelasTarget === siswa.kelas).length || 0;
    const persenHadir = jadwalWajibBulanIni > 0 ? Math.round((kelasHadir / jadwalWajibBulanIni) * 100) : 100;
    const jamKonsul = Math.floor(totalMenitKonsul / 60), menitSisa = totalMenitKonsul % 60;
    const mapelTerambis = Object.keys(mapelCount).length > 0 ? Object.keys(mapelCount).reduce((a, b) => mapelCount[a] > mapelCount[b] ? a : b) : "-";
    const gelarMatch = GAMIFIKASI.GELAR_KLASEMEN.find(g => jamKonsul >= g.minJam);
    
    return { jamKonsul, menitSisa, persenHadir, kelasHadir, jadwalWajibBulanIni, mapelTerambis, gelar: gelarMatch ? gelarMatch.gelar : "🐢 Masih Pemanasan", selisihHariUTBK: Math.max(0, Math.ceil((new Date(EVENT_PENTING.TANGGAL_UTBK) - sekarang) / 86400000)) };
  }, [riwayat, jadwal, siswa.kelas]);

  const targetKonsul = statsBulanIni.jamKonsul >= 30 ? 50 : statsBulanIni.jamKonsul >= 20 ? 30 : statsBulanIni.jamKonsul >= 10 ? 20 : statsBulanIni.jamKonsul >= 5 ? 10 : 5;
  const persenMisiKonsul = (Math.min(statsBulanIni.jamKonsul, targetKonsul) / targetKonsul) * 100;
  const targetStreak = streakKonsul >= 14 ? 30 : streakKonsul >= 7 ? 14 : streakKonsul >= 3 ? 7 : 3;
  const persenMisiStreak = (Math.min(streakKonsul, targetStreak) / targetStreak) * 100;

  // ==========================================================
  // 🚀 LOGIKA PENCARIAN KUIS HARI INI
  // ==========================================================
  const tglJakartaHariIni = getTglJakarta();
  
  const jadwalKuisHariIni = useMemo(() => {
    if (!jadwal || !Array.isArray(jadwal)) return null;
    return jadwal.find(j => {
      const tglJadwal = j.tanggal?.substring(0, 10); 
      return tglJadwal === tglJakartaHariIni && j.kelasTarget === siswa.kelas;
    });
  }, [jadwal, tglJakartaHariIni, siswa.kelas]);
  
  const riwayatSesiIni = useMemo(() => {
    if (!jadwalKuisHariIni || !riwayat || !Array.isArray(riwayat)) return null;
    
    const targetId = jadwalKuisHariIni._id?.toString();

    return riwayat.find(r => {
      const idRiwayat = r.jadwalId?._id?.toString() || r.jadwalId?.toString();
      const tglAbsen = r.waktuMulai ? formatYYYYMMDD_lama(r.waktuMulai) : null;
      
      const isIdMatch = idRiwayat === targetId;
      const isFuzzyMatch = !idRiwayat && r.jenisSesi === TIPE_SESI.KELAS && tglAbsen === tglJakartaHariIni;

      return (isIdMatch || isFuzzyMatch) &&
             r.status !== STATUS_SESI.ALPA.id &&
             r.status !== STATUS_SESI.TIDAK_HADIR.id;
    });
  }, [jadwalKuisHariIni, riwayat]);

  const [dataKuisLive, setDataKuisLive] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (jadwalKuisHariIni) {
      import("@/actions/studentAction").then((module) => {
        module.cekKetersediaanKuis(jadwalKuisHariIni._id, siswa._id).then((res) => {
           if (isMounted && res.ada) {
             setDataKuisLive({
                ...res.data,
                mapel: jadwalKuisHariIni.mapel,
                bab: jadwalKuisHariIni.bab
             });
           }
        });
      });
    }
    return () => { isMounted = false; };
  }, [jadwalKuisHariIni, siswa._id, refreshTrigger]); 

  return (
    <div className={styles.contentArea}>
      <HeaderSiswa siswa={siswa} statsBulanIni={statsBulanIni} streakKonsul={streakKonsul} onBukaKlasemen={() => setIsKlasemenOpen(true)} />
      
      <ArenaMisiBulanan targetKonsul={targetKonsul} persenMisiKonsul={persenMisiKonsul} statsBulanIni={statsBulanIni} targetStreak={targetStreak} persenMisiStreak={persenMisiStreak} streakKonsul={streakKonsul} />
      
      <ArenaMisiHarian misiHarian={misiHarian} loadingMisi={loadingMisi} onKlaim={handleKlaimMisi} />
      
      <JadwalHariIni jadwalAktif={jadwalAktif} setTab={setTab} setModeScan={setModeScan} resetScanner={resetScanner} />
      
      {/* 🚀 KARTU KUIS CBT (DENGAN DUA JALUR: UJIAN & REVIEW) */}
      {jadwalKuisHariIni && (
        <QuizHariIni 
          kuisHariIni={dataKuisLive} 
          riwayatSesiIni={riwayatSesiIni} 
          onBukaKuis={async (dataKuis, isReview = false) => {
            const module = await import("@/actions/studentAction");
            
            if (isReview) {
              // 🚀 JALUR PEMBAHASAN
              const res = await module.getPembahasanKuis(jadwalKuisHariIni._id, siswa._id);
              if (res.sukses) {
                setIsReviewMode(true);
                setJawabanPastReview(res.data.jawabanSiswa);
                setKuisAktif({ ...dataKuisLive, soal: res.data.soal });
              } else { alert("Gagal memuat pembahasan: " + res.pesan); }
            } else {
              // 🚀 JALUR UJIAN ASLI
              const res = await module.getKuisSiswa(jadwalKuisHariIni._id);
              if (res.sukses) {
                setIsReviewMode(false);
                setJawabanPastReview([]);
                setKuisAktif({ ...dataKuisLive, soal: res.data.soal });
              } else { alert("Gagal memuat soal: " + res.pesan); }
            }
          }} 
        />
      )}
      
      <LatihanHariIni latihanHariIni={latihanHariIni} setUrlMitra={setUrlMitra} />

      {isKlasemenOpen && <ModalKlasemen onClose={() => setIsKlasemenOpen(false)} kelasSiswa={siswa.kelas} />}
      {urlMitra && <ModalIframeTugas urlMitra={urlMitra} onClose={() => setUrlMitra(null)} />}

      {/* 🚀 MODAL UJIAN CBT */}
      {kuisAktif && (
        <ModalUjianCBT 
          jadwalId={jadwalKuisHariIni._id}
          kuis={kuisAktif} 
          siswa={siswa}
          isReviewMode={isReviewMode} // 🚀 Props Baru
          jawabanPast={jawabanPastReview} // 🚀 Props Baru
          onClose={() => {
            setKuisAktif(null); 
            setIsReviewMode(false);
            setJawabanPastReview([]);
            setRefreshTrigger(prev => prev + 1); 
          }} 
        />
      )}

    </div>
  );
}