"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { FaChevronDown, FaChevronUp, FaSkullCrossbones } from "react-icons/fa6";
import { getRiwayatKonsulPengajar } from "@/actions/teacherAction";
import PaginationBar from "@/components/ui/PaginationBar";
import { formatHelper } from "@/utils/formatHelper";
import { timeHelper } from "@/utils/timeHelper";
import { STATUS_SESI, PERIODE_BELAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";
import journalStyles from "@/components/teacher/journal/Journal.module.css";
import FilterKonsulGuru from "./FilterKonsulGuru";

const ITEMS_PER_PAGE = 10;

// ============================================================================
// SUB-KOMPONEN: KARTU SESI KONSUL
// ============================================================================
const RecordCardGuru = memo(({ sesi, isOpen, onToggle }) => {
  const isSelesai  = sesi.status === STATUS_SESI.SELESAI.id;
  const isPinalti  = sesi.status === STATUS_SESI.PINALTI?.id;
  const isBerjalan = sesi.status === STATUS_SESI.BERJALAN.id;

  const namaSiswa  = sesi.siswaId?.nama  || "Siswa Terhapus";
  const kelasSiswa = sesi.siswaId?.kelas || "-";

  const labelTanggal = sesi.waktuMulai
    ? timeHelper.formatTanggalLengkap(sesi.waktuMulai)
    : "-";

  const detailRowSelesaiClass = isSelesai
    ? journalStyles.recordDetailRowSelesai
    : isPinalti
    ? journalStyles.recordDetailRowPinalti
    : journalStyles.recordDetailRowBerjalan;

  return (
    <div
      className={`${journalStyles.recordCard} ${journalStyles.recordCardClickable}`}
      onClick={() => onToggle(sesi._id)}
    >
      <div className={journalStyles.recordCardRow}>
        <p className={journalStyles.recordDate}>{labelTanggal}</p>

        {isPinalti ? (
          <span className={`${journalStyles.recordDuration} ${journalStyles.badgePinalti}`}>
            <FaSkullCrossbones /> PINALTI
          </span>
        ) : !isSelesai ? (
          <span className={`${journalStyles.recordDuration} ${journalStyles.badgeBerjalan}`}>
            {isBerjalan
              ? "Sedang Berjalan"
              : sesi.status.charAt(0).toUpperCase() + sesi.status.slice(1)}
          </span>
        ) : null}

        {isSelesai && (
          <span className={journalStyles.recordDuration}>
            {timeHelper.hitungDurasiMenit(sesi.waktuMulai, sesi.waktuSelesai)} menit
          </span>
        )}
      </div>

      <div className={journalStyles.recordCardRow}>
        <div>
          <h3 className={`${journalStyles.recordTitle} ${journalStyles.recordNamaBesar}`}>
            {namaSiswa}
          </h3>
          <h3 className={`${journalStyles.recordTitle} ${journalStyles.recordKelasKecil}`}>
            {kelasSiswa}
          </h3>
        </div>
        <div className={journalStyles.chevronIcon}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className={journalStyles.recordDetail}>
          <div className={`${journalStyles.recordDetailRow} ${journalStyles.recordDetailRowBiru}`}>
            <span>Mapel Konsul</span>
            <span style={{ fontWeight: 900, color: "#2563eb" }}>
              {sesi.namaMapel || "Umum"}
            </span>
          </div>

          <div className={`${journalStyles.recordDetailRow} ${journalStyles.recordDetailRowMulai}`}>
            <span>Mulai</span>
            <span>{timeHelper.formatJam(sesi.waktuMulai)} WIB</span>
          </div>

          <div className={`${journalStyles.recordDetailRow} ${detailRowSelesaiClass}`}>
            <span>Selesai</span>
            <span>
              {isSelesai || isPinalti
                ? `${timeHelper.formatJam(sesi.waktuSelesai)} WIB`
                : "Sedang Berjalan..."}
            </span>
          </div>

          {isPinalti && (
            <div className={journalStyles.notaPinalti}>
              Sesi dihentikan karena siswa lupa Scan Out! (0 Menit)
            </div>
          )}
        </div>
      )}
    </div>
  );
});

