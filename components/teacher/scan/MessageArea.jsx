"use client";

import { memo } from "react";
import { FaClockRotateLeft } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const MessageArea = memo(({ sedangLoading, pesanSistem, apakahError, resetScanner }) => {
  const isMsgError = apakahError || pesanSistem?.includes("⚠️") || pesanSistem?.toLowerCase().includes("ups");

  return (
    <div className={styles.containerMessage}>
      {sedangLoading ? (
        <div className={`${styles.messageBox} ${styles.messageLoading}`}>
          <p className={`${styles.messageText} ${styles.messageProcess}`}>Memproses data...</p>
        </div>
      ) : (
        pesanSistem && (
           <div className={`${styles.messageBox} ${isMsgError ? styles.messageFail : styles.messageSuccess}`}>
            <p className={styles.messageText}>{pesanSistem}</p>
            <button onClick={resetScanner} className={styles.repeatButton}>
              <FaClockRotateLeft /> Scan Ulang
            </button>
          </div>
        )
      )}
    </div>
  );
});

MessageArea.displayName = "MessageArea";
export default MessageArea;