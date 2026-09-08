"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { kumpulkanUjianSiswa } from "@/actions/studentAction";

export function useCbtEngine({ jadwalId, kuis, siswa, isReviewMode, jawabanPast, onClose }) {
  const storageKey = `q_cbt_${jadwalId}_${siswa?._id}`;
  
  // 🚀 LOGIKA ESTAFET: Deteksi Mode Try Out
  const isTryOutMode = kuis?.jenisUjian === "TRYOUT";
  const daftarSubtes = kuis?.daftarSubtes || [];
  
  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0);
  const [isLayarJeda, setIsLayarJeda] = useState(false);

  // Ambil durasi dan daftar soal secara dinamis (tergantung mode dan indeks subtes)
  const durasiMenit = isTryOutMode ? (daftarSubtes[subtesAktifIndex]?.durasi || 10) : (kuis?.durasi || 10);
  const daftarSoal = isTryOutMode ? (daftarSubtes[subtesAktifIndex]?.soal || []) : (kuis?.soal || []);
  
  const [soalAktif, setSoalAktif] = useState(0);
  const [jawabanSiswa, setJawabanSiswa] = useState({});
  const jawabanSiswaRef = useRef({});
  
  const [sisaDetik, setSisaDetik] = useState(durasiMenit * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isUjianMulai, setIsUjianMulai] = useState(false);
  const [pelanggaran, setPelanggaran] = useState(0);
  const [showPeringatan, setShowPeringatan] = useState(false);
  const [koneksiTerputus, setKoneksiTerputus] = useState(false);
  
  const timerRef = useRef(null);

  // Sinkronisasi Ref agar fungsi submit selalu mendapat data terbaru dari state
  useEffect(() => {
    jawabanSiswaRef.current = jawabanSiswa;
  }, [jawabanSiswa]);

  // Muat Data Review / Lokal
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
          // 🚀 PENGAMANAN TRY OUT: Pulihkan posisi subtes terakhir siswa
          if (parsed.subtesAktifIndex !== undefined) setSubtesAktifIndex(parsed.subtesAktifIndex);
          if (parsed.isLayarJeda !== undefined) setIsLayarJeda(parsed.isLayarJeda);
          if (parsed.jawaban) setJawabanSiswa(parsed.jawaban);
          if (parsed.waktu > 0) setSisaDetik(parsed.waktu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
        } catch (error) { 
          console.error("Gagal membaca memori CBT"); 
        }
      } else {
        // Jika tidak ada save-an, set timer awal
        setSisaDetik(durasiMenit * 60);
      }
      setIsDataLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReviewMode, storageKey, jawabanPast]);

  // Auto-Save ke Local Storage (Termasuk posisi subtes untuk Try Out)
  useEffect(() => {
    if (isDataLoaded && !isReviewMode && isUjianMulai) {
      const stateToSave = { 
        jawaban: jawabanSiswa, 
        waktu: sisaDetik, 
        pelanggaran,
        subtesAktifIndex,
        isLayarJeda
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [jawabanSiswa, sisaDetik, isDataLoaded, pelanggaran, storageKey, isReviewMode, isUjianMulai, subtesAktifIndex, isLayarJeda]);

  // Sistem Anti-Cheat (Tidak berubah)
  useEffect(() => {
    if (isReviewMode || !isUjianMulai || isSubmitting || isLayarJeda) return;
    
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => { 
      e.preventDefault(); 
      alert("⚠️ Tindakan menyalin dilarang selama ujian!"); 
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && !koneksiTerputus) {
        setPelanggaran((prev) => {
          const pBaru = prev + 1;
          if (pBaru >= 3) { 
            alert("❌ PELANGGARAN MAKSIMAL! Ujian otomatis dihentikan."); 
            eksekusiSubmit(); 
          } else { 
            setShowPeringatan(true); 
          }
          return pBaru;
        });
      }
    };
    
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUjianMulai, isSubmitting, koneksiTerputus, isReviewMode, isLayarJeda]);

  // Deteksi Koneksi Internet Terputus
  useEffect(() => {
    const handleOnline = () => {
      if (koneksiTerputus && isSubmitting && !isReviewMode) {
        setKoneksiTerputus(false); eksekusiSubmit(); 
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koneksiTerputus, isSubmitting, isReviewMode]);

  // Countdown Timer
  useEffect(() => {
    if (isDataLoaded && isUjianMulai && !koneksiTerputus && !isReviewMode && !isLayarJeda) {
      timerRef.current = setInterval(() => {
        setSisaDetik((prev) => {
          if (prev <= 1) { 
            clearInterval(timerRef.current); 
            alert(isTryOutMode && subtesAktifIndex < daftarSubtes.length - 1 
              ? "WAKTU HABIS! Menyimpan subtes ini..." 
              : "WAKTU HABIS! Jawaban otomatis dikumpulkan."); 
            eksekusiSubmit(); 
            return 0; 
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded, isUjianMulai, koneksiTerputus, isReviewMode, isLayarJeda, isTryOutMode, subtesAktifIndex]);

  // Handler Pilihan Jawaban
  const handlePilihJawaban = useCallback((nomorSoal, opsiPilihan) => {
    if (isReviewMode) return; 
    setJawabanSiswa((prev) => ({ ...prev, [nomorSoal]: opsiPilihan }));
  }, [isReviewMode]);

  const handleToggleKompleks = useCallback((nomorSoal, opsiPilihan) => {
    if (isReviewMode) return;
    setJawabanSiswa((prev) => {
      const currentArr = Array.isArray(prev[nomorSoal]) ? [...prev[nomorSoal]] : [];
      if (currentArr.includes(opsiPilihan)) {
        return { ...prev, [nomorSoal]: currentArr.filter(item => item !== opsiPilihan) };
      } else {
        return { ...prev, [nomorSoal]: [...currentArr, opsiPilihan] };
      }
    });
  }, [isReviewMode]);

  const handleInputIsian = useCallback((nomorSoal, text) => {
    if (isReviewMode) return;
    setJawabanSiswa((prev) => ({ ...prev, [nomorSoal]: text }));
  }, [isReviewMode]);

  // 🚀 EKSEKUSI SUBMIT (Mendukung Pengumpulan Parsial Try Out)
  const eksekusiSubmit = async () => {
    setIsSubmitting(true); setKoneksiTerputus(false); clearInterval(timerRef.current);
    
    // Tentukan apakah ini kumpul total atau kumpul subtes (parsial)
    const isPartialSubmit = isTryOutMode && subtesAktifIndex < daftarSubtes.length - 1;
    
    if (!isPartialSubmit && document.fullscreenElement) {
      document.exitFullscreen().catch(e=>e);
    }

    const jawabanFinal = jawabanSiswaRef.current;
    const arrayJawaban = daftarSoal.map((_, index) => 
      jawabanFinal[index] !== undefined ? jawabanFinal[index] : ""
    );
    
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error("Offline");
      
      const res = await kumpulkanUjianSiswa({ 
        jadwalId, 
        siswaId: siswa._id, 
        nama: siswa.nama, 
        jawabanSiswa: arrayJawaban,
        // Payload khusus Backend baru (nanti kita buat di sesi selanjutnya)
        isPartialSubmit,
        subtesAktifIndex,
        judulSubtes: isTryOutMode ? daftarSubtes[subtesAktifIndex].judulSubtes : null
      });
      
      if (res.sukses) {
        if (isPartialSubmit) {
          // Jika sukses simpan subtes, masuki fase jeda
          setIsLayarJeda(true);
          setIsSubmitting(false);
        } else {
          // Ujian benar-benar berakhir
          localStorage.removeItem(storageKey);
          alert(`✅ UJIAN SELESAI!\n🎯 Nilai Anda: ${res.skor}\n🌟 Anda mendapatkan +${res.exp} EXP!`);
          onClose(); 
        }
      } else { 
        alert("❌ Gagal: " + res.pesan); 
        setIsSubmitting(false); 
      }
    } catch (err) { 
      setKoneksiTerputus(true); 
    }
  };

  const handleKumpulJawaban = () => {
    if (isReviewMode) return;
    const pesanConfirm = (isTryOutMode && subtesAktifIndex < daftarSubtes.length - 1) 
      ? "Kumpulkan subtes ini dan lanjut ke jeda? (Jawaban tidak bisa diubah lagi)" 
      : "Yakin ingin menyelesaikan seluruh ujian sekarang?";
      
    if (window.confirm(pesanConfirm)) eksekusiSubmit();
  };

  // 🚀 FUNGSI BARU: Lanjut ke Subtes Berikutnya setelah Jeda
  const lanjutSubtesBerikutnya = () => {
    const nextIndex = subtesAktifIndex + 1;
    setSubtesAktifIndex(nextIndex);
    setIsLayarJeda(false);
    setSoalAktif(0);
    setJawabanSiswa({});
    setSisaDetik((daftarSubtes[nextIndex]?.durasi || 10) * 60);
  };

  return {
    soalAktif, setSoalAktif, jawabanSiswa, sisaDetik,
    isSubmitting, isUjianMulai, setIsUjianMulai,
    pelanggaran, showPeringatan, setShowPeringatan, koneksiTerputus,
    isTryOutMode, isLayarJeda, subtesAktifIndex, daftarSubtes, daftarSoal, lanjutSubtesBerikutnya,
    handlePilihJawaban, handleToggleKompleks, handleInputIsian, handleKumpulJawaban, eksekusiSubmit
  };
}
