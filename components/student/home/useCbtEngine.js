"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { kumpulkanUjianSiswa } from "@/actions/studentAction";

export function useCbtEngine({ jadwalId, kuis, siswa, isReviewMode, jawabanPast, onClose }) {
  const storageKey = `q_cbt_${jadwalId}_${siswa?._id}`;
  const breakStorageKey = `q_break_${jadwalId}_${siswa?._id}`;
  const electiveStorageKey = `q_elective_${jadwalId}_${siswa?._id}`;
  
  const kuisData = kuis?.data || kuis;
  const isTryOutMode = kuisData?.jenisUjian === "TRYOUT";
  const semuaSubtesMaster = kuisData?.daftarSubtes || [];
  
  const batasWajib = Number(kuisData?.batasSubtesWajib) || 3;
  const totalSubtesDikerjakanSiswa = Number(kuisData?.jumlahSubtesDikerjakan) || semuaSubtesMaster.length;
  const jumlahPilihanHarusDipilih = Math.max(0, totalSubtesDikerjakanSiswa - batasWajib);

  const subtesWajibList = semuaSubtesMaster.slice(0, batasWajib);
  const kolamPilihanList = semuaSubtesMaster.slice(batasWajib);

  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0);
  const [isLayarJeda, setIsLayarJeda] = useState(false);
  
  const [isMemilihPilihan, setIsMemilihPilihan] = useState(false);
  const [pilihanTerpilih, setPilihanTerpilih] = useState([]);

  const [isLongBreak, setIsLongBreak] = useState(false);
  const [longBreakEndsAt, setLongBreakEndsAt] = useState(null);
  const [sisaBreakDetik, setSisaBreakDetik] = useState(0);

  const [daftarSubtesAktif, setDaftarSubtesAktif] = useState(subtesWajibList);

  // 🚀 Tentukan durasi aktif dengan aman (Kuis tunggal membaca kuisData.durasi)
  const durasiMenit = isTryOutMode 
    ? (daftarSubtesAktif[subtesAktifIndex]?.durasi || 10) 
    : (Number(kuisData?.durasi) || 10);

  const daftarSoal = isTryOutMode ? (daftarSubtesAktif[subtesAktifIndex]?.soal || []) : (kuisData?.soal || []);
  
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
  const breakTimerRef = useRef(null);

  useEffect(() => {
    jawabanSiswaRef.current = jawabanSiswa;
  }, [jawabanSiswa]);

  // 🚀 Sinkronisasi durasi secara reaktif saat kuisData berhasil dimuat dari server
  useEffect(() => {
    if (kuisData && !isReviewMode && !isDataLoaded) {
      const savedState = localStorage.getItem(storageKey);
      if (!savedState) {
        const durasiBaru = isTryOutMode ? (daftarSubtesAktif[0]?.durasi || 10) : (Number(kuisData?.durasi) || 10);
        setSisaDetik(durasiBaru * 60);
      }
    }
  }, [kuisData, isTryOutMode, daftarSubtesAktif, storageKey, isReviewMode, isDataLoaded]);

  // Muat Data Review & State Lokal
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
      const savedElectives = localStorage.getItem(electiveStorageKey);
      let activeSubtes = subtesWajibList;
      if (savedElectives) {
        try {
          const parsedElectives = JSON.parse(savedElectives);
          setPilihanTerpilih(parsedElectives);
          activeSubtes = [...subtesWajibList, ...parsedElectives];
        } catch (e) {}
      }
      setDaftarSubtesAktif(activeSubtes);

      const savedBreakEnd = localStorage.getItem(breakStorageKey);
      const savedBreakDuration = localStorage.getItem(breakStorageKey + "_duration");
      const currentBreakMinutes = Number(kuisData?.durasiBreakMenit) || 60;

      if (savedBreakEnd) {
        if (savedBreakDuration && Number(savedBreakDuration) !== currentBreakMinutes) {
          localStorage.removeItem(breakStorageKey);
          localStorage.removeItem(breakStorageKey + "_duration");
        } else {
          const breakEndTimestamp = Number(savedBreakEnd);
          const sisa = Math.floor((breakEndTimestamp - Date.now()) / 1000);
          if (sisa > 0) {
            setIsLongBreak(true);
            setLongBreakEndsAt(breakEndTimestamp);
            setSisaBreakDetik(sisa);
          } else {
            localStorage.removeItem(breakStorageKey);
            localStorage.removeItem(breakStorageKey + "_duration");
          }
        }
      }

      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.subtesAktifIndex !== undefined) setSubtesAktifIndex(parsed.subtesAktifIndex);
          if (parsed.isLayarJeda !== undefined) setIsLayarJeda(parsed.isLayarJeda);
          if (parsed.jawaban) setJawabanSiswa(parsed.jawaban);
          if (parsed.waktu > 0) setSisaDetik(parsed.waktu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
        } catch (error) {  
          console.error("Gagal membaca memori CBT");  
        }
      } else {
        const durasiAwal = isTryOutMode ? (activeSubtes[0]?.durasi || 10) : (Number(kuisData?.durasi) || 10);
        setSisaDetik(durasiAwal * 60);
      }
      setIsDataLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReviewMode, storageKey, breakStorageKey, electiveStorageKey, jawabanPast]);

  // Auto-Save ke Local Storage
  useEffect(() => {
    if (isDataLoaded && !isReviewMode && isUjianMulai && !isLongBreak && !isMemilihPilihan) {
      const stateToSave = {  
        jawaban: jawabanSiswa,  
        waktu: sisaDetik,  
        pelanggaran,
        subtesAktifIndex,
        isLayarJeda
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [jawabanSiswa, sisaDetik, isDataLoaded, pelanggaran, storageKey, isReviewMode, isUjianMulai, subtesAktifIndex, isLayarJeda, isLongBreak, isMemilihPilihan]);

  // Timer Hitung Mundur Jeda Panjang (Long Break)
  useEffect(() => {
    if (!isLongBreak || !longBreakEndsAt) return;

    breakTimerRef.current = setInterval(() => {
      const sisa = Math.floor((longBreakEndsAt - Date.now()) / 1000);
      if (sisa <= 0) {
        clearInterval(breakTimerRef.current);
        setIsLongBreak(false);
        setLongBreakEndsAt(null);
        setSisaBreakDetik(0);
        localStorage.removeItem(breakStorageKey);
        localStorage.removeItem(breakStorageKey + "_duration");
      } else {
        setSisaBreakDetik(sisa);
      }
    }, 1000);

    return () => clearInterval(breakTimerRef.current);
  }, [isLongBreak, longBreakEndsAt, breakStorageKey]);

  // Sistem Anti-Cheat
  useEffect(() => {
    if (isReviewMode || !isUjianMulai || isSubmitting || isLayarJeda || isLongBreak || isMemilihPilihan) return;
    
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
  }, [isUjianMulai, isSubmitting, koneksiTerputus, isReviewMode, isLayarJeda, isLongBreak, isMemilihPilihan]);

  // Deteksi Koneksi Internet Terputus
  useEffect(() => {
    const handleOnline = () => {
      if (koneksiTerputus && isSubmitting && !isReviewMode) {
        setKoneksiTerputus(false); eksekusiSubmit();  
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [koneksiTerputus, isSubmitting, isReviewMode]);

  // Countdown Timer Ujian
  useEffect(() => {
    if (isDataLoaded && isUjianMulai && !koneksiTerputus && !isReviewMode && !isLayarJeda && !isLongBreak && !isMemilihPilihan) {
      timerRef.current = setInterval(() => {
        setSisaDetik((prev) => {
          if (prev <= 1) {  
            clearInterval(timerRef.current);  
            alert(isTryOutMode && subtesAktifIndex < totalSubtesDikerjakanSiswa - 1  
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
  }, [isDataLoaded, isUjianMulai, koneksiTerputus, isReviewMode, isLayarJeda, isLongBreak, isMemilihPilihan, isTryOutMode, subtesAktifIndex, totalSubtesDikerjakanSiswa]);

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

  const togglePilihElective = (subtesItem) => {
    if (pilihanTerpilih.some(item => item.judulSubtes === subtesItem.judulSubtes)) {
      setPilihanTerpilih(prev => prev.filter(item => item.judulSubtes !== subtesItem.judulSubtes));
    } else {
      if (pilihanTerpilih.length < jumlahPilihanHarusDipilih) {
        setPilihanTerpilih(prev => [...prev, subtesItem]);
      } else {
        alert(`Maksimal Anda hanya dapat memilih ${jumlahPilihanHarusDipilih} subtes pilihan.`);
      }
    }
  };

  const konfirmasiPilihanElective = () => {
    if (pilihanTerpilih.length < jumlahPilihanHarusDipilih) {
      alert(`Silakan pilih ${jumlahPilihanHarusDipilih - pilihanTerpilih.length} subtes lagi.`);
      return;
    }

    const subtesLengkap = [...subtesWajibList, ...pilihanTerpilih];
    setDaftarSubtesAktif(subtesLengkap);
    localStorage.setItem(electiveStorageKey, JSON.stringify(pilihanTerpilih));
    setIsMemilihPilihan(false);

    const menitBreak = Number(kuisData?.durasiBreakMenit) || 60;
    const durasiBreakMs = menitBreak * 60 * 1000; 
    const breakEndTimestamp = Date.now() + durasiBreakMs;
    
    localStorage.setItem(breakStorageKey, breakEndTimestamp);
    localStorage.setItem(breakStorageKey + "_duration", menitBreak);
    setLongBreakEndsAt(breakEndTimestamp);
    setSisaBreakDetik(menitBreak * 60);
    setIsLongBreak(true);
  };

  const eksekusiSubmit = async () => {
    setIsSubmitting(true); setKoneksiTerputus(false); clearInterval(timerRef.current);
    
    const isPartialSubmit = isTryOutMode && subtesAktifIndex < totalSubtesDikerjakanSiswa - 1;
    
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
        isPartialSubmit,
        subtesAktifIndex,
        judulSubtes: isTryOutMode ? daftarSubtesAktif[subtesAktifIndex]?.judulSubtes : null
      });
      
      if (res.sukses) {
        if (isPartialSubmit) {
          const isSelesaiWajib = (subtesAktifIndex === batasWajib - 1);  
          
          if (isSelesaiWajib && jumlahPilihanHarusDipilih > 0 && pilihanTerpilih.length === 0) {
            setIsMemilihPilihan(true);
          } else if (isSelesaiWajib) {
            const menitBreak = Number(kuisData?.durasiBreakMenit) || 60;
            const durasiBreakMs = menitBreak * 60 * 1000; 
            const breakEndTimestamp = Date.now() + durasiBreakMs;
            
            localStorage.setItem(breakStorageKey, breakEndTimestamp);
            localStorage.setItem(breakStorageKey + "_duration", menitBreak);
            setLongBreakEndsAt(breakEndTimestamp);
            setSisaBreakDetik(menitBreak * 60);
            setIsLongBreak(true);
          } else {
            setIsLayarJeda(true);
          }
          
          setIsSubmitting(false);
        } else {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(breakStorageKey);
          localStorage.removeItem(breakStorageKey + "_duration");
          localStorage.removeItem(electiveStorageKey);
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
    const pesanConfirm = (isTryOutMode && subtesAktifIndex < totalSubtesDikerjakanSiswa - 1)  
      ? "Kumpulkan subtes ini dan lanjut ke sesi berikutnya? (Jawaban tidak bisa diubah lagi)"  
      : "Yakin ingin menyelesaikan seluruh ujian sekarang?";
      
    if (window.confirm(pesanConfirm)) eksekusiSubmit();
  };

  const lanjutSubtesBerikutnya = () => {
    const nextIndex = subtesAktifIndex + 1;
    setSubtesAktifIndex(nextIndex);
    setIsLayarJeda(false);
    setSoalAktif(0);
    setJawabanSiswa({});
    setSisaDetik((daftarSubtesAktif[nextIndex]?.durasi || 10) * 60);
  };

  return {
    soalAktif, setSoalAktif, jawabanSiswa, sisaDetik,
    isSubmitting, isUjianMulai, setIsUjianMulai,
    pelanggaran, showPeringatan, setShowPeringatan, koneksiTerputus,
    isTryOutMode, isLayarJeda, subtesAktifIndex, daftarSubtes: daftarSubtesAktif, daftarSoal, lanjutSubtesBerikutnya,
    isLongBreak, sisaBreakDetik,
    isMemilihPilihan, kolamPilihanList, pilihanTerpilih, jumlahPilihanHarusDipilih, togglePilihElective, konfirmasiPilihanElective,
    handlePilihJawaban, handleToggleKompleks, handleInputIsian, handleKumpulJawaban, eksekusiSubmit
  };
}
