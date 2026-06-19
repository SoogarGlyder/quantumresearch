"use client";

import { useState, useMemo, useEffect } from "react";
import { FaBoxOpen } from "react-icons/fa6";
import PaginationBar from "@/components/ui/PaginationBar";
import { formatHelper } from "@/utils/formatHelper";
import { TIPE_SESI, STATUS_SESI, PERIODE_BELAJAR, LIMIT_DATA } from "@/utils/constants";
import styles from "@/components/App.module.css";
import consulStyles from "@/components/student/consul/Consul.module.css";

import HeaderKonsul from "./HeaderKonsul";
import FilterKonsul from "./FilterKonsul";
import RecordCard   from "./RecordCard";

export default function TabKonsulSiswa({ riwayat = [] }) {
  const [page,           setPage]           = useState(1);
  const [filterBulan,    setFilterBulan]    = useState("");
  const [filterMapel,    setFilterMapel]    = useState("");
  const [filterPengajar, setFilterPengajar] = useState("");
  const [idTerbuka,      setIdTerbuka]      = useState(null);

  const ITEMS_PER_PAGE = LIMIT_DATA?.PAGINATION_KONSUL || 10;

  // Reset halaman saat filter berubah
  useEffect(() => { setPage(1); }, [filterBulan, filterMapel, filterPengajar]);

  // Label bulan untuk grouping — timezone Jakarta
  const dapatkanLabelBulan = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString("id-ID", {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      month:    "long",
      year:     "numeric",
    });
  };

  const toggleDetail = (id) => setIdTerbuka((prev) => (prev === id ? null : id));

  // Gabungkan konsul murni + konsul extra dari sesi kelas
  const riwayatKonsul = useMemo(() => {
    const konsulMurni = riwayat.filter((r) => r.jenisSesi === TIPE_SESI.KONSUL);

    const konsulExtra = riwayat
      .filter((r) => r.jenisSesi === TIPE_SESI.KELAS && r.konsulExtraMenit > 0 && r.waktuSelesai)
      .map((r) => {
        const waktuSelesaiObj = new Date(r.waktuSelesai);
        const waktuMulaiObj   = new Date(waktuSelesaiObj.getTime() - r.konsulExtraMenit * 60_000);
        return {
          ...r,
          _id:        `${r._id}_extra`,
          jenisSesi:  TIPE_SESI.KONSUL,
          namaMapel:  `${r.namaMapel || "Umum"} (Extra)`,
          waktuMulai: waktuMulaiObj.toISOString(),
          waktuSelesai: r.waktuSelesai,
        };
      });

    return [...konsulMurni, ...konsulExtra].sort(
      (a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai)
    );
  }, [riwayat]);

  const opsiBulan = useMemo(
    () => [...new Set(riwayatKonsul.map((r) => dapatkanLabelBulan(r.waktuMulai)))],
    [riwayatKonsul]
  );

  const opsiMapel = useMemo(
    () =>
      [...new Set(riwayatKonsul.map((r) => (r.namaMapel || "Umum").replace(" (Extra)", "")))].sort(),
    [riwayatKonsul]
  );

  const opsiPengajar = useMemo(
    () =>
      [
        ...new Set(
          riwayatKonsul
            .map((r) =>
              r.pengajarPendamping && typeof r.pengajarPendamping === "object"
                ? r.pengajarPendamping.nama
                : null
            )
            .filter(Boolean)
        ),
      ].sort(),
    [riwayatKonsul]
  );

  const konsulDitampilkan = useMemo(
    () =>
      riwayatKonsul.filter((r) => {
        const matchBulan = filterBulan ? dapatkanLabelBulan(r.waktuMulai) === filterBulan : true;
        const mapelMurni = (r.namaMapel || "Umum").replace(" (Extra)", "");
        const matchMapel = filterMapel ? mapelMurni === filterMapel : true;

        let matchPengajar = true;
        if (filterPengajar) {
          if (filterPengajar === "MANDIRI") {
            matchPengajar = !r.pengajarPendamping;
          } else {
            const namaGuru =
              typeof r.pengajarPendamping === "object" ? r.pengajarPendamping?.nama : null;
            matchPengajar = namaGuru === filterPengajar;
          }
        }
        return matchBulan && matchMapel && matchPengajar;
      }),
    [riwayatKonsul, filterBulan, filterMapel, filterPengajar]
  );

  const ringkasanFilter = useMemo(() => {
    let totalMenit = 0;
    let totalSesiSelesai = 0;
    konsulDitampilkan.forEach((sesi) => {
      if (sesi.status === STATUS_SESI.SELESAI.id && sesi.waktuMulai && sesi.waktuSelesai) {
        totalMenit += Math.max(
          0,
          Math.round((new Date(sesi.waktuSelesai) - new Date(sesi.waktuMulai)) / 60_000)
        );
        totalSesiSelesai++;
      }
    });
    return {
      totalMenit,
      jam:   Math.floor(totalMenit / 60),
      menit: totalMenit % 60,
      totalSesiSelesai,
    };
  }, [konsulDitampilkan]);

  const { totalPage, dataTerpotong: dataHalIni } = formatHelper.potongDataPagination(
    konsulDitampilkan, page, ITEMS_PER_PAGE
  );

  return (
    <div className={styles.contentArea}>
      <HeaderKonsul />

      <FilterKonsul
        filterBulan={filterBulan}       setFilterBulan={setFilterBulan}       opsiBulan={opsiBulan}
        filterMapel={filterMapel}       setFilterMapel={setFilterMapel}       opsiMapel={opsiMapel}
        filterPengajar={filterPengajar} setFilterPengajar={setFilterPengajar} opsiPengajar={opsiPengajar}
        ringkasanFilter={ringkasanFilter}
      />

      {/* ✅ FIX: import dari Consul.module.css — bukan App.module.css */}
      <div className={consulStyles.containerRecord}>
        {dataHalIni.length === 0 ? (
          <div className={consulStyles.wadahKosong}>
            <FaBoxOpen className={consulStyles.emptyIcon} />
            <p className={consulStyles.emptyText}>Belum ada record konsul.</p>
          </div>
        ) : (
          dataHalIni.map((sesi) => (
            <RecordCard
              key={sesi._id}
              sesi={sesi}
              isOpen={idTerbuka === sesi._id}
              onToggle={toggleDetail}
            />
          ))
        )}

        <div className={consulStyles.paginasiWrapper}>
          <PaginationBar
            totalPages={totalPage}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}