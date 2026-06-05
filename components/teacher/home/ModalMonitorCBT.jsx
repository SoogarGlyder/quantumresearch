"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaXmark, FaRotateRight, FaClock, FaCheckDouble,
  FaTriangleExclamation, FaSkull, FaPowerOff,
} from "react-icons/fa6";
import { getStatusKuisLive, resetUjianSiswa, forceSubmitUjianSiswa } from "@/actions/teacherAction";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/teacher/home/Home.module.css";

// ============================================================================
// TIPE KONFIRMASI
// ============================================================================
const AKSI = Object.freeze({
  FORCE_SUBMIT: "force_submit",
  RESET:        "reset",
});

// ============================================================================
// SUB-KOMPONEN: DIALOG KONFIRMASI INLINE
// ============================================================================
function DialogKonfirmasi({ aksi, namaSiswa, onBatal, onLanjut, isLoading }) {
  const isForce = aksi === AKSI.FORCE_SUBMIT;

  return (
    <div className={homeStyles.backdropKonfirmasi}>
      <div className={homeStyles.cardKonfirmasi}>
        <FaTriangleExclamation size={40} className={homeStyles.ikonMerah} />
        <h3 className={homeStyles.judulKonfirmasi}>
          {isForce ? "Tutup Paksa Ujian?" : "Hapus Nilai Siswa?"}
        </h3>
        <p className={homeStyles.deskKonfirmasi}>
          {isForce
            ? `${namaSiswa} akan langsung mendapat nilai 0 dan akses ujiannya dikunci.`
            : `Seluruh jawaban dan nilai milik ${namaSiswa} akan dihapus. Siswa harus mengulang dari awal.`}
        </p>
        <div className={homeStyles.grupTombolKonfirmasi}>
          <button
            onClick={onBatal}
            className={homeStyles.tombolKonfirmasiBatal}
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            onClick={onLanjut}
            className={homeStyles.tombolKonfirmasiLanjut}
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : (isForce ? "Ya, Tutup Paksa" : "Ya, Hapus")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
export default function ModalMonitorCBT({ jadwalId, kelasTarget, onClose }) {
  const [dataSiswa,    setDataSiswa]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdate,   setLastUpdate]  = useState("");
  const [pesan,        setPesan]       = useState(null);
  const [konfirmasi,   setKonfirmasi]  = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const fetchLiveStatus = useCallback(async () => {
    try {
      const res = await getStatusKuisLive(jadwalId);
      if (res.ok) {
        setDataSiswa(res.data);
        const now = new Date();
        setLastUpdate(
          `${String(now.getHours()).padStart(2,"0")}:` +
          `${String(now.getMinutes()).padStart(2,"0")}:` +
          `${String(now.getSeconds()).padStart(2,"0")}`
        );
      }
    } catch (err) {
      console.error("[ModalMonitorCBT] Gagal memuat status live:", err);
    } finally {
      setLoading(false);
    }
  }, [jadwalId]);

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10_000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  const eksekusiAksi = async () => {
    if (!konfirmasi) return;
    setIsProcessing(true);
    setPesan(null);

    const { aksi, siswaId, namaSiswa } = konfirmasi;
    const res =
      aksi === AKSI.FORCE_SUBMIT
        ? await forceSubmitUjianSiswa(jadwalId, siswaId, namaSiswa)
        : await resetUjianSiswa(jadwalId, siswaId);

    setPesan({ teks: res.pesan, sukses: res.ok });
    if (res.ok) await fetchLiveStatus();
    setKonfirmasi(null);
    setIsProcessing(false);
  };

  const totalSiswa        = dataSiswa.length;
  const jumlahSelesai     = dataSiswa.filter((s) => s.status === "SELESAI").length;
  const jumlahMengerjakan = dataSiswa.filter((s) => s.status === "MENGERJAKAN").length;
  const jumlahBelum       = dataSiswa.filter((s) => s.status === "BELUM_MULAI").length;

  return (
    <div className={homeStyles.wrapperModal}>
      <div className={styles.containerGallery}>

        {/* Header */}
        <div className={styles.headerGallery}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle}>
              <span className={homeStyles.dotLive} aria-hidden="true" />
              {" "}RADAR CBT
            </h3>
            <span className={styles.galleryDate}>
              {kelasTarget} • Update: {lastUpdate || "--:--:--"}
            </span>
          </div>
          <div className={homeStyles.grupTombolGod}>
            <button
              className={styles.galleryButton}
              onClick={fetchLiveStatus}
              disabled={isProcessing}
              aria-label="Perbarui data"
            >
              <FaRotateRight size={18} />
            </button>
            <button
              className={styles.galleryButton}
              onClick={onClose}
              aria-label="Tutup modal"
            >
              <FaXmark size={20} />
            </button>
          </div>
        </div>

        <div className={styles.areaGallery}>

          {pesan && (
            <div className={`${homeStyles.pesanAksiArea} ${pesan.sukses ? homeStyles.pesanAksiSukses : homeStyles.pesanAksiGagal}`}>
              {pesan.teks}
            </div>
          )}

          <div className={homeStyles.statGrid4Col}>
            <div className={`${homeStyles.statCardModal} ${homeStyles.statCardBiru}`}>
              <h4>TOTAL SISWA</h4>
              <span>{totalSiswa}</span>
            </div>
            <div className={`${homeStyles.statCardModal} ${homeStyles.statCardKuning}`}>
              <h4>AKTIF KELAS</h4>
              <span>{jumlahMengerjakan}</span>
            </div>
            <div className={`${homeStyles.statCardModal} ${homeStyles.statCardHijau}`}>
              <h4>SELESAI (SUBMIT)</h4>
              <span>{jumlahSelesai}</span>
            </div>
            <div className={`${homeStyles.statCardModal} ${homeStyles.statCardAbu}`}>
              <h4>BELUM MASUK</h4>
              <span>{jumlahBelum}</span>
            </div>
          </div>

          {loading ? (
            <div className={homeStyles.loadingMonitor}>
              <h3>Menyadap Data Kelas...</h3>
            </div>
          ) : (
            <div className={homeStyles.listSiswa}>
              {dataSiswa.map((siswa, idx) => {
                const isSelesai     = siswa.status === "SELESAI";
                const isMengerjakan = siswa.status === "MENGERJAKAN";

                const rowClass = isSelesai
                  ? homeStyles.rowSiswaSelesai
                  : isMengerjakan
                  ? homeStyles.rowSiswaMengerjakan
                  : homeStyles.rowSiswaBelum;

                return (
                  <div key={idx} className={`${homeStyles.rowSiswa} ${rowClass}`}>

                    <div className={homeStyles.kiriSiswa}>
                      <h4 className={homeStyles.namaSiswa}>
                        {idx + 1}. {siswa.nama}
                      </h4>
                      {isSelesai && (
                        <span className={homeStyles.statusSelesai}>
                          <FaCheckDouble /> SKOR: {siswa.skor}
                        </span>
                      )}
                      {isMengerjakan && (
                        <span className={homeStyles.statusMengerjakan}>
                          <FaClock /> AKTIF (BISA UJIAN)
                        </span>
                      )}
                      {!isSelesai && !isMengerjakan && (
                        <span className={homeStyles.statusBelum}>BELUM MASUK</span>
                      )}
                    </div>

                    <div className={homeStyles.kananSiswa}>
                      {siswa.pelanggaran > 0 && !isSelesai && (
                        <div className={homeStyles.pelanggaranBadge}>
                          <FaTriangleExclamation /> {siswa.pelanggaran}x
                        </div>
                      )}

                      <div className={homeStyles.grupTombolGod}>
                        {isMengerjakan && (
                          <button
                            onClick={() => setKonfirmasi({ aksi: AKSI.FORCE_SUBMIT, siswaId: siswa.id, namaSiswa: siswa.nama })}
                            disabled={isProcessing}
                            title="Tutup paksa (beri nilai 0)"
                            className={`${homeStyles.tombolGod} ${homeStyles.tombolForce}`}
                          >
                            <FaPowerOff size={14} />
                          </button>
                        )}
                        {isSelesai && (
                          <button
                            onClick={() => setKonfirmasi({ aksi: AKSI.RESET, siswaId: siswa.id, namaSiswa: siswa.nama })}
                            disabled={isProcessing}
                            title="Reset nilai siswa"
                            className={`${homeStyles.tombolGod} ${homeStyles.tombolReset}`}
                          >
                            <FaSkull size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {konfirmasi && (
        <DialogKonfirmasi
          aksi={konfirmasi.aksi}
          namaSiswa={konfirmasi.namaSiswa}
          onBatal={() => setKonfirmasi(null)}
          onLanjut={eksekusiAksi}
          isLoading={isProcessing}
        />
      )}
    </div>
  );
}