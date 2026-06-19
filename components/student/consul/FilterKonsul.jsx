"use client";

import { memo } from "react";
import consulStyles from "@/components/student/consul/Consul.module.css";

/**
 * FilterKonsul — Filter riwayat sesi konsul siswa.
 * Menampilkan ringkasan total durasi dan sesi berdasarkan filter aktif.
 */
const FilterKonsul = memo(({
  filterBulan,    setFilterBulan,    opsiBulan    = [],
  filterMapel,    setFilterMapel,    opsiMapel    = [],
  filterPengajar, setFilterPengajar, opsiPengajar = [],
  ringkasanFilter,
}) => (
  // ✅ FIX: import dari Consul.module.css — bukan App.module.css
  <div className={consulStyles.filterContainer} style={{ padding: "16px" }}>

    <div className={`${consulStyles.containerDropdownFilter} ${consulStyles.dropdownRow}`}>
      <select
        value={filterBulan}
        onChange={(e) => setFilterBulan(e.target.value)}
        className={`${consulStyles.filterOption} ${consulStyles.filterOptionFlex}`}
        aria-label="Filter bulan"
      >
        <option value="">Semua Bulan</option>
        {opsiBulan.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>

      <select
        value={filterMapel}
        onChange={(e) => setFilterMapel(e.target.value)}
        className={`${consulStyles.filterOption} ${consulStyles.filterOptionFlex}`}
        aria-label="Filter mata pelajaran"
      >
        <option value="">Semua Mapel</option>
        {opsiMapel.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>

    <div className={`${consulStyles.containerDropdownFilter} ${consulStyles.dropdownRowSpacer}`}>
      <select
        value={filterPengajar}
        onChange={(e) => setFilterPengajar(e.target.value)}
        className={`${consulStyles.filterOption} ${consulStyles.filterOptionFlex}`}
        aria-label="Filter pengajar pendamping"
      >
        <option value="">Semua Pengajar</option>
        <option value="MANDIRI">Belajar Mandiri</option>
        {opsiPengajar.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
    </div>

    {ringkasanFilter && (
      <div className={consulStyles.ringkasanWrapper}>
        <div>
          <p className={consulStyles.ringkasanLabel}>Total Waktu Konsul</p>
          <h3 className={consulStyles.ringkasanNilai}>
            {ringkasanFilter.jam > 0 ? `${ringkasanFilter.jam} Jam ` : ""}
            {ringkasanFilter.menit} Menit
          </h3>
        </div>
        <div className={consulStyles.ringkasanBadge}>
          {ringkasanFilter.totalSesiSelesai} Sesi
        </div>
      </div>
    )}
  </div>
));

FilterKonsul.displayName = "FilterKonsul";
export default FilterKonsul;