"use client";

import { useState, useMemo } from "react";
import styles from "@/components/App.module.css";
import TeacherBottomNav from "@/components/teacher/TeacherBottomNav";

import { 
  TabBerandaPengajar, 
  TabJurnalKelas, 
  TabScanPengajar, 
  TabTugasPengajar, 
  TabProfilPengajar 
} from "@/components/teacher";

export default function TeacherApp({ dataUser, jadwal, absensi, onLogout }) { 
  const [tab, setTab] = useState("home");
  
  const absenAktif = useMemo(() => {
    if (!absensi || !Array.isArray(absensi)) return null;
    return absensi.find(a => a.waktuMasuk && !a.waktuKeluar);
  }, [absensi]);

  const kontenTab = useMemo(() => {
    switch (tab) {
      case "home":
        return <TabBerandaPengajar dataUser={dataUser} jadwal={jadwal} absensi={absensi} absenAktif={absenAktif} />;
      case "jurnal":
        return <TabJurnalKelas dataUser={dataUser} jadwal={jadwal} />;
      case "scan":
        return <TabScanPengajar absenAktif={absenAktif} absensi={absensi} />;
      case "tugas":
        return <TabTugasPengajar />;
      case "profil":
        return <TabProfilPengajar dataUser={dataUser} onLogout={onLogout} />;
      default:
        return null;
    }
  }, [tab, dataUser, jadwal, absensi, onLogout, absenAktif]);

  return (
    <div className={styles.mainContainer}> 
      <main>
        {kontenTab}
      </main>
      <TeacherBottomNav tab={tab} setTab={setTab} />
    </div>
  );
}