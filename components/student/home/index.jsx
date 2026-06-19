"use client";

import { useMemo, useState, useEffect } from "react"; 
import { useRouter } from "next/navigation"; 

import { pilahJadwalSiswa } from "@/utils/kalkulatorData";
import { PERIODE_BELAJAR, TIPE_SESI, STATUS_SESI } from "@/utils/constants";
import { cekDanGenerateMisiHarian, klaimHadiahMisi } from "@/actions/misiAction"; 
import styles from "@/components/App.module.css";

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

const getTglJakarta = () => {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  
  return `${year}-${month}-${day}`;
};

export default function TabBerandaSiswa({ 
  siswa, jadwal, riwayat, setTab, setModeScan, resetScanner, 
  latihanHariIni, klasemenDemo, kuisDemo, 
  isDemoMode, misiDemo = [] 
}) {
  const router = useRouter();
  
  const [isKlasemenOpen, setIsKlasemenOpen] = useState(false);
  const [urlMitra, setUrlMitra] = useState(null);

  // =======================================================================
  // 🛡️ INITIAL STATE (Langsung Pasang Data Demo!)
  // =======================================================================
  const [misiHarian, setMisiHarian] = useState(() => isDemoMode ? misiDemo : []);
  const [loadingMisi, setLoadingMisi] = useState(() => !isDemoMode);
  const [dataKuisLive, setDataKuisLive] = useState(() => isDemoMode ? (kuisDemo || null) : null);

  const [kuisAktif, setKuisAktif] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const { streakKonsul, statsBulanIni, misiBulanan } = useStudentStats(riwayat, jadwal, siswa);

  // =======================================================================
  // 🛡️ BLOKIR API SECARA MUTLAK (Anti Loop!)
  // =======================================================================
  useEffect(() => {
    // KUNCI: Langsung batalkan eksekusi jika ini mode demo!
    if (isDemoMode) return; 

    let isMounted = true;
    setLoadingMisi(true);
    cekDanGenerateMisiHarian().then(res => {
      if (isMounted && res.ok) setMisiHarian(res.data);
      if (isMounted) setLoadingMisi(false);
    }).catch(() => {
      if (isMounted) setLoadingMisi(false);
    });

    return () => { isMounted = false; };
  }, [isDemoMode]); 

  const handleKlaimMisi = async (idMisi) => {
    const hasil = await klaimHadiahMisi(idMisi);
    if (hasil.sukses) {
      setMisiHarian(prev => prev.map(m => m._id === idMisi ? { ...m, diklaim: true } : m));
      router.refresh();
      alert(hasil.pesan);
    } else alert(hasil.pesan);
  };

  const { jadwalAktif } = useMemo(() => pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR), [jadwal, riwayat]);

  const tglJakartaHariIni = getTglJakarta();
  
  const jadwalKuisHariIni = useMemo(() => {
    // Pastikan ID kuis valid sebelum mengganti jadwal
    if (isDemoMode && kuisDemo && kuisDemo._id) {
      return { _id: "jadwal-demo-kuis", mapel: kuisDemo.mapel, bab: kuisDemo.bab, kelasTarget: siswa.kelas };
    }

    if (!jadwal || !Array.isArray(jadwal)) return null;
    return jadwal.find(j => {
      const tglJadwal = j.tanggal?.substring(0, 10); 
      return tglJadwal === tglJakartaHariIni && j.kelasTarget === siswa.kelas;
    });
  }, [jadwal, tglJakartaHariIni, siswa.kelas, kuisDemo, isDemoMode]);
  
  const riwayatSesiIni = useMemo(() => {
    if (isDemoMode && kuisDemo && kuisDemo._id) {
      return { waktuMulai: new Date().toISOString() };
    }

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
  }, [jadwalKuisHariIni, riwayat, tglJakartaHariIni, kuisDemo, isDemoMode]);

  // =======================================================================
  // 🛡️ BLOKIR API KUIS (Mencegah CastError ObjectId)
  // =======================================================================
  useEffect(() => {
    // KUNCI: Jangan pernah sentuh backend jika demo aktif!
    if (isDemoMode) return; 
    
    if (!jadwalKuisHariIni) return;
    
    // Failsafe Ekstra: Pastikan ID jadwal asli (bukan mengandung kata 'demo')
    if (String(jadwalKuisHariIni._id).includes("demo")) return;

    let isMounted = true;
    import("@/actions/studentAction").then((module) => {
      module.cekKetersediaanKuis(jadwalKuisHariIni._id, siswa._id).then((res) => {
          if (isMounted && res.ada) {
            setDataKuisLive({
              ...res.data,
              mapel: jadwalKuisHariIni.mapel,
              bab: jadwalKuisHariIni.bab
            });
          }
      }).catch(err => console.error("Kuis Error:", err));
    });
    
    return () => { isMounted = false; };
  }, [jadwalKuisHariIni?._id, siswa._id, refreshTrigger, isDemoMode]); 

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
            if (isDemoMode) {
              setIsReviewMode(false);
              setJawabanPastReview([]);
              setKuisAktif(kuisDemo);
              return;
            }

            const module = await import("@/actions/studentAction");
            if (isReview) {
              const res = await module.getPembahasanKuis(jadwalKuisHariIni._id, siswa._id);
              if (res.ok) {
                setIsReviewMode(true);
                setJawabanPastReview(res.data.jawabanSiswa);
                setKuisAktif({ ...dataKuisLive, soal: res.data.soal });
              } else { alert("Gagal memuat pembahasan: " + res.pesan); }
            } else {
              const res = await module.getKuisSiswa(jadwalKuisHariIni._id);
              if (res.ok) {
                setIsReviewMode(false);
                setJawabanPastReview([]);
                setKuisAktif({ ...dataKuisLive, soal: res.data.soal });
              } else { alert("Gagal memuat soal: " + res.pesan); }
            }
          }} 
        />
      )}
      
      <LatihanHariIni latihanHariIni={latihanHariIni} setUrlMitra={setUrlMitra} />

      {isKlasemenOpen && <ModalKlasemen onClose={() => setIsKlasemenOpen(false)} kelasSiswa={siswa.kelas} klasemenDemo={klasemenDemo}/>}
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