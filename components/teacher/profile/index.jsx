"use client";

import { useCallback } from "react";
import { prosesLogout } from "@/actions/authAction";
import { KONFIGURASI_SISTEM } from "@/utils/constants";
import styles from "@/components/App.module.css";

import HeaderProfil  from "./HeaderProfil";
import ProfilCard    from "./ProfilCard";
import LogoutSection from "./LogoutSection";

export default function TabProfilPengajar({ dataUser }) {
  const handleLogout = useCallback(async () => {
    await prosesLogout();
    window.location.href = KONFIGURASI_SISTEM.PATH_LOGIN;
  }, []);

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