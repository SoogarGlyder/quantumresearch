"use client";

import { useMemo, useState, useEffect } from "react"; 
import { useRouter } from "next/navigation"; 

import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, TIPE_SESI, STATUS_SESI } from "@/utils/constants";
import { cekDanGenerateMisiHarian, klaimHadiahMisi } from "@/actions/misiAction"; 
import styles from "@/components/App.module.css";

// 🚀 IMPORT CUSTOM HOOK
import { useStudentStats } from "./useStudentStats";

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
  
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // 🚀 PANGGIL CUSTOM HOOK (Semua logika rumit disembunyikan di sini)
  const { streakKonsul, statsBulanIni, misiBulanan } = useStudentStats(riwayat, jadwal, siswa);

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
      const tglAbsen = r.waktuMulai ? `${new Date(r.waktuMulai).getFullYear()}-${String(new Date(r.waktuMulai).getMonth() + 1).padStart(2, '0')}-${String(new Date(r.waktuMulai).getDate()).padStart(2, '0')}` : null;
      
      const isIdMatch = idRiwayat === targetId;
      const isFuzzyMatch = !idRiwayat && r.jenisSesi === TIPE_SESI.KELAS && tglAbsen === tglJakartaHariIni;

      return (isIdMatch || isFuzzyMatch) &&
             r.status !== STATUS_SESI.ALPA.id &&
             r.status !== STATUS_SESI.TIDAK_HADIR.id;
    });
  }, [jadwalKuisHariIni, riwayat, tglJakartaHariIni]);

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
      <HeaderSiswa 
        siswa={siswa} 
        statsBulanIni={statsBulanIni} 
        streakKonsul={streakKonsul} 
        onBukaKlasemen={() => setIsKlasemenOpen(true)} 
      />
      
      <ArenaMisiBulanan 
        targetKonsul={misiBulanan.targetKonsul} 
        persenMisiKonsul={misiBulanan.persenMisiKonsul} 
        statsBulanIni={statsBulanIni} 
        targetStreak={misiBulanan.targetStreak} 
        persenMisiStreak={misiBulanan.persenMisiStreak} 
        streakKonsul={streakKonsul} 
      />
      
      <ArenaMisiHarian misiHarian={misiHarian} loadingMisi={loadingMisi} onKlaim={handleKlaimMisi} />
      
      <JadwalHariIni jadwalAktif={jadwalAktif} setTab={setTab} setModeScan={setModeScan} resetScanner={resetScanner} />
      
      {jadwalKuisHariIni && (
        <QuizHariIni 
          kuisHariIni={dataKuisLive} 
          riwayatSesiIni={riwayatSesiIni} 
          onBukaKuis={async (dataKuis, isReview = false) => {
            const module = await import("@/actions/studentAction");
            
            if (isReview) {
              const res = await module.getPembahasanKuis(jadwalKuisHariIni._id, siswa._id);
              if (res.sukses) {
                setIsReviewMode(true);
                setJawabanPastReview(res.data.jawabanSiswa);
                setKuisAktif({ ...dataKuisLive, soal: res.data.soal });
              } else { alert("Gagal memuat pembahasan: " + res.pesan); }
            } else {
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

      {kuisAktif && (
        <ModalUjianCBT 
          jadwalId={jadwalKuisHariIni._id}
          kuis={kuisAktif} 
          siswa={siswa}
          isReviewMode={isReviewMode}
          jawabanPast={jawabanPastReview}
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