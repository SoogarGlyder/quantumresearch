"use client";

import { useMemo, useState, useEffect } from "react";

import { pilahJadwalSiswa }                  from "@/utils/kalkulatorData";
import { timeHelper }                         from "@/utils/timeHelper";
import { PERIODE_BELAJAR, TIPE_SESI, STATUS_SESI } from "@/utils/constants";
import { cekDanGenerateMisiHarian, klaimHadiahMisi } from "@/actions/misiAction";
import styles from "@/components/App.module.css";

import { useStudentStats } from "./useStudentStats";
import HeaderSiswa     from "./HeaderSiswa";
import ArenaMisiBulanan from "./ArenaMisiBulanan";
import ArenaMisiHarian  from "./ArenaMisiHarian";
import JadwalHariIni    from "./JadwalHariIni";
import LatihanHariIni   from "./LatihanHariIni";
import ModalKlasemen    from "./ModalKlasemen";
import ModalIframeTugas from "./ModalIframeTugas";
import QuizHariIni      from "./QuizHariIni";
import ModalUjianCBT    from "./ModalUjianCBT";

export default function TabBerandaSiswa({
  siswa, jadwal, riwayat, setTab, setModeScan, resetScanner, latihanHariIni,
  klasemenDemo, kuisDemo, isDemoMode = false, misiDemo = [],
}) {
  // 🛡️ ANTI-HYDRATION ERROR: Tunda render UI sensitif sampai Client siap
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isKlasemenOpen, setIsKlasemenOpen] = useState(false);
  
  const [misiHarian,     setMisiHarian]     = useState(() => (isDemoMode ? misiDemo : []));
  const [loadingMisi,    setLoadingMisi]    = useState(() => !isDemoMode);
  const [urlMitra,       setUrlMitra]       = useState(null);
  const [kuisAktif,      setKuisAktif]      = useState(null);
  const [isReviewMode,   setIsReviewMode]   = useState(false);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [pesanKlaim, setPesanKlaim]         = useState(null);
  const [pesanKuis,  setPesanKuis]          = useState(null);

  const { streakKonsul, statsBulanIni, misiBulanan } = useStudentStats(riwayat, jadwal, siswa);

  useEffect(() => {
    if (isDemoMode) return;

    let isMountedLokal = true;
    setLoadingMisi(true);
    cekDanGenerateMisiHarian().then((res) => {
      if (isMountedLokal && res.ok) setMisiHarian(res.data);
      if (isMountedLokal) setLoadingMisi(false);
    }).catch(() => {
      if (isMountedLokal) setLoadingMisi(false);
    });
    return () => { isMountedLokal = false; };
  }, [isDemoMode]);

  const handleKlaimMisi = async (idMisi) => {
    const hasil = await klaimHadiahMisi(idMisi);
    if (hasil.ok) {
      setMisiHarian((prev) =>
        prev.map((m) => (m._id === idMisi ? { ...m, diklaim: true } : m))
      );
      setPesanKlaim({ teks: hasil.pesan, ok: true });
    } else {
      setPesanKlaim({ teks: hasil.pesan, ok: false });
    }
    setTimeout(() => setPesanKlaim(null), 3000);
  };

  const { jadwalAktif } = useMemo(
    () => pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR),
    [jadwal, riwayat]
  );

  const tglJakartaHariIni = timeHelper.getTglJakarta();

  const jadwalKuisHariIni = useMemo(() => {
    if (isDemoMode && kuisDemo?._id) {
      return { _id: "jadwal-demo-kuis", mapel: kuisDemo.mapel, bab: kuisDemo.bab, kelasTarget: siswa.kelas };
    }

    if (!Array.isArray(jadwal)) return null;
    return jadwal.find((j) => {
      const tglJadwal = timeHelper.getTglJakarta(j.tanggal);
      return tglJadwal === tglJakartaHariIni && j.kelasTarget === siswa.kelas;
    });
  }, [jadwal, tglJakartaHariIni, siswa.kelas, isDemoMode, kuisDemo]);

  const riwayatSesiIni = useMemo(() => {
    if (isDemoMode && kuisDemo?._id) {
      // 🛡️ Mencegah new Date() saat SSR
      return { waktuMulai: kuisDemo.waktuMulai || "2026-06-01T08:00:00+07:00" };
    }

    if (!jadwalKuisHariIni || !Array.isArray(riwayat)) return null;
    const targetId = jadwalKuisHariIni._id?.toString();

    return riwayat.find((r) => {
      const idRiwayat  = r.jadwalId?._id?.toString() || r.jadwalId?.toString();
      const tglAbsen   = r.waktuMulai ? timeHelper.getTglJakarta(r.waktuMulai) : null;
      const isIdMatch  = idRiwayat === targetId;
      const isFuzzyMatch =
        !idRiwayat &&
        r.jenisSesi === TIPE_SESI.KELAS &&
        tglAbsen === tglJakartaHariIni;

      return (
        (isIdMatch || isFuzzyMatch) &&
        r.status !== STATUS_SESI.ALPA.id &&
        r.status !== STATUS_SESI.TIDAK_HADIR?.id
      );
    });
  }, [jadwalKuisHariIni, riwayat, tglJakartaHariIni, isDemoMode, kuisDemo]);

  const [dataKuisLive, setDataKuisLive] = useState(() => (isDemoMode ? (kuisDemo || null) : null));

  useEffect(() => {
    if (isDemoMode) return;

    let isMountedLokal = true;
    if (!jadwalKuisHariIni) return;
    if (String(jadwalKuisHariIni._id).includes("demo")) return;

    import("@/actions/studentAction").then((module) => {
      module.cekKetersediaanKuis(jadwalKuisHariIni._id, siswa._id).then((res) => {
        if (isMountedLokal && res.ok && res.data?.ada) {
          setDataKuisLive({ ...res.data, mapel: jadwalKuisHariIni.mapel, bab: jadwalKuisHariIni.bab });
        }
      }).catch(err => console.error(err));
    });

    return () => { isMountedLokal = false; };
  }, [jadwalKuisHariIni, siswa._id, refreshTrigger, isDemoMode]);

  const handleBukaKuis = async (dataKuis, isReview = false) => {
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
      } else {
        setPesanKuis("Gagal memuat pembahasan: " + res.pesan);
        setTimeout(() => setPesanKuis(null), 3000);
      }
    } else {
      const res = await module.getKuisSiswa(jadwalKuisHariIni._id);
      if (res.ok) {
        setIsReviewMode(false);
        setJawabanPastReview([]);
        setKuisAktif({ ...dataKuisLive, soal: res.data.soal });
      } else {
        setPesanKuis("Gagal memuat soal: " + res.pesan);
        setTimeout(() => setPesanKuis(null), 3000);
      }
    }
  };

  if (!isMounted) return null; 

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

      <ArenaMisiHarian
        misiHarian={misiHarian}
        loadingMisi={loadingMisi}
        onKlaim={handleKlaimMisi}
        pesanKlaim={pesanKlaim}
      />

      <JadwalHariIni
        jadwalAktif={jadwalAktif}
        setTab={setTab}
        setModeScan={setModeScan}
        resetScanner={resetScanner}
      />

      {jadwalKuisHariIni && (
        <QuizHariIni
          kuisHariIni={dataKuisLive}
          riwayatSesiIni={riwayatSesiIni}
          pesanKuis={pesanKuis}
          onBukaKuis={handleBukaKuis}
        />
      )}

      <LatihanHariIni latihanHariIni={latihanHariIni} setUrlMitra={setUrlMitra} />

      {isKlasemenOpen && (
        <ModalKlasemen
          onClose={() => setIsKlasemenOpen(false)}
          kelasSiswa={siswa.kelas}
          klasemenDemo={klasemenDemo}
        />
      )}
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
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}