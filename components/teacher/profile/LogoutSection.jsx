"use client";

import { memo, useState } from "react";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import profileStyles from "@/components/teacher/profile/Profile.module.css";
import ModalLogout from "@/components/ui/ModalLogout";

const LogoutSection = memo(({ handleLogout }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={profileStyles.logoutWrapper}>
      <button onClick={() => setShowModal(true)} className={styles.logoutButton}>
        <FaArrowRightFromBracket size={20} /> LOG OUT
      </button>

      <ModalLogout
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
});

LogoutSection.displayName = "LogoutSection";
export default LogoutSection;