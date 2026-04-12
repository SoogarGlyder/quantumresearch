"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

// 🚀 PATH ABSOLUTE
import { prosesLogout } from "@/actions/authAction";
import { KONFIGURASI_SISTEM } from "@/utils/constants";
import styles from "@/components/App.module.css";

// 🚀 IMPORT TETANGGA
import HeaderProfil from "./HeaderProfil";
import ProfilCard from "./ProfilCard";
import LogoutSection from "./LogoutSection";

export default function TabProfilPengajar({ dataUser }) {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
    if (konfirmasi) {
      await prosesLogout();
      router.push(KONFIGURASI_SISTEM.PATH_LOGIN);
    }
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