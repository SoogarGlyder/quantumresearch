"use client";

import { useState, useMemo, useEffect, memo } from "react";
import { FaCalendarCheck, FaCheckDouble, FaCircleExclamation } from "react-icons/fa6";
import { timeHelper } from "@/utils/timeHelper";
import { LIMIT_DATA, PERIODE_BELAJAR } from "@/utils/constants";
import { formatHelper } from "@/utils/formatHelper";
import PaginationBar from "@/components/ui/PaginationBar";
import styles from "@/components/App.module.css";
import journalStyles from "@/components/teacher/journal/Journal.module.css";

import FilterJurnal from "./FilterJurnal";
import ModalJurnal from "./ModalJurnal";

// ============================================================================
// SUB-KOMPONEN: KARTU JADWAL
// ============================================================================
const CardJadwal = memo(({ j, onPilihJadwal }) => {
  const isTerisi = !!j.bab;

  return (
    <div
      className={`${styles.scheduleCard} ${isTerisi ? journalStyles.cardJadwalTerisi : journalStyles.cardJadwalKosong}`}
      onClick={() => onPilihJadwal(j)}
    >
      <div className={styles.scheduleCardRow}>
        <div className={`${styles.scheduleDate} ${isTerisi ? journalStyles.scheduleDateTerisi : journalStyles.scheduleDateKosong}`}>
          {isTerisi ? <FaCheckDouble /> : <FaCircleExclamation />}
          {" "}{timeHelper.formatTanggalLengkap(j.tanggal)}
        </div>
        <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
      </div>

      <div className={styles.scheduleCardRow}>
        <p className={styles.scheduleSubject}>{j.mapel}</p>
      </div>

      <div className={styles.scheduleCardRow}>
        <div className={`${styles.scheduleInfoBox} ${isTerisi ? journalStyles.badgeStatusTerisi : journalStyles.badgeStatusKosong}`}>
          <span className={journalStyles.badgeStatusTeks}>
            {isTerisi ? "JURNAL TERISI" : "BELUM ISI JURNAL"}
          </span>
        </div>
        <div className={styles.scheduleCount}>{j.kelasTarget}</div>
      </div>
    </div>
  );
});
CardJadwal.displayName = "CardJadwal";

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
const ITEMS_PER_PAGE = LIMIT_DATA?.PAGINATION_KELAS || 10;

/**
 * @param {{ jadwal: object[], hariIniString: string }} props
 */
export default function DaftarKelas({ jadwal = [], hariIniString }) {
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [page,           setPage]           = useState(1);

  useEffect(() => { setPage(1); }, [searchQuery]);

  const jadwalDitampilkan = useMemo(() => {
    let arsip = jadwal.filter((j) => {
      const tgl          = timeHelper.getTglJakarta(j.tanggal);
      const masukPeriode = tgl >= PERIODE_BELAJAR.MULAI && tgl <= PERIODE_BELAJAR.AKHIR;
      const sudahLewat   = tgl < hariIniString;
      const hariIniSelesai = tgl === hariIniString && !!j.bab;
      return masukPeriode && (sudahLewat || hariIniSelesai);
    });

    if (searchQuery.trim()) {
      const keywords = searchQuery
        .toLowerCase()
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      arsip = arsip.filter((j) => {
        const statusTeks = j.bab ? "jurnal terisi" : "belum isi jurnal";
        const teksTanggal = timeHelper.formatTanggalLengkap(j.tanggal).toLowerCase();

        return keywords.every(
          (kw) =>
            (j?.mapel?.toLowerCase() || "").includes(kw) ||
            (j?.kelasTarget?.toLowerCase() || "").includes(kw) ||
            statusTeks.includes(kw) ||
            teksTanggal.includes(kw)
        );
      });
    }

    return arsip.sort(
      (a, b) =>
        timeHelper.getTglJakarta(b.tanggal).localeCompare(
          timeHelper.getTglJakarta(a.tanggal)
        )
    );
  }, [jadwal, hariIniString, searchQuery]);

  const { totalPage, dataTerpotong: dataHalIni } = formatHelper.potongDataPagination(
    jadwalDitampilkan,
    page,
    ITEMS_PER_PAGE
  );

  return (
    <>
      <FilterJurnal
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Cari mapel, kelas, tanggal, atau status..."
      />

      <div className={styles.contentContainer}>
        <h3 className={styles.contentTitle}>
          <FaCalendarCheck className={journalStyles.ikonHijau} /> Daftar Riwayat & Revisi
        </h3>

        {dataHalIni.length === 0 ? (
          <div className={`${styles.emptySchedule} ${journalStyles.emptyJurnal}`}>
            <p className={journalStyles.emptyJurnalIkon}>📂</p>
            <p className={journalStyles.emptyJurnalJudul}>BELUM ADA ARSIP JURNAL.</p>
            <p className={journalStyles.emptyJurnalSub}>
              Selesaikan kelas di Beranda untuk memindahkannya ke sini.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.scheduleList}>
              {dataHalIni.map((j) => (
                <CardJadwal key={j._id} j={j} onPilihJadwal={setJadwalTerpilih} />
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

      {jadwalTerpilih && (
        <ModalJurnal
          jadwalTerpilih={jadwalTerpilih}
          hariIni={hariIniString}
          onClose={() => setJadwalTerpilih(null)}
        />
      )}
    </>
  );
}