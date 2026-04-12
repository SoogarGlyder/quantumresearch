"use client";

import { memo } from "react";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const LogoutSection = memo(({ klikLogout }) => (
  <div style={{ margin: '0 16px', padding: '0' }}>
    <button onClick={klikLogout} className={styles.logoutButton}>
      <FaArrowRightFromBracket size={20} /> LOG OUT
    </button>
  </div>
));

LogoutSection.displayName = "LogoutSection";
export default LogoutSection;