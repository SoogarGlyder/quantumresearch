"use client";

import { memo } from "react";
import scanStyles from "@/components/teacher/scan/Scan.module.css";

const InstruksiArea = memo(({ isSudahMasuk }) => (
  <div className={scanStyles.tabScanContainer}>
    <div
      className={`${scanStyles.scheduleOption} ${isSudahMasuk ? scanStyles.instruksiKeluar : scanStyles.instruksiMasuk}`}
    >
      <span className={isSudahMasuk ? scanStyles.instruksiTeksKeluar : scanStyles.instruksiTeksMasuk}>
        {isSudahMasuk ? "🛑 SCAN UNTUK CLOCK-OUT" : "🟢 SCAN UNTUK CLOCK-IN"}
      </span>
    </div>
  </div>
));

InstruksiArea.displayName = "InstruksiArea";
export default InstruksiArea;