"use client";

import { memo } from "react";
import { FaClockRotateLeft } from "react-icons/fa6";
import scanStyles from "@/components/teacher/scan/Scan.module.css";

const MessageArea = memo(({ sedangLoading, pesanSistem, apakahError, resetScanner }) => {
  const isMsgError =
    apakahError ||
    pesanSistem?.includes("⚠️") ||
    pesanSistem?.toLowerCase().includes("ups");

  return (
    <div className={scanStyles.containerMessage}>
      {sedangLoading ? (
        <div className={`${scanStyles.messageBox} ${scanStyles.messageLoading}`}>
          <p className={`${scanStyles.messageText} ${scanStyles.messageProcess}`}>
            Memproses data...
          </p>
        </div>
      ) : (
        pesanSistem && (
          <div
            className={`${scanStyles.messageBox} ${isMsgError ? scanStyles.messageFail : scanStyles.messageSuccess}`}
          >
            <p className={scanStyles.messageText}>{pesanSistem}</p>
            <button onClick={resetScanner} className={scanStyles.repeatButton}>
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