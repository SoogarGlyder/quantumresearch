"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";

import HeaderPengajar from "./HeaderPengajar";
import AgendaHariIni  from "./AgendaHariIni";
import JadwalMendatang from "./JadwalMendatang";
import ModalJurnal from "@/components/teacher/journal/ModalJurnal";
import WidgetRadarCBT from "./WidgetRadarCBT";

export default function TabBerandaPengajar({
  dataUser,
  jadwal = [],
  absensi = [],
  absenAktif,
  statsKonsul,
}) {
  const hariIniString = timeHelper.getTglJakarta();
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  const jadwalHariIni = useMemo(
    () =>
      jadwal
        .filter((j) => timeHelper.getTglJakarta(j.tanggal) === hariIniString && !j.bab)
        .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
    [jadwal, hariIniString]
  );

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

  const statsPengajar = useMemo(
    () => ({
      totalKelas:      jadwal.length,
      jurnalSelesai:   jadwal.filter((j) => j?.bab).length,
      totalAbsensi:    absensi.length,
      totalMenitKonsul: statsKonsul?.totalMenit ?? 0,
      totalSesiKonsul:  statsKonsul?.totalSesi  ?? 0,
    }),
    [jadwal, absensi, statsKonsul]
  );

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      <WidgetRadarCBT jadwalHariIni={jadwalHariIni} />
      <AgendaHariIni  jadwalHariIni={jadwalHariIni} onPilihJadwal={setJadwalTerpilih} />
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