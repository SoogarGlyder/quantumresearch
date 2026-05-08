"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

// PATH ABSOLUTE
import { prosesLogout } from "@/actions/authAction";
import { KONFIGURASI_SISTEM } from "@/utils/constants";
import styles from "@/components/App.module.css";

// IMPORT TETANGGA
import HeaderProfil from "./HeaderProfil";
import ProfilCard from "./ProfilCard";
import LogoutSection from "./LogoutSection";

export default function TabProfilPengajar({ dataUser }) {
  const router = useRouter();

  //FIX: Hapus "confirm()" bawaan browser. 
  // Biarkan modal kustom Brutalist kita yang menjadi penjaga gerbangnya.
  const handleLogout = useCallback(async () => {
    await prosesLogout();
    router.push(KONFIGURASI_SISTEM.PATH_LOGIN);
  }, [router]);

  return (
    <div className={styles.contentArea}>
      <HeaderProfil />

      <div className={styles.contentContainer}>
        {dataUser && <ProfilCard dataUser={dataUser} />}
        <LogoutSection handleLogout={handleLogout} />
      </div>
    </div>
  );
}