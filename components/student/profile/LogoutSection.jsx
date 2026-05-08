"use client";

import { memo, useState } from "react";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import ModalLogout from "@/components/ui/ModalLogout";

const LogoutSection = memo(({ klikLogout }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ margin: '0 16px', padding: '0' }}>
      <button onClick={() => setShowModal(true)} className={styles.logoutButton}>
        <FaArrowRightFromBracket size={20} /> LOG OUT
      </button>

      {/*FIX: Pasang Modal */}
      <ModalLogout 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onConfirm={klikLogout} 
      />
    </div>
  );
});

LogoutSection.displayName = "LogoutSection";
export default LogoutSection;