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
  // Fungsi Helper untuk cek status jam saat ini
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
    return "LEWAT_WAKTU"; // Sudah lewat jam selesai (tapi masih masuk grace period 1 jam)
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

            // 🚀 HIERARKI LOGIKA AGENDA HARI INI
            if (isSelesai) {
              // 1. SUDAH ISI JURNAL (Menang telak)
              bgColor = '#dcfce3'; // Light Green
              statusText = 'JURNAL OK';
              statusBg = '#15803d'; // Hijau
              statusColor = '#ffffff';
            } else if (statusWaktu === "BELUM_MULAI") {
              // 2. HARI INI TAPI BELUM MASUK JAMNYA
              bgColor = '#f3f4f6'; // Abu-abu muda
              statusText = 'MULAI KELAS';
              statusBg = '#9ca3af'; // Abu-abu tua
              statusColor = '#111827';
            } else if (statusWaktu === "SEDANG_BERJALAN") {
              // 3. SEDANG BERLANGSUNG
              bgColor = '#f3f4f6'; // Light Yellow
              statusText = 'ISI JURNAL';
              statusBg = '#fef08a'; // Hitam (agar kontras dengan kuning)
              statusColor = '#111827';
            } else if (statusWaktu === "LEWAT_WAKTU") {
              // 4. LEWAT JAM SELESAI (Tapi masih di Agenda karena grace period)
              bgColor = '#ffffe0'; // Light Yellow (Background tetap kuning biar nggak kaget)
              statusText = 'ISI JURNAL';
              statusBg = '#ef4444'; // Light Red / Merah (Peringatan di badgenya)
              statusColor = '#ffffff';
            }

            return (
              <div key={j._id} onClick={() => onBukaKelas(j)} className={styles.scheduleCard} style={{ backgroundColor: bgColor, cursor: 'pointer' }}>
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleDate}>
                    {new Date(j.tanggal).toLocaleDateString('id-ID',{ timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}
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
// 4. SUB-KOMPONEN: ARSIP JADWAL BULAN INI
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
          const isMasaDepan = j.tanggal > hariIni;

          let bgColor = 'white';
          let cursorStyle = 'pointer';
          let opacityValue = 1;
          let handleClick = () => onBukaKelas(j);
          
          let statusText = '';
          let statusBg = '#111827';
          let statusColor = '';

          if (isSelesai) {
            bgColor = '#dcfce3';
            statusText = 'JURNAL OK';
            statusBg = '#15803d'; 
            statusColor = '#ffffff';
          } else if (isMasaDepan) {
            bgColor = '#fdfbf7';
            cursorStyle = 'not-allowed';
            handleClick = undefined; 
            statusText = 'BELUM MULAI';
            statusBg = '#9ca3af';
            statusColor = '#111827';
          } else {
            bgColor = '#ffffe0'; 
            statusText = 'BELUM ISI JURNAL';
            statusBg = '#ef4444'; 
            statusColor = '#ffffff';
          }

          return (
            <div key={j._id} className={styles.scheduleCard} onClick={handleClick} style={{ backgroundColor: bgColor, cursor: cursorStyle, opacity: opacityValue }}>
              <div className={styles.scheduleCardRow}>
                <div className={styles.scheduleDate}>
                  {new Date(j.tanggal).toLocaleDateString('id-ID',{ timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}
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
// 5. SUB-KOMPONEN: MODAL FORM JURNAL (State Colocation)
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
        const { jadwal: jdlServer, dataSiswa: listSiswa } = hasil.data;
        setFormJurnal({
          bab: jdlServer.bab || "",
          subBab: jdlServer.subBab || "",
          galeriPapan: jdlServer.galeriPapan?.join(",") || "",
          fotoBersama: jdlServer.fotoBersama || ""
        });
        setDataSiswa(listSiswa || []);
      } else {
        alert(hasil.pesan || "Gagal memuat data kelas.");
        onClose();
      }
      setLoadingDetail(false);
    };

    fetchDetail();
    return () => { isMounted = false; };
  }, [jadwalTerpilih._id, onClose]);

  const ubahStatusSiswa = (idx, statusBaru) => {
    const newData = [...dataSiswa];
    newData[idx].statusAbsen = statusBaru;
    if ([STATUS_SESI.SELESAI.id, STATUS_SESI.ALPA.id, LABEL_SISTEM.BELUM_ABSEN].includes(statusBaru)) newData[idx].catatan = "";
    setDataSiswa(newData);
  };

  const ubahNilaiSiswa = (idx, nilaiBaru) => {
    const newData = [...dataSiswa];
    newData[idx].nilaiTest = nilaiBaru === "" ? "" : Math.min(100, Math.max(0, Number(nilaiBaru)));
    setDataSiswa(newData);
  };

  const ubahCatatanSiswa = (idx, teksCatatan) => {
    const newData = [...dataSiswa];
    newData[idx].catatan = teksCatatan;
    setDataSiswa(newData);
  };

  const klikSimpanJurnal = async (e) => {
    e.preventDefault();
    if (!jadwalTerpilih?._id) return;

    setLoadingJurnal(true);
    setPesanJurnal({ teks: "MENYIMPAN DATA...", tipe: "loading" });

    const hasil = await simpanJurnalPengajar(jadwalTerpilih._id, formJurnal, dataSiswa);
    setPesanJurnal({ teks: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
    setLoadingJurnal(false);
    
    if (hasil.sukses) {
      setTimeout(() => { onClose(); }, 2000);
    }
  };

  return (
    <div className={styles.wrapperGallery}>
      <div className={styles.containerGallery}>
        <div className={styles.headerGallery}>
          <div className={styles.wrapperTitle}>
            <h3 className={styles.galleryTitle}>JURNAL {jadwalTerpilih.mapel}</h3>
            <span className={styles.galleryDate}>
              {jadwalTerpilih.kelasTarget} • {formatTanggal ? formatTanggal(jadwalTerpilih.tanggal) : jadwalTerpilih.tanggal}
            </span>
          </div>
          <button className={styles.galleryButton} onClick={onClose} disabled={loadingJurnal}>
            <FaXmark size={20} />
          </button>
        </div>

        <div className={styles.areaGallery}>
          {loadingDetail ? (
            <div className={styles.messageLoading} style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase' }}>Menyiapkan Kelas...</h3>
            </div>
          ) : (
            <>
              {/* INFO KELAS DALAM MODAL */}
              <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '4px solid #111827', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: 0, textTransform: 'uppercase' }}>{jadwalTerpilih.mapel}</h2>
                <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '14px', margin: '8px 0 0 0' }}>
                  {jadwalTerpilih.kelasTarget} <br/> 
                  <span style={{ color: '#111827' }}>{formatTanggal ? formatTanggal(jadwalTerpilih.tanggal) : jadwalTerpilih.tanggal} • {jadwalTerpilih.jamMulai} - {jadwalTerpilih.jamSelesai}</span>
                </p>
              </div>

              {jadwalTerpilih.tanggal === hariIni && (
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ background: 'white', padding: '16px', border: '4px solid #111827', borderRadius: '16px', display: 'inline-block', boxShadow: '8px 8px 0 #facc15' }}>
                    <QRCodeSVG value={`${PREFIX_BARCODE.KELAS}${jadwalTerpilih._id}`} size={180} level="H" />
                  </div>
                  <p style={{marginTop: '16px', fontSize: '14px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase'}}>Arahkan siswa untuk scan QR ini!</p>
                </div>
              )}

              {jadwalTerpilih.tanggal < hariIni && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#fef08a', border: '4px solid #111827', boxShadow: '4px 4px 0 #111827', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: '900', color: '#111827', margin: 0, textTransform: 'uppercase' }}>⚠️ Kelas Berlalu. Anda hanya dapat merevisi jurnal & absensi.</p>
                </div>
              )}

              <form onSubmit={klikSimpanJurnal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 className={styles.contentTitle} style={{ margin: 0 }}><FaBookBookmark color="#2563eb" /> 1. Laporan Materi</h3>
                <input className={styles.scheduleOption} placeholder="Bab Materi (Contoh: Aljabar)" required value={formJurnal.bab} onChange={e => setFormJurnal(prev => ({...prev, bab: e.target.value}))} />
                <textarea className={styles.scheduleOption} placeholder="Detail Sub-bab (Contoh: Persamaan Linear)" rows={3} required value={formJurnal.subBab} onChange={e => setFormJurnal(prev => ({...prev, subBab: e.target.value}))} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <CldUploadWidget uploadPreset="quantum_unsigned" options={{ multiple: true }} onSuccess={res => setFormJurnal(prev => ({ ...prev, galeriPapan: (prev.galeriPapan ? prev.galeriPapan + "," : "") + res.info.secure_url }))}>
                    {({ open }) => (
                      <button type="button" onClick={() => open()} className={styles.scheduleOption} style={{ background: formJurnal.galeriPapan ? '#dcfce3' : '#f3f4f6', cursor: 'pointer', textAlign: 'center' }}>
                        <FaImages size={20} style={{marginBottom: '8px'}} /> <br/> {formJurnal.galeriPapan ? `PAPAN OK (${formJurnal.galeriPapan.split(',').length})` : 'FOTO PAPAN'}
                      </button>
                    )}
                  </CldUploadWidget>
                  <CldUploadWidget uploadPreset="quantum_unsigned" onSuccess={res => setFormJurnal(prev => ({ ...prev, fotoBersama: res.info.secure_url }))}>
                    {({ open }) => (
                      <button type="button" onClick={() => open()} className={styles.scheduleOption} style={{ background: formJurnal.fotoBersama ? '#dcfce3' : '#f3f4f6', cursor: 'pointer', textAlign: 'center' }}>
                        <FaCamera size={20} style={{marginBottom: '8px'}} /> <br/> {formJurnal.fotoBersama ? 'KELAS OK' : 'FOTO KELAS'}
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                <div style={{ borderTop: '4px solid #111827', paddingTop: '20px', marginTop: '8px' }}>
                  <h3 className={styles.contentTitle} style={{ margin: 0 }}><FaUserGraduate color="#ef4444" /> 2. Manajemen Siswa</h3>
                  <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', fontWeight: '800' }}>Edit absen manual & beri catatan jika diperlukan.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dataSiswa.length === 0 ? (
                    <div className={styles.emptySchedule}>TIDAK ADA DATA SISWA.</div>
                  ) : (
                    dataSiswa.map((siswa, idx) => {
                      const isBelum = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                      return (
                        <div key={siswa.siswaId} style={{ background: isBelum ? '#fff' : '#dcfce3', padding: '16px', borderRadius: '12px', border: '3px solid #111827', boxShadow: '4px 4px 0 #111827' }}>
                          <p style={{ fontWeight: '900', margin: '0 0 8px 0', fontSize: '15px', color: '#111827', textTransform: 'uppercase' }}>{siswa.nama}</p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select value={siswa.statusAbsen} onChange={(e) => ubahStatusSiswa(idx, e.target.value)} className={styles.scheduleOption} style={{ flex: 1, padding: '10px', backgroundColor: isBelum ? '#fef08a' : '#fff', boxShadow: 'none', border: '2px solid #111827' }}>
                              <option value={LABEL_SISTEM.BELUM_ABSEN}>⚠️ BELUM ABSEN</option>
                              <option value={STATUS_SESI.SELESAI.id}>✅ HADIR</option>
                              <option value={STATUS_SESI.ALPA.id}>❌ ALPA</option>
                              <option value={STATUS_SESI.SAKIT.id}>🤒 SAKIT</option>
                              <option value={STATUS_SESI.IZIN.id}>💌 IZIN</option>
                            </select>
                            <input type="number" placeholder="NILAI" value={siswa.nilaiTest === null ? "" : siswa.nilaiTest} onChange={(e) => ubahNilaiSiswa(idx, e.target.value)} disabled={siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN || siswa.statusAbsen === STATUS_SESI.ALPA.id} className={styles.scheduleOption} style={{ width: '80px', padding: '10px', textAlign: 'center', boxShadow: 'none', border: '2px solid #111827' }} />
                          </div>
                          {!isBelum && (siswa.statusAbsen === STATUS_SESI.SAKIT.id || siswa.statusAbsen === STATUS_SESI.IZIN.id) && (
                            <input type="text" placeholder="Catatan opsional (Cth: Tipes)" value={siswa.catatan || ""} onChange={(e) => ubahCatatanSiswa(idx, e.target.value)} className={styles.scheduleOption} style={{ width: '100%', padding: '10px', marginTop: '8px', fontSize: '12px', boxShadow: 'none', border: '2px dashed #111827' }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {pesanJurnal.teks && (
                  <div className={pesanJurnal.tipe === 'loading' ? styles.messageLoading : ''} style={{ padding: '16px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', textAlign: 'center', color: '#111827', backgroundColor: pesanJurnal.tipe === 'sukses' ? '#4ade80' : pesanJurnal.tipe === 'error' ? '#fca5a5' : '#fef08a', border: '3px solid #111827', textTransform: 'uppercase' }}>
                    {pesanJurnal.teks}
                  </div>
                )}

                <button type="submit" disabled={loadingJurnal} className={styles.tombolSimpanBiruBaru} style={{ width: '100%', padding: '18px', fontSize: '18px', marginTop: '8px' }}>
                  <FaFloppyDisk /> {loadingJurnal ? 'PROSES...' : 'SIMPAN JURNAL'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. MAIN EXPORT COMPONENT (Hanya Merakit Komponen & Menyiapkan Data)
// ============================================================================
export default function TabBerandaPengajar({ dataUser, jadwal = [] }) {
  const hariIni = timeHelper.getTglJakarta();
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // 🚀 Fungsi Pembantu: Memeriksa apakah jam saat ini sudah melewati jamSelesai + 1 JAM
  const apakahSudahLewatJam = (jamSelesaiStr) => {
    if (!jamSelesaiStr) return false;
    
    const sekarang = new Date();
    const [jam, menit] = jamSelesaiStr.split(':').map(Number);
    const waktuSelesai = new Date();
    waktuSelesai.setHours(jam, menit, 0, 0);
    
    // Grace Period 1 Jam
    waktuSelesai.setHours(waktuSelesai.getHours() + 1);

    return sekarang > waktuSelesai;
  };

  // JADWAL HARI INI: Tanggal cocok & jam kelas (plus 1 jam) BELUM habis.
  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => j?.tanggal === hariIni && !apakahSudahLewatJam(j.jamSelesai)), 
  [jadwal, hariIni]);
  
  // JADWAL ARSIP: Tanggal BUKAN hari ini, ATAU hari ini tapi jamnya (plus 1 jam) sudah habis.
  const jadwalSemua = useMemo(() => (jadwal || [])
    .filter(j => 
      (j.tanggal >= PERIODE_BELAJAR.MULAI && j.tanggal <= PERIODE_BELAJAR.AKHIR) &&
      (j.tanggal !== hariIni || (j.tanggal === hariIni && apakahSudahLewatJam(j.jamSelesai)))
    )
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)), 
  [jadwal, hariIni]);
  
  const statsPengajar = useMemo(() => ({ totalKelas: (jadwal || []).length, jurnalSelesai: (jadwal || []).filter(j => j?.bab).length }), [jadwal]);

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      
      <DaftarAgenda 
        jadwalHariIni={jadwalHariIni} 
        onBukaKelas={setJadwalTerpilih} 
      />
      
      <ArsipBulanIni 
        jadwalSemua={jadwalSemua} 
        hariIni={hariIni} 
        onBukaKelas={setJadwalTerpilih} 
      />

      {jadwalTerpilih && (
        <ModalJurnal 
          jadwalTerpilih={jadwalTerpilih} 
          hariIni={hariIni} 
          onClose={() => setJadwalTerpilih(null)} 
        />
      )}
    </div>
  );
}