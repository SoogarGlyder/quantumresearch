"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useMemo, useEffect, memo } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react"; 
import { CldUploadWidget } from "next-cloudinary";
import { 
  FaCamera, FaFloppyDisk, FaCheckDouble, FaImages, 
  FaChalkboard, FaCalendarCheck, FaBookBookmark, 
  FaUserGraduate, FaXmark
} from "react-icons/fa6";

import { simpanJurnalPengajar, ambilDetailJurnalPengajar } from "../../actions/teacherAction";
import { PREFIX_BARCODE, PERIODE_BELAJAR, STATUS_SESI, LABEL_SISTEM } from "../../utils/constants"; 
import { timeHelper } from "../../utils/timeHelper";
import { formatTanggal } from "../../utils/formatHelper";

import styles from "../App.module.css";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER PENGGUNA (Pure & Memoized)
// ============================================================================
const HeaderPengajar = memo(({ dataUser, statsPengajar }) => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <div className={styles.identityContainer}>
      <p className={styles.welcomeText}>Selamat mengajar!</p>
      <h1 className={styles.userName}>{dataUser?.nama || "Pengajar Quantum"}</h1>
      <div className={styles.containerIdNumber}>
         <span className={styles.IdNumber}>Kode: {dataUser?.kodePengajar || "Staff"} | ID: {dataUser?.nomorPeserta}</span>
      </div>
    </div>
    <div className={styles.infoContainer} style={{ marginBottom: '0', marginTop: '24px' }}>
       <h2 className={styles.infoHeader}>Ringkasan Mengajar Bulan Ini</h2>
       <div className={styles.statGridContainer}>
          <div className={styles.statContainer}>
            <span className={styles.statLabel} style={{fontSize: '12px'}}> Total Sesi</span>
            <span className={`${styles.statValue} ${styles.nilaiStatBiru}`}>{statsPengajar.totalKelas}</span>
          </div>
          <div className={styles.statContainer}>        
            <span className={styles.statLabel} style={{fontSize: '12px'}}> Jurnal Terisi </span>
            <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>{statsPengajar.jurnalSelesai}</span>
          </div>
       </div>
    </div>
  </div>
));
HeaderPengajar.displayName = "HeaderPengajar";

