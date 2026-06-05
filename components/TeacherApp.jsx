"use client";

import { useState, useMemo } from "react";
import styles from "@/components/App.module.css";
import TeacherBottomNav from "@/components/teacher/TeacherBottomNav";
import {
  TabBerandaPengajar,
  TabJurnalKelas,
  TabScanPengajar,
  TabTugasPengajar,
  TabProfilPengajar,
} from "@/components/teacher";

/**
 * @param {{
 *   dataUser:    object,
 *   jadwal:      object[],
 *   absensi:     object[],
 *   statsKonsul: object,
 * }} props
 */
export default function TeacherApp({ dataUser, jadwal, absensi, statsKonsul }) {
  const [tab, setTab] = useState("home");

  const absenAktif = useMemo(() => {
    if (!Array.isArray(absensi)) return null;
    return absensi.find((a) => a.waktuMasuk && !a.waktuKeluar) ?? null;
  }, [absensi]);

  const kontenTab = useMemo(() => {
    switch (tab) {
      case "home":
        return (
          <TabBerandaPengajar
            dataUser={dataUser}
            jadwal={jadwal}
            absensi={absensi}
            absenAktif={absenAktif}
            statsKonsul={statsKonsul}
          />
        );
      case "jurnal":
        return <TabJurnalKelas dataUser={dataUser} jadwal={jadwal} />;
      case "scan":
        return <TabScanPengajar absenAktif={absenAktif} absensi={absensi} />;
      case "tugas":
        return <TabTugasPengajar pengajarId={dataUser?._id} />;
      case "profil":
        return <TabProfilPengajar dataUser={dataUser} />;
      default:
        return null;
    }
  }, [tab, dataUser, jadwal, absensi, absenAktif, statsKonsul]);

  return (
    <div className={styles.mainContainer}>
      <main>{kontenTab}</main>
      <TeacherBottomNav tab={tab} setTab={setTab} />
    </div>
  );
}