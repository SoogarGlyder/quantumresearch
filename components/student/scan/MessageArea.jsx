"use client";

import { memo } from "react";
import scanStyles from "@/components/student/scan/Scan.module.css";

const MessageArea = memo(({ sedangLoading, pesanSistem, apakahError, resetScanner }) => {
  const isMsgError =
    apakahError ||
    pesanSistem?.includes("⚠️") ||
    pesanSistem?.toLowerCase().includes("gagal") ||
    pesanSistem?.toLowerCase().includes("salah");

  return (
    // ✅ FIX: import dari Scan.module.css — bukan App.module.css
    <div className={scanStyles.containerMessage}>
      {sedangLoading ? (
        <div className={`${scanStyles.messageBox} ${scanStyles.messageLoading}`}>
          <p className={`${scanStyles.messageText} ${scanStyles.messageProcess}`}>
            Memproses data...
          </p>
        </div>
      ) : (
        pesanSistem && (
          <div className={`${scanStyles.messageBox} ${isMsgError ? scanStyles.messageFail : scanStyles.messageSuccess}`}>
            <p className={scanStyles.messageText}>{pesanSistem}</p>
            <button onClick={resetScanner} className={scanStyles.repeatButton}>
              🔄 Scan Ulang
            </button>
          </div>
        )
      )}
    </div>
  );
});

MessageArea.displayName = "MessageArea";
export default MessageArea;