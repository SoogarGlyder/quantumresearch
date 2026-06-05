"use client";

import { memo } from "react";
import journalStyles from "@/components/teacher/journal/Journal.module.css";

const FilterKonsulGuru = memo(({
  filterBulan,  setFilterBulan,  opsiBulan  = [],
  filterMapel,  setFilterMapel,  opsiMapel  = [],
  filterKelas,  setFilterKelas,  opsiKelas  = [],
  ringkasanFilter,
}) => (
  <div className={journalStyles.filterContainer}>

    <div className={`${journalStyles.containerDropdownFilter} ${journalStyles.filterDropdownRow}`}>
      <select
        value={filterBulan}
        onChange={(e) => setFilterBulan(e.target.value)}
        className={journalStyles.filterOption}
        aria-label="Filter bulan"
      >
        <option value="">Semua Bulan</option>
        {opsiBulan.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>

      <select
        value={filterMapel}
        onChange={(e) => setFilterMapel(e.target.value)}
        className={journalStyles.filterOption}
        aria-label="Filter mata pelajaran"
      >
        <option value="">Semua Mapel</option>
        {opsiMapel.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>

    <div className={`${journalStyles.containerDropdownFilter} ${journalStyles.filterDropdownRow} ${journalStyles.filterDropdownRowSpacer}`}>
      <select
        value={filterKelas}
        onChange={(e) => setFilterKelas(e.target.value)}
        className={journalStyles.filterOption}
        aria-label="Filter kelas"
      >
        <option value="">Semua Kelas</option>
        {opsiKelas.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>

    {ringkasanFilter && (
      <div className={journalStyles.ringkasanKonsul}>
        <div>
          <p className={journalStyles.ringkasanLabel}>Total Durasi Bimbingan</p>
          <h3 className={journalStyles.ringkasanNilai}>
            {ringkasanFilter.jam > 0 ? `${ringkasanFilter.jam} Jam ` : ""}
            {ringkasanFilter.menit} Menit
          </h3>
        </div>
        <div className={journalStyles.ringkasanBadge}>
          {ringkasanFilter.totalSesiSelesai} Sesi
        </div>
      </div>
    )}
  </div>
));

FilterKonsulGuru.displayName = "FilterKonsulGuru";
export default FilterKonsulGuru;