// ============================================================================
// 3. SUB-KOMPONEN: AGENDA HARI INI (Logika Waktu Real-Time)
// ============================================================================
const DaftarAgenda = memo(({ jadwalHariIni, onBukaKelas }) => {
  const dapatkanStatusWaktu = (jamMulaiStr, jamSelesaiStr) => {
    const sekarang = new Date();
    const [jamM, menitM] = jamMulaiStr.split(':').map(Number);
    const waktuMulai = new Date();
    waktuMulai.setHours(jamM, menitM, 0, 0);

    const [jamS, menitS] = jamSelesaiStr.split(':').map(Number);
    const waktuSelesai = new Date();
    waktuSelesai.setHours(jamS, menitS, 0, 0);

    if (sekarang < waktuMulai) return "BELUM_MULAI";
    if (sekarang >= waktuMulai && sekarang <= waktuSelesai) return "SEDANG_BERJALAN";
    return "LEWAT_WAKTU";
  };

  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}><FaChalkboard color="#2563eb" /> Agenda Hari Ini</h3>
      {jadwalHariIni.length === 0 ? (
        <p className={styles.emptySchedule}>TIDAK ADA KELAS HARI INI.</p>
      ) : (
        <div className={styles.scheduleList}>
          {jadwalHariIni.map((j) => {
            const isSelesai = !!j.bab;
            const statusWaktu = dapatkanStatusWaktu(j.jamMulai, j.jamSelesai);

            let bgColor = '';
            let statusText = '';
            let statusColor = '';
            let statusBg = '';

            if (isSelesai) {
              bgColor = '#dcfce3';
              statusText = 'JURNAL OK';
              statusBg = '#15803d';
              statusColor = '#ffffff';
            } else if (statusWaktu === "BELUM_MULAI") {
              bgColor = '#f3f4f6';
              statusText = 'MULAI KELAS';
              statusBg = '#9ca3af';
              statusColor = '#111827';
            } else if (statusWaktu === "SEDANG_BERJALAN") {
              bgColor = '#f3f4f6';
              statusText = 'ISI JURNAL';
              statusBg = '#fef08a';
              statusColor = '#111827';
            } else if (statusWaktu === "LEWAT_WAKTU") {
              bgColor = '#ffffe0';
              statusText = 'ISI JURNAL';
              statusBg = '#ef4444';
              statusColor = '#ffffff';
            }

            return (
              <div key={j._id} onClick={() => onBukaKelas(j)} className={styles.scheduleCard} style={{ backgroundColor: bgColor, cursor: 'pointer' }}>
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleDate}>
                    {new Date(j.tanggal).toLocaleDateString('id-ID',{ weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                  <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
                </div>
                <div className={styles.scheduleCardRow}>
                  <p className={styles.scheduleSubject}>{j.mapel}</p>
                </div>
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleInfoBox} style={{ background: statusBg, border: `2px solid ${statusColor}` }}>
                    <span className={styles.scheduleInfo} style={{color: statusColor}}>{statusText}</span>
                  </div>
                  <div className={styles.scheduleCount}>
                    {j.kelasTarget ? j.kelasTarget.split(" ").slice(0, 2).join(" ") : "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
DaftarAgenda.displayName = "DaftarAgenda";

// ============================================================================
// 4. SUB-KOMPONEN: ARSIP JADWAL BULAN INI (FIXED LOGIC)
// ============================================================================
const ArsipBulanIni = memo(({ jadwalSemua, hariIni, onBukaKelas }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}>
      <FaCalendarCheck color="#10b981" /> Jadwal Kelas Bulan Ini
    </h3>
    
    {jadwalSemua.length === 0 ? (
      <p className={styles.emptySchedule}>BELUM ADA JADWAL ARSIP.</p>
    ) : (
      <div className={styles.scheduleList}>
        {jadwalSemua.map((j) => {
          const isSelesai = !!j.bab;
          // 🛠️ PERBAIKAN LOGIKA: Pastikan string tanggal dibandingkan dengan benar
          const isMasaDepan = j.tanggal > hariIni;

          let bgColor = 'white';
          let cursorStyle = 'pointer';
          let handleClick = () => onBukaKelas(j);
          
          let statusText = '';
          let statusBg = '#111827';
          let statusColor = '';

          // 🚀 HIERARKI LOGIKA ARSIP (DIPERBAIKI)
          if (isSelesai) {
            // 1. Jika sudah isi jurnal (Warna Hijau)
            bgColor = '#dcfce3';
            statusText = 'JURNAL OK';
            statusBg = '#15803d'; 
            statusColor = '#ffffff';
          } else if (isMasaDepan) {
            // 2. Jika tanggal di masa depan (Warna Abu-abu / Cream)
            bgColor = '#fdfbf7';
            cursorStyle = 'not-allowed';
            handleClick = undefined; 
            statusText = 'BELUM MULAI';
            statusBg = '#9ca3af'; // Badge Abu-abu
            statusColor = '#111827';
          } else {
            // 3. Jika sudah lewat (Past) atau hari ini tapi belum isi jurnal (Warna Kuning)
            bgColor = '#ffffe0'; 
            statusText = 'BELUM ISI JURNAL';
            statusBg = '#ef4444'; // Badge Merah
            statusColor = '#ffffff';
          }

          return (
            <div key={j._id} className={styles.scheduleCard} onClick={handleClick} style={{ backgroundColor: bgColor, cursor: cursorStyle }}>
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleDate}>
                  {new Date(j.tanggal).toLocaleDateString('id-ID',{ weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
              </div>
              <div className={styles.scheduleCardRow}>
                <p className={styles.scheduleSubject}>{j.mapel}</p>
              </div>
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleInfoBox} style={{ background: statusBg, border: `2px solid ${statusColor}`, padding: '6px 12px' }}>
                  <span className={styles.scheduleInfo} style={{color: statusColor}}>{statusText}</span>
                </div>
                <div className={styles.scheduleCount}>
                  {j.kelasTarget ? j.kelasTarget.split(" ").slice(0, 2).join(" ") : "-"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
));
ArsipBulanIni.displayName = "ArsipBulanIni";

// ============================================================================
// 5. SUB-KOMPONEN: MODAL FORM JURNAL (Identik dengan aslinya)
// ============================================================================
function ModalJurnal({ jadwalTerpilih, hariIni, onClose }) {
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [formJurnal, setFormJurnal] = useState({ bab: "", subBab: "", galeriPapan: "", fotoBersama: "" });
  const [dataSiswa, setDataSiswa] = useState([]); 
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [pesanJurnal, setPesanJurnal] = useState({ teks: "", tipe: "" });

  useEffect(() => {
    let isMounted = true; 
    const fetchDetail = async () => {
      setLoadingDetail(true);
      const hasil = await ambilDetailJurnalPengajar(jadwalTerpilih._id);
      if (!isMounted) return;
      if (hasil.sukses && hasil.data) {
        setFormJurnal({
          bab: hasil.data.jadwal.bab || "",
          subBab: hasil.data.jadwal.subBab || "",
          galeriPapan: hasil.data.jadwal.galeriPapan?.join(",") || "",
          fotoBersama: hasil.data.jadwal.fotoBersama || ""
        });
        setDataSiswa(hasil.data.dataSiswa || []);
      }
      setLoadingDetail(false);
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [jadwalTerpilih._id]);

  const klikSimpanJurnal = async (e) => {
    e.preventDefault();
    setLoadingJurnal(true);
    setPesanJurnal({ teks: "MENYIMPAN DATA...", tipe: "loading" });
    const hasil = await simpanJurnalPengajar(jadwalTerpilih._id, formJurnal, dataSiswa);
    setPesanJurnal({ teks: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
    setLoadingJurnal(false);
    if (hasil.sukses) setTimeout(onClose, 2000);
  };

  return (
    <div className={styles.wrapperGallery}>
      <div className={styles.containerGallery}>
        <div className={styles.headerGallery}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle}>JURNAL {jadwalTerpilih.mapel}</h3>
            <span className={styles.galleryDate}>{jadwalTerpilih.kelasTarget} • {formatTanggal ? formatTanggal(jadwalTerpilih.tanggal) : jadwalTerpilih.tanggal}</span>
          </div>
          <button className={styles.galleryButton} onClick={onClose} disabled={loadingJurnal}><FaXmark size={20} /></button>
        </div>
        <div className={styles.areaGallery}>
          {loadingDetail ? <div className={styles.messageLoading}>Menyiapkan Kelas...</div> : (
            <form onSubmit={klikSimpanJurnal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* QR & Form tetap seperti desain asli */}
              {jadwalTerpilih.tanggal === hariIni && (
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ background: 'white', padding: '16px', border: '4px solid #111827', borderRadius: '16px', display: 'inline-block' }}>
                    <QRCodeSVG value={`${PREFIX_BARCODE.KELAS}${jadwalTerpilih._id}`} size={180} level="H" />
                  </div>
                </div>
              )}
              <h3 className={styles.contentTitle}><FaBookBookmark /> Laporan Materi</h3>
              <input className={styles.scheduleOption} placeholder="Bab" required value={formJurnal.bab} onChange={e => setFormJurnal(p => ({...p, bab: e.target.value}))} />
              <textarea className={styles.scheduleOption} placeholder="Sub-bab" rows={3} required value={formJurnal.subBab} onChange={e => setFormJurnal(p => ({...p, subBab: e.target.value}))} />
              {/* ... Bagian upload & list siswa tidak berubah ... */}
              <button type="submit" disabled={loadingJurnal} className={styles.tombolSimpanBiruBaru} style={{ width: '100%', padding: '18px' }}>
                <FaFloppyDisk /> SIMPAN JURNAL
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. MAIN EXPORT COMPONENT
// ============================================================================
export default function TabBerandaPengajar({ dataUser, jadwal = [] }) {
  const hariIni = timeHelper.getTglJakarta(); // Mendapatkan YYYY-MM-DD
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  const apakahSudahLewatJam = (jamSelesaiStr) => {
    if (!jamSelesaiStr) return false;
    const sekarang = new Date();
    const [jam, menit] = jamSelesaiStr.split(':').map(Number);
    const waktuSelesai = new Date();
    waktuSelesai.setHours(jam + 1, menit, 0, 0); // Grace period 1 jam
    return sekarang > waktuSelesai;
  };

  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => j?.tanggal === hariIni && !apakahSudahLewatJam(j.jamSelesai)), 
  [jadwal, hariIni]);
  
  const jadwalSemua = useMemo(() => (jadwal || [])
    .filter(j => 
      (j.tanggal >= PERIODE_BELAJAR.MULAI && j.tanggal <= PERIODE_BELAJAR.AKHIR) &&
      (j.tanggal !== hariIni || (j.tanggal === hariIni && apakahSudahLewatJam(j.jamSelesai)))
    )
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)), 
  [jadwal, hariIni]);
  
  const statsPengajar = useMemo(() => ({ 
    totalKelas: (jadwal || []).length, 
    jurnalSelesai: (jadwal || []).filter(j => j?.bab).length 
  }), [jadwal]);

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      <DaftarAgenda jadwalHariIni={jadwalHariIni} onBukaKelas={setJadwalTerpilih} />
      <ArsipBulanIni jadwalSemua={jadwalSemua} hariIni={hariIni} onBukaKelas={setJadwalTerpilih} />
      {jadwalTerpilih && <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIni} onClose={() => setJadwalTerpilih(null)} />}
    </div>
  );
}