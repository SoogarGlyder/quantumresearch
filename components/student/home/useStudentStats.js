"use client";

import { useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import { TIPE_SESI, STATUS_SESI, EVENT_PENTING, GAMIFIKASI } from "@/utils/constants";

const MAX_STREAK_HARI = 366;

// Ambil string YYYY-MM-DD timezone Jakarta — pakai timeHelper yang sudah tested
const tglJkt       = (dateData) => dateData ? timeHelper.getTglJakarta(new Date(dateData)) : "";
// Ambil string YYYY-MM — untuk grouping per bulan
const bulanTahunJkt = (dateData) => {
  if (!dateData) return "";
  const d   = new Date(dateData);
  const tgl = tglJkt(d); // "YYYY-MM-DD"
  return tgl.substring(0, 7);  // "YYYY-MM"
};

export function useStudentStats(riwayat, jadwal, siswa) {

  // 1. STREAK KONSUL — berapa hari berturut-turut siswa konsul
  const streakKonsul = useMemo(() => {
    if (!riwayat?.length) return 0;

    const daftarLibur = EVENT_PENTING.TANGGAL_LIBUR || [];
    const tanggalUnikKonsul = new Set(
      riwayat
        .filter((r) =>
          r.jenisSesi === TIPE_SESI.KONSUL &&
          r.status === STATUS_SESI.SELESAI.id &&
          r.waktuMulai
        )
        .map((r) => tglJkt(r.waktuMulai))
    );

    const hariIni     = new Date();
    let   tanggalCek  = new Date(hariIni);
    let   totalStreak = 0;

    // ✅ FIX: Ganti while(true) dengan batas 366 iterasi
    // Cari titik awal (hari terakhir ada konsul)
    for (let i = 0; i < MAX_STREAK_HARI; i++) {
      const tglStr = tglJkt(tanggalCek);
      if (tanggalUnikKonsul.has(tglStr)) break;

      // Lewati Minggu & hari libur
      if (tanggalCek.getDay() === 0 || daftarLibur.includes(tglStr)) {
        tanggalCek.setDate(tanggalCek.getDate() - 1);
        continue;
      }

      tanggalCek.setDate(tanggalCek.getDate() - 1);
      const tglKemarinStr = tglJkt(tanggalCek);

      // Jika kemarin bukan libur dan tidak ada konsul → streak = 0
      if (
        !tanggalUnikKonsul.has(tglKemarinStr) &&
        tanggalCek.getDay() !== 0 &&
        !daftarLibur.includes(tglKemarinStr)
      ) {
        return 0;
      }
      break;
    }

    // Hitung streak ke belakang
    for (let i = 0; i < MAX_STREAK_HARI; i++) {
      const tglStr = tglJkt(tanggalCek);
      if (tanggalUnikKonsul.has(tglStr)) {
        totalStreak++;
        tanggalCek.setDate(tanggalCek.getDate() - 1);
      } else if (tanggalCek.getDay() === 0 || daftarLibur.includes(tglStr)) {
        tanggalCek.setDate(tanggalCek.getDate() - 1);
      } else {
        break;
      }
    }

    return totalStreak;
  }, [riwayat]);

  // 2. STATISTIK BULAN INI
  const statsBulanIni = useMemo(() => {
    const sekarang       = new Date();
    const bulanIniStr    = bulanTahunJkt(sekarang);
    const tglSekarangStr = tglJkt(sekarang);

    const riwayatBulanIni = riwayat?.filter(
      (r) => bulanTahunJkt(r.waktuMulai) === bulanIniStr
    ) || [];

    let totalMenitKonsul = 0;
    let mapelCount       = {};
    let kelasHadir       = 0;

    riwayatBulanIni.forEach((r) => {
      if (
        r.jenisSesi === TIPE_SESI.KONSUL &&
        r.status === STATUS_SESI.SELESAI.id &&
        r.waktuSelesai
      ) {
        totalMenitKonsul +=
          Math.floor((new Date(r.waktuSelesai) - new Date(r.waktuMulai)) / 60_000);
        const mapel = r.namaMapel || "Umum";
        mapelCount[mapel] = (mapelCount[mapel] || 0) + 1;
      }
      if (r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.SELESAI.id) {
        kelasHadir++;
        totalMenitKonsul += r.konsulExtraMenit || 0;
      }
    });

    const jadwalWajibBulanIni =
      jadwal?.filter((j) => {
        const tglJadwal = tglJkt(j.tanggal);
        return (
          bulanTahunJkt(j.tanggal) === bulanIniStr &&
          tglJadwal <= tglSekarangStr &&
          j.kelasTarget === siswa.kelas
        );
      }).length || 0;

    const persenHadir =
      jadwalWajibBulanIni > 0
        ? Math.round((kelasHadir / jadwalWajibBulanIni) * 100)
        : 100;

    const jamKonsul  = Math.floor(totalMenitKonsul / 60);
    const menitSisa  = totalMenitKonsul % 60;

    const mapelTerambis =
      Object.keys(mapelCount).length > 0
        ? Object.keys(mapelCount).reduce((a, b) =>
            mapelCount[a] > mapelCount[b] ? a : b
          )
        : "-";

    const gelarMatch = GAMIFIKASI.GELAR_KLASEMEN.find(
      (g) => jamKonsul >= g.minJam
    );

    return {
      jamKonsul,
      menitSisa,
      persenHadir,
      kelasHadir,
      jadwalWajibBulanIni,
      mapelTerambis,
      gelar:            gelarMatch ? gelarMatch.gelar : "🐢 Masih Pemanasan",
      selisihHariUTBK:  Math.max(
        0,
        Math.ceil((new Date(EVENT_PENTING.TANGGAL_UTBK) - sekarang) / 86_400_000)
      ),
    };
  }, [riwayat, jadwal, siswa.kelas]);

  // 3. TARGET MISI BULANAN — dinamis berdasarkan pencapaian saat ini
  const targetKonsul =
    statsBulanIni.jamKonsul >= 30 ? 50 :
    statsBulanIni.jamKonsul >= 20 ? 30 :
    statsBulanIni.jamKonsul >= 10 ? 20 :
    statsBulanIni.jamKonsul >= 5  ? 10 : 5;

  const persenMisiKonsul =
    (Math.min(statsBulanIni.jamKonsul, targetKonsul) / targetKonsul) * 100;

  const targetStreak =
    streakKonsul >= 14 ? 30 :
    streakKonsul >= 7  ? 14 :
    streakKonsul >= 3  ? 7  : 3;

  const persenMisiStreak =
    (Math.min(streakKonsul, targetStreak) / targetStreak) * 100;

  return {
    streakKonsul,
    statsBulanIni,
    misiBulanan: { targetKonsul, persenMisiKonsul, targetStreak, persenMisiStreak },
  };
}