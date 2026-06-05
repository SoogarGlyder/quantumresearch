"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CldUploadWidget } from "next-cloudinary";
import {
  FaCamera, FaFloppyDisk, FaImages, FaBookBookmark,
  FaUserGraduate, FaXmark, FaFileSignature, FaListUl,
  FaTrashCan, FaTriangleExclamation,
} from "react-icons/fa6";

import { simpanJurnalPengajar, ambilDetailJurnalPengajar } from "@/actions/teacherAction";
import {
  ambilKuisByJadwal, ambilSemuaBankSoal,
  terapkanBankSoalKeJadwal, hapusQuizDariJadwal,
} from "@/actions/quizAction";
import { PREFIX_BARCODE, STATUS_SESI, LABEL_SISTEM } from "@/utils/constants";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";
import journalStyles from "@/components/teacher/journal/Journal.module.css";

// ============================================================================
// TIPE KONFIRMASI — menggantikan window.confirm()
// ============================================================================
const KONFIRMASI_TIPE = Object.freeze({ PASANG: "pasang", LEPAS: "lepas" });

// ============================================================================
// SUB-KOMPONEN: DIALOG KONFIRMASI INLINE
// ============================================================================
function DialogKonfirmasi({ tipe, onBatal, onLanjut, isLoading }) {
  return (
    <div className={journalStyles.overlayBank}>
      <div className={styles.containerGallery} style={{ maxHeight: "auto" }}>
        <div style={{ padding: "24px", textAlign: "center" }}>
          <FaTriangleExclamation size={40} className={journalStyles.ikonMerah} />
          <h3 className={journalStyles.headerBankJudul} style={{ marginTop: 12 }}>
            {tipe === KONFIRMASI_TIPE.LEPAS ? "Lepas Kuis dari Kelas?" : "Terapkan Bank Soal?"}
          </h3>
          <p style={{ fontSize: 14, color: "#4b5563", fontWeight: 600, margin: "8px 0 20px" }}>
            {tipe === KONFIRMASI_TIPE.LEPAS
              ? "Kuis akan dilepas dari kelas ini. Siswa tidak bisa mengerjakan soal sampai dipasang kembali."
              : "Paket soal ini akan diterapkan ke kelas. Soal sebelumnya (jika ada) akan tergantikan."}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onBatal}
              disabled={isLoading}
              className={journalStyles.tombolKonfirmasiBatal ?? journalStyles.filterOption}
              style={{ flex: 1, padding: 12, background: "#f3f4f6", border: "3px solid #111827", borderRadius: 10, fontWeight: 900, cursor: "pointer" }}
            >Batal</button>
            <button
              onClick={onLanjut}
              disabled={isLoading}
              style={{ flex: 1, padding: 12, background: "#ef4444", color: "white", border: "3px solid #111827", borderRadius: 10, fontWeight: 900, cursor: "pointer" }}
            >{isLoading ? "Memproses..." : "Ya, Lanjutkan"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
export default function ModalJurnal({ jadwalTerpilih, hariIni, onClose }) {
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [formJurnal,    setFormJurnal]    = useState({ bab: "", subBab: "", galeriPapan: "", fotoBersama: "" });
  const [dataSiswa,     setDataSiswa]     = useState([]);
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [pesanJurnal,   setPesanJurnal]   = useState({ teks: "", tipe: "" });

  const [dataKuisAktif, setDataKuisAktif] = useState(null);
  const [isMemuatKuis,  setIsMemuatKuis]  = useState(false);

  const [isModalBankOpen, setIsModalBankOpen] = useState(false);
  const [listBankSoal,    setListBankSoal]    = useState([]);
  const [loadingBank,     setLoadingBank]     = useState(false);
  const [isMemprosesKuis, setIsMemprosesKuis] = useState(false);

  const [konfirmasi, setKonfirmasi] = useState(null);

  const tanggalJadwal = timeHelper.getTglJakarta(jadwalTerpilih?.tanggal);
  const isMasaDepan  = tanggalJadwal > hariIni;
  const isHariIni    = tanggalJadwal === hariIni;
  const isMasaLalu   = tanggalJadwal < hariIni;

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !loadingJurnal) onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "auto";
    };
  }, [loadingJurnal, onClose]);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setLoadingDetail(true);
      setIsMemuatKuis(true);

      const [hasilJurnal, hasilKuis] = await Promise.all([
        ambilDetailJurnalPengajar(jadwalTerpilih._id),
        ambilKuisByJadwal(jadwalTerpilih._id),
      ]);

      if (!isMounted) return;

      if (hasilJurnal.ok && hasilJurnal.data) {
        const { jadwal: jdlServer, dataSiswa: listSiswa } = hasilJurnal.data;
        setFormJurnal({
          bab:         jdlServer.bab            || "",
          subBab:      jdlServer.subBab         || "",
          galeriPapan: jdlServer.galeriPapan?.join(",") || "",
          fotoBersama: jdlServer.fotoBersama    || "",
        });
        setDataSiswa(listSiswa || []);
      } else {
        setPesanJurnal({ teks: hasilJurnal.pesan || "Gagal memuat data kelas.", tipe: "error" });
        setTimeout(() => onClose(), 2500);
      }

      setDataKuisAktif(hasilKuis);
      setIsMemuatKuis(false);
      setLoadingDetail(false);
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [jadwalTerpilih._id, onClose]);

  const ubahStatusSiswa = (idx, statusBaru) => {
    setDataSiswa((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], statusAbsen: statusBaru };
      if ([STATUS_SESI.SELESAI.id, STATUS_SESI.ALPA.id, LABEL_SISTEM.BELUM_ABSEN].includes(statusBaru)) {
        copy[idx].catatan = "";
      }
      return copy;
    });
  };
  const ubahNilaiSiswa = (idx, nilaiBaru) => {
    setDataSiswa((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        nilaiTest: nilaiBaru === "" ? "" : Math.min(100, Math.max(0, Number(nilaiBaru))),
      };
      return copy;
    });
  };
  const ubahCatatanSiswa = (idx, teks) => {
    setDataSiswa((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], catatan: teks };
      return copy;
    });
  };

  const klikSimpanJurnal = async (e) => {
    e.preventDefault();
    if (!jadwalTerpilih?._id) return;
    setLoadingJurnal(true);
    setPesanJurnal({ teks: "MENYIMPAN DATA...", tipe: "loading" });

    const hasil = await simpanJurnalPengajar(jadwalTerpilih._id, formJurnal, dataSiswa);
    setPesanJurnal({ teks: hasil.pesan, tipe: hasil.ok ? "sukses" : "error" });
    setLoadingJurnal(false);
    if (hasil.ok) setTimeout(() => onClose(), 2000);
  };

  const bukaPanelBankSoal = async () => {
    setIsModalBankOpen(true);
    setLoadingBank(true);
    const data = await ambilSemuaBankSoal(jadwalTerpilih.pengajarId);
    setListBankSoal(data || []);
    setLoadingBank(false);
  };

  const eksekusiKonfirmasi = async () => {
    if (!konfirmasi) return;
    setIsMemprosesKuis(true);

    if (konfirmasi.tipe === KONFIRMASI_TIPE.PASANG) {
      const res = await terapkanBankSoalKeJadwal(
        konfirmasi.idBankSoal, jadwalTerpilih._id, jadwalTerpilih.pengajarId
      );
      if (res.ok) {
        setIsModalBankOpen(false);
        setDataKuisAktif(await ambilKuisByJadwal(jadwalTerpilih._id));
      }
      setPesanJurnal({ teks: res.pesan, tipe: res.ok ? "sukses" : "error" });
    } else {
      const res = await hapusQuizDariJadwal(jadwalTerpilih._id);
      if (res.ok) setDataKuisAktif(null);
      setPesanJurnal({ teks: res.pesan, tipe: res.ok ? "sukses" : "error" });
    }

    setKonfirmasi(null);
    setIsMemprosesKuis(false);
  };

  const labelTanggalJadwal = timeHelper.formatTanggalLengkap(jadwalTerpilih?.tanggal);

  return (
    <div className={journalStyles.wrapperModalJurnal}>
      <div className={styles.containerGallery}>
        <div className={styles.headerGallery}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle}>JURNAL {jadwalTerpilih.mapel}</h3>
            <span className={styles.galleryDate}>
              {jadwalTerpilih.kelasTarget} • {labelTanggalJadwal}
            </span>
          </div>
          <button
            className={styles.galleryButton}
            onClick={onClose}
            disabled={loadingJurnal}
            aria-label="Tutup modal"
          >
            <FaXmark size={20} />
          </button>
        </div>
        <div className={styles.areaGallery}>
          {loadingDetail ? (
            <div className={journalStyles.loadingKelas}>
              <h3>Menyiapkan Kelas...</h3>
            </div>
          ) : (
            <>
              <div className={journalStyles.infoKelasBlock}>
                <h2 className={journalStyles.infoKelasJudul}>{jadwalTerpilih.mapel}</h2>
                <p className={journalStyles.infoKelasWaktu}>
                  {jadwalTerpilih.kelasTarget}<br />
                  <span className={journalStyles.infoKelasWaktuHitam}>
                    {labelTanggalJadwal} • {jadwalTerpilih.jamMulai} - {jadwalTerpilih.jamSelesai}
                  </span>
                </p>
              </div>

              {isMasaDepan ? (
                <div className={journalStyles.fasaPersiapan}>
                  <h3 className={journalStyles.fasaPersiapanJudul}>Fase Persiapan Kelas</h3>
                  <p className={journalStyles.fasaPersiapanSub}>
                    Kelas ini belum dimulai. Anda dapat mempersiapkan Pre-Test sekarang.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      dataKuisAktif
                        ? setKonfirmasi({ tipe: KONFIRMASI_TIPE.LEPAS })
                        : bukaPanelBankSoal()
                    }
                    disabled={isMemuatKuis || isMemprosesKuis}
                    className={`${journalStyles.tombolKuisAksi} ${dataKuisAktif ? journalStyles.tombolKuisAksiLepas : journalStyles.tombolKuisAksiPasang}`}
                  >
                    {isMemuatKuis || isMemprosesKuis
                      ? "MEMPROSES..."
                      : dataKuisAktif
                      ? <><FaTrashCan /> BATALKAN / LEPAS KUIS</>
                      : <><FaListUl /> PILIH DARI BANK SOAL</>}
                  </button>
                  {dataKuisAktif && (
                    <p className={journalStyles.infoPasangSoal}>
                      ✅ Kelas ini sudah dipasangkan paket soal ({dataKuisAktif.soal?.length || 0} Soal).
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className={`${journalStyles.panelKuisStatus} ${dataKuisAktif ? journalStyles.panelKuisStatusAktif : journalStyles.panelKuisStatusKosong}`}>
                      <div>
                        <h4 className={journalStyles.panelKuisJudul}>
                          <FaFileSignature /> {dataKuisAktif ? "KUIS CBT AKTIF" : "KUIS CBT KOSONG"}
                        </h4>
                        <p className={journalStyles.panelKuisSub}>
                          {isMemuatKuis
                            ? "Memeriksa..."
                            : dataKuisAktif
                            ? `Terpasang ${dataKuisAktif.soal?.length || 0} Soal (${dataKuisAktif.durasiMenit || 10} Menit).`
                            : "Belum ada paket soal yang dipasang."}
                        </p>
                      </div>
                      <div className={journalStyles.grupTombolPanel}>
                        {dataKuisAktif ? (
                          <button
                            type="button"
                            onClick={() => setKonfirmasi({ tipe: KONFIRMASI_TIPE.LEPAS })}
                            disabled={isMemprosesKuis}
                            className={journalStyles.tombolLepasKuis}
                          >
                            {isMemprosesKuis ? "..." : "LEPAS"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={bukaPanelBankSoal}
                            disabled={isMemprosesKuis}
                            className={journalStyles.tombolPasangKuis}
                          >
                            {isMemprosesKuis ? "..." : "PASANG SOAL"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isHariIni && (
                    <div className={journalStyles.wrapperQR}>
                      <div className={journalStyles.kartuQR}>
                        <QRCodeCanvas
                          value={`${PREFIX_BARCODE.KELAS}${jadwalTerpilih._id}`}
                          size={180}
                          level="H"
                        />
                      </div>
                      <p className={journalStyles.teksQR}>Scan QR ini untuk Masuk Kelas!</p>
                    </div>
                  )}

                  {isMasaLalu && (
                    <div className={journalStyles.peringatanRevisi}>
                      <p className={journalStyles.peringatanRevisiTeks}>
                        ⚠️ Kelas Berlalu. Anda hanya dapat merevisi jurnal & absensi.
                      </p>
                    </div>
                  )}

                  <form onSubmit={klikSimpanJurnal} className={journalStyles.formJurnal}>
                    <h3 className={`${styles.contentTitle} ${journalStyles.sectionTitle}`}>
                      <FaBookBookmark className={journalStyles.ikonBiru} /> 1. Laporan Materi
                    </h3>

                    <input
                      className={styles.scheduleOption}
                      placeholder="Bab Materi (Contoh: Aljabar)"
                      required
                      value={formJurnal.bab}
                      onChange={(e) => setFormJurnal((p) => ({ ...p, bab: e.target.value }))}
                    />
                    <textarea
                      className={styles.scheduleOption}
                      placeholder="Detail Sub-bab (Contoh: Persamaan Linear)"
                      rows={3}
                      required
                      value={formJurnal.subBab}
                      onChange={(e) => setFormJurnal((p) => ({ ...p, subBab: e.target.value }))}
                    />

                    <div className={journalStyles.uploadGrid}>
                      <CldUploadWidget uploadPreset="quantum_unsigned" options={{ multiple: true }}
                        onSuccess={(res) =>
                          setFormJurnal((p) => ({
                            ...p,
                            galeriPapan: (p.galeriPapan ? p.galeriPapan + "," : "") + res.info.secure_url,
                          }))
                        }>
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className={`${styles.scheduleOption} ${journalStyles.tombolUpload} ${formJurnal.galeriPapan ? journalStyles.tombolUploadAktif : ""}`}
                          >
                            <FaImages size={20} /><br />
                            {formJurnal.galeriPapan
                              ? `PAPAN OK (${formJurnal.galeriPapan.split(",").filter(Boolean).length})`
                              : "FOTO PAPAN"}
                          </button>
                        )}
                      </CldUploadWidget>

                      <CldUploadWidget uploadPreset="quantum_unsigned"
                        onSuccess={(res) =>
                          setFormJurnal((p) => ({ ...p, fotoBersama: res.info.secure_url }))
                        }>
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className={`${styles.scheduleOption} ${journalStyles.tombolUpload} ${formJurnal.fotoBersama ? journalStyles.tombolUploadAktif : ""}`}
                          >
                            <FaCamera size={20} /><br />
                            {formJurnal.fotoBersama ? "KELAS OK" : "FOTO KELAS"}
                          </button>
                        )}
                      </CldUploadWidget>
                    </div>

                    <div className={journalStyles.sectionSiswa}>
                      <h3 className={`${styles.contentTitle} ${journalStyles.sectionTitle}`}>
                        <FaUserGraduate className={journalStyles.ikonMerah} /> 2. Manajemen Siswa
                      </h3>
                    </div>

                    <div className={journalStyles.wrapperSiswaList}>
                      {dataSiswa.length === 0 ? (
                        <div className={styles.emptySchedule}>TIDAK ADA DATA SISWA.</div>
                      ) : (
                        dataSiswa.map((siswa, idx) => {
                          const isBelum     = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                          const butuhCatatan = [STATUS_SESI.SAKIT.id, STATUS_SESI.IZIN.id].includes(siswa.statusAbsen);

                          return (
                            <div
                              key={siswa.siswaId}
                              className={`${journalStyles.kartuSiswa} ${isBelum ? journalStyles.kartuSiswaBelum : journalStyles.kartuSiswaHadir}`}
                            >
                              <p className={journalStyles.namaSiswaJurnal}>{siswa.nama}</p>

                              <div className={journalStyles.wrapperInputSiswa}>
                                <select
                                  value={siswa.statusAbsen}
                                  onChange={(e) => ubahStatusSiswa(idx, e.target.value)}
                                  className={`${styles.scheduleOption} ${journalStyles.selectAbsen} ${isBelum ? journalStyles.selectAbsenBelum : ""}`}
                                >
                                  <option value={LABEL_SISTEM.BELUM_ABSEN}>⚠️ BELUM ABSEN</option>
                                  <option value={STATUS_SESI.SELESAI.id}>✅ HADIR</option>
                                  <option value={STATUS_SESI.ALPA.id}>❌ ALPA</option>
                                  <option value={STATUS_SESI.SAKIT.id}>🤒 SAKIT</option>
                                  <option value={STATUS_SESI.IZIN.id}>💌 IZIN</option>
                                </select>

                                <input
                                  type="number"
                                  placeholder="NILAI"
                                  value={siswa.nilaiTest === null ? "" : siswa.nilaiTest}
                                  onChange={(e) => ubahNilaiSiswa(idx, e.target.value)}
                                  disabled={
                                    siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN ||
                                    siswa.statusAbsen === STATUS_SESI.ALPA.id
                                  }
                                  className={`${styles.scheduleOption} ${journalStyles.inputNilai}`}
                                />
                              </div>

                              {butuhCatatan && (
                                <input
                                  type="text"
                                  placeholder="Keterangan Sakit/Izin"
                                  value={siswa.catatan || ""}
                                  onChange={(e) => ubahCatatanSiswa(idx, e.target.value)}
                                  className={`${styles.scheduleOption} ${journalStyles.inputKeterangan}`}
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {pesanJurnal.teks && (
                      <div className={`${journalStyles.pesanSimpan} ${
                        pesanJurnal.tipe === "sukses"  ? journalStyles.pesanSimpanSukses :
                        pesanJurnal.tipe === "error"   ? journalStyles.pesanSimpanError  :
                        journalStyles.pesanSimpanLoading}`}>
                        {pesanJurnal.teks}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loadingJurnal}
                      className={`${styles.tombolSimpanBiruBaru} ${journalStyles.tombolSimpanUtama}`}
                    >
                      <FaFloppyDisk /> {loadingJurnal ? "PROSES..." : "SIMPAN JURNAL"}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {isModalBankOpen && (
        <div className={journalStyles.overlayBank}>
          <div className={journalStyles.containerBank}>
            <div className={journalStyles.headerBank}>
              <h2 className={journalStyles.headerBankJudul}>PILIH PAKET SOAL</h2>
              <button
                onClick={() => setIsModalBankOpen(false)}
                className={journalStyles.tombolTutupBank}
                aria-label="Tutup panel bank soal"
              >
                <FaXmark size={20} className={journalStyles.ikonMerah} />
              </button>
            </div>

            <div className={journalStyles.listBank}>
              {loadingBank ? (
                <p style={{ textAlign: "center", fontWeight: "bold" }}>Memuat Bank Soal...</p>
              ) : listBankSoal.length === 0 ? (
                <p style={{ textAlign: "center", fontWeight: "bold", color: "#64748b" }}>
                  Belum ada Master Soal. Buat di Tab Tugas terlebih dahulu.
                </p>
              ) : (
                listBankSoal.map((bank) => (
                  <div key={bank._id} className={journalStyles.kartuBank}>
                    <div>
                      <h4 className={journalStyles.kartuBankJudul}>{bank.judul || "Tanpa Judul"}</h4>
                      <p className={journalStyles.kartuBankInfo}>
                        {bank.soal?.length || 0} Soal • {bank.durasiMenit || 10} Menit
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setKonfirmasi({ tipe: KONFIRMASI_TIPE.PASANG, idBankSoal: bank._id })
                      }
                      disabled={isMemprosesKuis}
                      className={journalStyles.tombolTerapkan}
                    >
                      {isMemprosesKuis ? "..." : "TERAPKAN"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {konfirmasi && (
        <DialogKonfirmasi
          tipe={konfirmasi.tipe}
          onBatal={() => setKonfirmasi(null)}
          onLanjut={eksekusiKonfirmasi}
          isLoading={isMemprosesKuis}
        />
      )}
    </div>
  );
}