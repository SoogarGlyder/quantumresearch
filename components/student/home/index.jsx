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
  const [isKlasemenOpen, setIsKlasemenOpen] = useState(false);
  // 🎭 Mode Demo: pasang data misi demo langsung, tanpa loading state
  const [misiHarian,     setMisiHarian]     = useState(() => (isDemoMode ? misiDemo : []));
  const [loadingMisi,    setLoadingMisi]    = useState(() => !isDemoMode);
  const [urlMitra,       setUrlMitra]       = useState(null);
  const [kuisAktif,      setKuisAktif]      = useState(null);
  const [isReviewMode,   setIsReviewMode]   = useState(false);
  const [jawabanPastReview, setJawabanPastReview] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Pesan untuk klaim misi — menggantikan alert()
  const [pesanKlaim, setPesanKlaim]         = useState(null);
  // Pesan untuk error buka kuis — menggantikan alert()
  const [pesanKuis,  setPesanKuis]          = useState(null);

  const { streakKonsul, statsBulanIni, misiBulanan } = useStudentStats(riwayat, jadwal, siswa);

  useEffect(() => {
    // 🎭 Mode Demo: misiDemo sudah dipasang sebagai initial state, jangan panggil server action.
    if (isDemoMode) return;

    let isMounted = true;
    setLoadingMisi(true);
    cekDanGenerateMisiHarian().then((res) => {
      if (isMounted && res.ok) setMisiHarian(res.data);
      if (isMounted) setLoadingMisi(false);
    });
    return () => { isMounted = false; };
  }, [isDemoMode]);

  const handleKlaimMisi = async (idMisi) => {
    const hasil = await klaimHadiahMisi(idMisi);
    // ✅ FIX: hasil.sukses → hasil.ok
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

  // ✅ FIX: Pakai timeHelper.getTglJakarta — bukan fungsi lokal
  const tglJakartaHariIni = timeHelper.getTglJakarta();

  const jadwalKuisHariIni = useMemo(() => {
    // 🎭 Mode Demo: bungkus kuisDemo dalam objek "jadwal" minimal agar QuizHariIni mau render.
    if (isDemoMode && kuisDemo?._id) {
      return { _id: "jadwal-demo-kuis", mapel: kuisDemo.mapel, bab: kuisDemo.bab, kelasTarget: siswa.kelas };
    }

    if (!Array.isArray(jadwal)) return null;
    return jadwal.find((j) => {
      // ✅ FIX: Pakai timeHelper.getTglJakarta(j.tanggal) — bukan substring(0,10)
      // Setelah serialize(), tanggal Jakarta tersimpan sebagai UTC ISO string.
      // substring(0,10) mengambil tanggal UTC bukan Jakarta → bisa salah 1 hari.
      const tglJadwal = timeHelper.getTglJakarta(j.tanggal);
      return tglJadwal === tglJakartaHariIni && j.kelasTarget === siswa.kelas;
    });
  }, [jadwal, tglJakartaHariIni, siswa.kelas, isDemoMode, kuisDemo]);

  const riwayatSesiIni = useMemo(() => {
    // 🎭 Mode Demo: anggap siswa "sudah scan masuk" agar tombol kuis tidak terkunci.
    if (isDemoMode && kuisDemo?._id) {
      return { waktuMulai: new Date().toISOString() };
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

  // 🎭 Mode Demo: pasang kuisDemo langsung sebagai data live, tanpa fetch ke server.
  const [dataKuisLive, setDataKuisLive] = useState(() => (isDemoMode ? (kuisDemo || null) : null));

  useEffect(() => {
    // 🎭 Mode Demo: dataKuisLive sudah dipasang sebagai initial state — jangan sentuh server.
    if (isDemoMode) return;

    let isMounted = true;
    if (!jadwalKuisHariIni) return;
    // Failsafe tambahan: pastikan ID jadwal asli (bukan stand-in demo)
    if (String(jadwalKuisHariIni._id).includes("demo")) return;

    import("@/actions/studentAction").then((module) => {
      module.cekKetersediaanKuis(jadwalKuisHariIni._id, siswa._id).then((res) => {
        if (isMounted && res.ok && res.data?.ada) {
          setDataKuisLive({ ...res.data, mapel: jadwalKuisHariIni.mapel, bab: jadwalKuisHariIni.bab });
        }
      });
    });

    return () => { isMounted = false; };
  }, [jadwalKuisHariIni, siswa._id, refreshTrigger, isDemoMode]);

  const handleBukaKuis = async (dataKuis, isReview = false) => {
    // 🎭 Mode Demo: tampilkan kuisDemo langsung, tidak ada panggilan server / mode review.
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