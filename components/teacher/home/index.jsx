"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";

import HeaderPengajar from "./HeaderPengajar";
import AgendaHariIni  from "./AgendaHariIni";
import JadwalMendatang from "./JadwalMendatang";
import ModalJurnal from "@/components/teacher/journal/ModalJurnal";
import WidgetRadarCBT from "./WidgetRadarCBT";

const WARNA_CHART = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ef4444', '#ec4899', '#14b8a6', '#facc15'
];

export default function TabBerandaPengajar({
  dataUser,
  jadwal = [],
  absensi = [],
  absenAktif,
  statsKonsul,
  riwayatKonsul = [],
}) {
  const hariIniString = timeHelper.getTglJakarta();
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // --------------------------------------------------------------------------
  // FILTERING: Jadwal Hari Ini
  // --------------------------------------------------------------------------
  const jadwalHariIni = useMemo(
    () =>
      jadwal
        .filter((j) => timeHelper.getTglJakarta(j.tanggal) === hariIniString && !j.bab)
        .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
    [jadwal, hariIniString]
  );

  // --------------------------------------------------------------------------
  // FILTERING: Jadwal Mendatang
  // --------------------------------------------------------------------------
  const jadwalMendatang = useMemo(
    () =>
      jadwal
        .filter((j) => timeHelper.getTglJakarta(j.tanggal) > hariIniString && !j.bab)
        .sort((a, b) => {
          const tglA = timeHelper.getTglJakarta(a.tanggal);
          const tglB = timeHelper.getTglJakarta(b.tanggal);
          return tglA !== tglB
            ? tglA.localeCompare(tglB)
            : a.jamMulai.localeCompare(b.jamMulai);
        }),
    [jadwal, hariIniString]
  );

  // --------------------------------------------------------------------------
  // KALKULASI: Statistik Ringkasan & Data Grafik Slider
  // --------------------------------------------------------------------------
  const statsPengajar = useMemo(() => {
    // 1. Kalkulasi Distribusi KELAS REGULER
    const mapelMap = {};
    const kelasMap = {};

    jadwal.forEach((j) => {
      const m = j.mapel || "Umum";
      mapelMap[m] = (mapelMap[m] || 0) + 1;

      const k = j.kelasTarget || "Lainnya";
      kelasMap[k] = (kelasMap[k] || 0) + 1;
    });

    const chartMapel = Object.entries(mapelMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label, value, color: WARNA_CHART[i % WARNA_CHART.length],
      }));

    const chartKelas = Object.entries(kelasMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label, value, color: WARNA_CHART[(i + 3) % WARNA_CHART.length],
      }));

    // 2. Kalkulasi Distribusi KONSULTASI
    const mapelKonsulMap = {};
    const kelasKonsulMap = {};

    riwayatKonsul.forEach((k) => {
      // Mendukung key "mapel" atau "namaMapel" dari DB
      const m = k.mapel || k.namaMapel || "Umum";
      mapelKonsulMap[m] = (mapelKonsulMap[m] || 0) + 1;

      // Mendukung key string "kelas" atau referensi "siswaId.kelas" dari DB
      const c = k.kelasTarget || k.kelas || k.siswaId?.kelas || "Lainnya";
      kelasKonsulMap[c] = (kelasKonsulMap[c] || 0) + 1;
    });

    const chartMapelKonsul = Object.entries(mapelKonsulMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label, value, color: WARNA_CHART[(i + 2) % WARNA_CHART.length],
      }));

    const chartKelasKonsul = Object.entries(kelasKonsulMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label, value, color: WARNA_CHART[(i + 5) % WARNA_CHART.length],
      }));

    // 3. Kembalikan paket data lengkap ke HeaderPengajar
    return {
      totalKelas:       jadwal.length,
      jurnalSelesai:    jadwal.filter((j) => j?.bab).length,
      totalAbsensi:     absensi.length,
      totalMenitKonsul: statsKonsul?.totalMenit ?? 0,
      totalSesiKonsul:  statsKonsul?.totalSesi  ?? 0,
      chartMapel,
      chartKelas,
      chartMapelKonsul, // 👈 Data baru
      chartKelasKonsul, // 👈 Data baru
    };
  }, [jadwal, absensi, statsKonsul, riwayatKonsul]);

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      <WidgetRadarCBT jadwalHariIni={jadwalHariIni} />
      <AgendaHariIni   jadwalHariIni={jadwalHariIni}     onPilihJadwal={setJadwalTerpilih} />
      <JadwalMendatang jadwalMendatang={jadwalMendatang} onPilihJadwal={setJadwalTerpilih} />

      {jadwalTerpilih && (
        <ModalJurnal
          jadwalTerpilih={jadwalTerpilih}
          hariIni={hariIniString}
          onClose={() => setJadwalTerpilih(null)}
        />
      )}
    </div>
  );
}