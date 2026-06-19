"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { kumpulkanUjianSiswa } from "@/actions/studentAction";

export function useCbtEngine({ jadwalId, kuis, siswa, isReviewMode, jawabanPast, onClose }) {
  const storageKey = `q_cbt_${jadwalId}_${siswa?._id}`;
  // ✅ FIX: kuis?.durasi → kuis?.durasiMenit (Quiz schema M4)
  const durasiMenit = kuis?.durasiMenit || 10;
  const daftarSoal  = kuis?.soal || [];

  const [soalAktif,          setSoalAktif]          = useState(0);
  const [jawabanSiswa,       setJawabanSiswa]        = useState({});
  const [sisaDetik,          setSisaDetik]           = useState(durasiMenit * 60);
  const [isSubmitting,       setIsSubmitting]        = useState(false);
  const [isDataLoaded,       setIsDataLoaded]        = useState(false);
  const [isUjianMulai,       setIsUjianMulai]        = useState(false);
  const [pelanggaran,        setPelanggaran]         = useState(0);
  const [showPeringatan,     setShowPeringatan]      = useState(false);
  const [koneksiTerputus,    setKoneksiTerputus]     = useState(false);
  // ✅ FIX: State konfirmasi submit — menggantikan window.confirm
  const [showKonfirmasiSubmit, setShowKonfirmasiSubmit] = useState(false);
  // ✅ State pesan selesai — menggantikan alert() post-submit
  const [pesanSelesai, setPesanSelesai] = useState(null);
  // ✅ State pesan gagal submit — menggantikan alert() saat server menolak jawaban
  const [pesanGagalSubmit, setPesanGagalSubmit] = useState(null);

  const jawabanSiswaRef = useRef({});
  const timerRef        = useRef(null);

  // Sinkronisasi Ref agar submit selalu mendapat data terbaru
  useEffect(() => { jawabanSiswaRef.current = jawabanSiswa; }, [jawabanSiswa]);

  // Muat data review atau state lokal
  useEffect(() => {
    if (isReviewMode && jawabanPast) {
      const pastObj = {};
      jawabanPast.forEach((jawaban, index) => {
        pastObj[index] = jawaban !== undefined && jawaban !== null ? jawaban : "";
      });
      setJawabanSiswa(pastObj);
      setIsUjianMulai(true);
      setIsDataLoaded(true);
    } else if (!isReviewMode) {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.jawaban)    setJawabanSiswa(parsed.jawaban);
          if (parsed.waktu > 0)  setSisaDetik(parsed.waktu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
        } catch { console.error("[CBT] Gagal membaca state tersimpan."); }
      }
      setIsDataLoaded(true);
    }
  }, [isReviewMode, storageKey, jawabanPast]);

  // Auto-Save ke localStorage saat ujian berjalan
  useEffect(() => {
    if (isDataLoaded && !isReviewMode && isUjianMulai) {
      localStorage.setItem(storageKey, JSON.stringify({
        jawaban: jawabanSiswa, waktu: sisaDetik, pelanggaran,
      }));
    }
  }, [jawabanSiswa, sisaDetik, isDataLoaded, pelanggaran, storageKey, isReviewMode, isUjianMulai]);

  // Anti-Cheat Listeners
  useEffect(() => {
    if (isReviewMode || !isUjianMulai || isSubmitting) return;

    const handleContextMenu  = (e) => e.preventDefault();
    const handleCopy         = (e) => {
      e.preventDefault();
      // alert dipertahankan: sengaja mengganggu untuk efek anti-cheat
      alert("⚠️ Tindakan menyalin dilarang selama ujian!");
    };
    const handleVisibilityChange = () => {
      if (document.hidden && !koneksiTerputus) {
        setPelanggaran((prev) => {
          const pBaru = prev + 1;
          if (pBaru >= 3) {
            // alert dipertahankan: pelanggaran fatal harus mengganggu
            alert("❌ PELANGGARAN MAKSIMAL! Ujian otomatis dihentikan.");
            eksekusiSubmit();
          } else {
            setShowPeringatan(true);
          }
          return pBaru;
        });
      }
    };

    document.addEventListener("contextmenu",    handleContextMenu);
    document.addEventListener("copy",           handleCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("contextmenu",    handleContextMenu);
      document.removeEventListener("copy",           handleCopy);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUjianMulai, isSubmitting, koneksiTerputus, isReviewMode]);

  // Deteksi koneksi pulih — coba submit ulang
  useEffect(() => {
    const handleOnline = () => {
      if (koneksiTerputus && isSubmitting && !isReviewMode) {
        setKoneksiTerputus(false);
        eksekusiSubmit();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koneksiTerputus, isSubmitting, isReviewMode]);

  // Countdown Timer
  useEffect(() => {
    if (isDataLoaded && isUjianMulai && !koneksiTerputus && !isReviewMode) {
      timerRef.current = setInterval(() => {
        setSisaDetik((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // alert dipertahankan: notifikasi waktu habis harus segera terlihat
            alert("WAKTU HABIS! Jawaban otomatis dikumpulkan.");
            eksekusiSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded, isUjianMulai, koneksiTerputus, isReviewMode]);

  const handlePilihJawaban = useCallback((nomorSoal, opsiPilihan) => {
    if (isReviewMode) return;
    setJawabanSiswa((prev) => ({ ...prev, [nomorSoal]: opsiPilihan }));
  }, [isReviewMode]);

  const handleToggleKompleks = useCallback((nomorSoal, opsiPilihan) => {
    if (isReviewMode) return;
    setJawabanSiswa((prev) => {
      const currentArr = Array.isArray(prev[nomorSoal]) ? [...prev[nomorSoal]] : [];
      return {
        ...prev,
        [nomorSoal]: currentArr.includes(opsiPilihan)
          ? currentArr.filter((item) => item !== opsiPilihan)
          : [...currentArr, opsiPilihan],
      };
    });
  }, [isReviewMode]);

  const handleInputIsian = useCallback((nomorSoal, text) => {
    if (isReviewMode) return;
    setJawabanSiswa((prev) => ({ ...prev, [nomorSoal]: text }));
  }, [isReviewMode]);

  const eksekusiSubmit = async () => {
    // 🎭 Mode Demo: jangan pernah kirim jawaban ke server sungguhan.
    // jadwalId demo selalu mengandung kata "demo" (lihat app/demo/constant-demo.js).
    if (jadwalId && jadwalId.includes("demo")) {
      localStorage.removeItem(storageKey);
      setPesanSelesai({ isDemo: true });
      return;
    }

    setIsSubmitting(true);
    setKoneksiTerputus(false);
    setPesanGagalSubmit(null); // reset pesan gagal percobaan sebelumnya (jika retry)
    clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    const jawabanFinal = jawabanSiswaRef.current;
    const arrayJawaban = daftarSoal.map((_, index) =>
      jawabanFinal[index] !== undefined ? jawabanFinal[index] : ""
    );

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("Offline");

      const res = await kumpulkanUjianSiswa({
        jadwalId, siswaId: siswa._id, nama: siswa.nama, jawabanSiswa: arrayJawaban,
      });

      if (res.ok) {
        localStorage.removeItem(storageKey);
        // ✅ FIX: Set state pesan selesai — bukan alert()
        setPesanSelesai({ skor: res.data?.skor, exp: res.data?.exp });
      } else {
        // ✅ FIX: server menolak jawaban — pakai state, konsisten dgn path sukses di atas
        // (sebelumnya masih alert() di sini meski path sukses sudah dikonversi)
        setPesanGagalSubmit(res.pesan || "Server menolak jawaban Anda.");
        setIsSubmitting(false);
      }
    } catch {
      setKoneksiTerputus(true);
    }
  };

  // ✅ FIX: Tidak lagi panggil window.confirm — set state, ModalUjianCBT yang render UI
  const handleKumpulJawaban = () => {
    if (isReviewMode) return;
    setShowKonfirmasiSubmit(true);
  };

  const konfirmasiSubmit = () => {
    setShowKonfirmasiSubmit(false);
    eksekusiSubmit();
  };

  const batalKonfirmasiSubmit = () => setShowKonfirmasiSubmit(false);

  return {
    soalAktif, setSoalAktif, jawabanSiswa, sisaDetik,
    isSubmitting, isUjianMulai, setIsUjianMulai,
    pelanggaran, showPeringatan, setShowPeringatan, koneksiTerputus,
    showKonfirmasiSubmit, konfirmasiSubmit, batalKonfirmasiSubmit,
    pesanSelesai, setPesanSelesai,
    pesanGagalSubmit, setPesanGagalSubmit,
    handlePilihJawaban, handleToggleKompleks, handleInputIsian,
    handleKumpulJawaban, eksekusiSubmit,
  };
}