"use client";

import { memo, Suspense, useState } from "react";
import { FaBookOpen, FaPen, FaUserTie } from "react-icons/fa6";
import { formatHelper } from "@/utils/formatHelper";
import PaginationBar from "@/components/ui/PaginationBar";
import { LIMIT_DATA } from "@/utils/constants";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/student/home/Home.module.css";

/** Seragamkan nama kreator menjadi format "Kak [Nama]" */
const formatNamaKreator = (namaRaw) => {
  if (!namaRaw)                   return "Admin Quantum";
  if (namaRaw === "Admin Quantum") return namaRaw;

  let namaAsli = namaRaw;
  if (namaRaw.startsWith("Staff Akademik (") && namaRaw.endsWith(")")) {
    namaAsli = namaRaw.slice(16, -1);
  } else if (namaRaw.startsWith("Kak ")) {
    namaAsli = namaRaw.slice(4);
  }
  return `Kak ${namaAsli}`;
};

const InnerLatihanHariIni = memo(({ latihanHariIni = [], setUrlMitra }) => {
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE  = LIMIT_DATA?.PAGINATION_BAHAN || 3;

  const daftarLatihan = Array.isArray(latihanHariIni)
    ? latihanHariIni
    : latihanHariIni ? [latihanHariIni] : [];

  const { totalPage, dataTerpotong: dataHalIni } =
    formatHelper.potongDataPagination(daftarLatihan, page, ITEMS_PER_PAGE);

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}>
        <FaBookOpen className={homeStyles.ikonBiru} /> Bahan Belajar
      </h3>

      <div className={homeStyles.missionList}>
        {dataHalIni.length > 0 ? (
          <>
            {dataHalIni.map((latihan, index) => (
              <div
                key={latihan._id || index}
                className={homeStyles.kartuLatihan}
                onClick={() => setUrlMitra(latihan.url)}
              >
                <div className={homeStyles.innerLatihan}>
                  <div className={homeStyles.ikonKuisWrap}>
                    <div className={homeStyles.ikonLatihan}>
                      <FaPen size={18} />
                    </div>
                    <div>
                      <h4 className={homeStyles.judulLatihan}>{latihan.judul}</h4>
                      <span className={homeStyles.pembuatLatihan}>
                        <FaUserTie size={12} className={homeStyles.ikonSlate} />
                        {formatNamaKreator(latihan.namaPembuat)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className={homeStyles.paginasiWrapper}>
              <PaginationBar
                totalPages={totalPage}
                currentPage={page}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <p className={`${homeStyles.emptySchedule} ${homeStyles.emptyLatihan}`}>
            Tidak ada bahan belajar tambahan hari ini. Ayo Konsul!
          </p>
        )}
      </div>
    </div>
  );
});

InnerLatihanHariIni.displayName = "InnerLatihanHariIni";

export default function LatihanHariIni(props) {
  return (
    <Suspense
      fallback={
        <div className={styles.contentContainer}>
          <p className={homeStyles.loadingLatihan}>Memuat Bahan Belajar...</p>
        </div>
      }
    >
      <InnerLatihanHariIni {...props} />
    </Suspense>
  );
}