"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { kumpulkanUjianSiswa } from "@/actions/studentAction";

export function useCbtEngine({ jadwalId, kuis, siswa, isReviewMode, jawabanPast, onClose }) {
  const storageKey = `q_cbt_${jadwalId}_${siswa._id}`;
  const durasiMenit = kuis?.durasi || 10;
  const daftarSoal = kuis?.soal || [];
  
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

  useEffect(() => {
    jawabanSiswaRef.current = jawabanSiswa;
  }, [jawabanSiswa]);

  useEffect(() => {
    if (isReviewMode) {
      const pastObj = {};
      jawabanPast.forEach((jawaban, index) => {
        if (jawaban !== undefined && jawaban !== null && jawaban !== "") pastObj[index] = jawaban;
      });
      setJawabanSiswa(pastObj);
      setIsUjianMulai(true);
      setIsDataLoaded(true);
    } else {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.jawaban) setJawabanSiswa(parsed.jawaban);
          if (parsed.waktu > 0) setSisaDetik(parsed.waktu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
        } catch (error) { console.error("Gagal membaca memori CBT"); }
      }
      setIsDataLoaded(true);
    }
  }, [isReviewMode, storageKey, jawabanPast]);

  useEffect(() => {
    if (isDataLoaded && !isReviewMode) {
      const stateToSave = { jawaban: jawabanSiswa, waktu: sisaDetik, pelanggaran };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [jawabanSiswa, sisaDetik, isDataLoaded, pelanggaran, storageKey, isReviewMode]);

  useEffect(() => {
    if (isReviewMode) return;
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => { e.preventDefault(); alert("⚠️ Tindakan menyalin dilarang!"); };
    const handleVisibilityChange = () => {
      if (document.hidden && isUjianMulai && !isSubmitting && !koneksiTerputus) {
        setPelanggaran((prev) => {
          const pBaru = prev + 1;
          if (pBaru >= 3) { alert("❌ PELANGGARAN MAKSIMAL!"); eksekusiSubmit(); } 
          else { setShowPeringatan(true); }
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
  }, [isUjianMulai, isSubmitting, koneksiTerputus, isReviewMode]);

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

  useEffect(() => {
    if (isDataLoaded && isUjianMulai && !koneksiTerputus && !isReviewMode) {
      timerRef.current = setInterval(() => {
        setSisaDetik((prev) => {
          if (prev <= 1) { 
            clearInterval(timerRef.current); 
            alert("WAKTU HABIS!"); 
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

  const eksekusiSubmit = async () => {
    setIsSubmitting(true); setKoneksiTerputus(false); clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(e=>e);

    const jawabanFinal = jawabanSiswaRef.current;
    const arrayJawaban = daftarSoal.map((_, index) => 
      jawabanFinal[index] !== undefined ? jawabanFinal[index] : ""
    );
    
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error("Offline");
      const res = await kumpulkanUjianSiswa({ jadwalId, siswaId: siswa._id, nama: siswa.nama, jawabanSiswa: arrayJawaban });
      
      if (res.sukses) {
        localStorage.removeItem(storageKey);
        alert(`✅ UJIAN SELESAI!\n🎯 Nilai Anda: ${res.skor}\n🌟 Anda mendapatkan +${res.exp} EXP!`);
        onClose(); 
      } else { alert("❌ Gagal: " + res.pesan); setIsSubmitting(false); }
    } catch (err) { setKoneksiTerputus(true); }
  };

  const handleKumpulJawaban = () => {
    if (isReviewMode) return;
    if (window.confirm("Yakin ingin menyelesaikan ujian?")) eksekusiSubmit();
  };

  return {
    soalAktif, setSoalAktif, jawabanSiswa, sisaDetik,
    isSubmitting, isUjianMulai, setIsUjianMulai,
    pelanggaran, showPeringatan, setShowPeringatan, koneksiTerputus,
    handlePilihJawaban, handleToggleKompleks, handleInputIsian, handleKumpulJawaban, eksekusiSubmit
  };
}