RecordCardGuru.displayName = "RecordCardGuru";

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
export default function DaftarKonsul({ dataUser, setTotalKonsul }) {
  const [dataKonsul,  setDataKonsul]  = useState([]);
  const [filterBulan, setFilterBulan] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [page,        setPage]        = useState(1);
  const [idTerbuka,   setIdTerbuka]   = useState(null);

  useEffect(() => { setPage(1); }, [filterBulan, filterMapel, filterKelas]);

  useEffect(() => {
    let isMounted = true;
    const fetchKonsul = async () => {
      const res = await getRiwayatKonsulPengajar();
      if (isMounted && res.ok) {
        const list = res.data || [];
        setDataKonsul(list);
        if (setTotalKonsul) setTotalKonsul(list.length);
      }
    };
    fetchKonsul();
    return () => { isMounted = false; };
  }, [setTotalKonsul]);

  const dapatkanLabelBulan = (tanggalStr) => {
    if (!tanggalStr) return "-";
    return new Date(tanggalStr).toLocaleDateString("id-ID", {
      timeZone: PERIODE_BELAJAR.TIMEZONE,
      month: "long",
      year: "numeric",
    });
  };

  const opsiBulan = useMemo(
    () => [...new Set(dataKonsul.map((r) => dapatkanLabelBulan(r.waktuMulai)))],
    [dataKonsul]
  );
  const opsiMapel = useMemo(
    () => [...new Set(dataKonsul.map((r) => (r.namaMapel || "Umum").replace(" (Extra)", "")))].sort(),
    [dataKonsul]
  );
  const opsiKelas = useMemo(
    () => [...new Set(dataKonsul.map((r) => r.siswaId?.kelas || "-"))].sort(),
    [dataKonsul]
  );

  const konsulDitampilkan = useMemo(
    () =>
      dataKonsul.filter((k) => {
        const matchBulan = filterBulan ? dapatkanLabelBulan(k.waktuMulai) === filterBulan : true;
        const mapelMurni = (k.namaMapel || "Umum").replace(" (Extra)", "");
        const matchMapel = filterMapel ? mapelMurni === filterMapel : true;
        const matchKelas = filterKelas ? (k.siswaId?.kelas || "-") === filterKelas : true;
        return matchBulan && matchMapel && matchKelas;
      }),
    [dataKonsul, filterBulan, filterMapel, filterKelas]
  );

  const ringkasanFilter = useMemo(() => {
    let totalMenit = 0;
    let totalSesiSelesai = 0;
    konsulDitampilkan.forEach((sesi) => {
      if (sesi.status === STATUS_SESI.SELESAI.id && sesi.waktuMulai && sesi.waktuSelesai) {
        const durasi = Math.max(
          0,
          Math.round((new Date(sesi.waktuSelesai) - new Date(sesi.waktuMulai)) / 60_000)
        );
        totalMenit += durasi;
        totalSesiSelesai++;
      }
    });
    return {
      totalMenit,
      jam:  Math.floor(totalMenit / 60),
      menit: totalMenit % 60,
      totalSesiSelesai,
    };
  }, [konsulDitampilkan]);

  const { totalPage, dataTerpotong: dataHalIni } = formatHelper.potongDataPagination(
    konsulDitampilkan, page, ITEMS_PER_PAGE
  );

  const toggleDetail = (id) => setIdTerbuka((prev) => (prev === id ? null : id));

  return (
    <>
      <FilterKonsulGuru
        filterBulan={filterBulan} setFilterBulan={setFilterBulan} opsiBulan={opsiBulan}
        filterMapel={filterMapel} setFilterMapel={setFilterMapel} opsiMapel={opsiMapel}
        filterKelas={filterKelas} setFilterKelas={setFilterKelas} opsiKelas={opsiKelas}
        ringkasanFilter={ringkasanFilter}
      />

      <div className={styles.contentContainer}>
        {dataHalIni.length === 0 ? (
          <div className={`${styles.emptySchedule} ${journalStyles.emptyJurnal}`}>
            <p className={journalStyles.emptyJurnalIkon}>☕</p>
            <p className={journalStyles.emptyJurnalJudul}>BELUM ADA RIWAYAT KONSUL.</p>
            <p className={journalStyles.emptyJurnalSub}>
              Siswa yang memilih Anda sebagai pendamping konsul akan muncul di sini.
            </p>
          </div>
        ) : (
          <>
            <div className={journalStyles.containerRecord}>
              {dataHalIni.map((sesi) => (
                <RecordCardGuru
                  key={sesi._id}
                  sesi={sesi}
                  isOpen={idTerbuka === sesi._id}
                  onToggle={toggleDetail}
                />
              ))}
            </div>

            <div className={journalStyles.paginasiWrapper}>
              <PaginationBar
                currentPage={page}
                totalPages={totalPage}
                onPageChange={setPage}
                className={journalStyles.paginasiInner}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}