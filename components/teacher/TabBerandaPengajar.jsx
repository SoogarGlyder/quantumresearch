"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react"; 
import { CldUploadWidget } from "next-cloudinary";
import { 
  FaClock, FaCircleXmark, FaCamera, FaFloppyDisk, 
  FaCheckDouble, FaImages, FaChalkboard, FaCalendarCheck,
  FaBookBookmark, FaUserGraduate
} from "react-icons/fa6";

import { simpanJurnalPengajar, ambilDetailJurnalPengajar } from "../../actions/teacherAction";
import { PREFIX_BARCODE, PERIODE_BELAJAR, STATUS_SESI, LABEL_SISTEM } from "../../utils/constants"; 
import { timeHelper } from "../../utils/timeHelper";
import { formatTanggal } from "../../utils/formatHelper";

import styles from "../TeacherApp.module.css";

export default function TabBerandaPengajar({ dataUser, jadwal = [] }) {
  const hariIni = timeHelper.getTglJakarta();

  // --- STATE JADWAL & JURNAL ---
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [formJurnal, setFormJurnal] = useState({ bab: "", subBab: "", galeriPapan: "", fotoBersama: "" });
  const [dataSiswa, setDataSiswa] = useState([]); 
  
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [pesanJurnal, setPesanJurnal] = useState({ teks: "", tipe: "" });

  // --- PEMILAHAN JADWAL ---
  const jadwalHariIni = useMemo(() => {
    return (jadwal || []).filter(j => j?.tanggal === hariIni);
  }, [jadwal, hariIni]);

  const jadwalSemua = useMemo(() => {
    return (jadwal || [])
      .filter(j => j.tanggal >= PERIODE_BELAJAR.MULAI && j.tanggal <= PERIODE_BELAJAR.AKHIR)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [jadwal]);

  const statsPengajar = useMemo(() => {
    const totalKelas = (jadwal || []).length;
    const jurnalSelesai = (jadwal || []).filter(j => j?.bab).length;
    return { totalKelas, jurnalSelesai };
  }, [jadwal]);

  // --- HANDLER: BUKA DETAIL JADWAL ---
  const klikBukaKelas = async (j) => {
    setLoadingDetail(true);
    setJadwalTerpilih(j); 
    
    const hasil = await ambilDetailJurnalPengajar(j._id);
    
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
      setJadwalTerpilih(null);
    }
    setLoadingDetail(false);
  };

  // --- HANDLER: UBAH DATA SISWA (ADMIN MINI) ---
  const ubahStatusSiswa = (idx, statusBaru) => {
    const newData = [...dataSiswa];
    newData[idx].statusAbsen = statusBaru;
    // Bersihkan catatan jika diubah ke Hadir/Alpa
    if (statusBaru === STATUS_SESI.SELESAI.id || statusBaru === STATUS_SESI.ALPA.id || statusBaru === LABEL_SISTEM.BELUM_ABSEN) {
      newData[idx].catatan = "";
    }
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

  // --- HANDLER: SIMPAN JURNAL & ABSENSI ---
  const klikSimpanJurnal = async (e) => {
    e.preventDefault();
    if (!jadwalTerpilih?._id) return;

    setLoadingJurnal(true);
    setPesanJurnal({ teks: "MENYIMPAN DATA...", tipe: "loading" });

    const hasil = await simpanJurnalPengajar(jadwalTerpilih._id, formJurnal, dataSiswa);
    
    setPesanJurnal({ teks: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
    setLoadingJurnal(false);
    
    if (hasil.sukses) {
      setTimeout(() => {
        setJadwalTerpilih(null);
        setPesanJurnal({ teks: "", tipe: "" });
      }, 2500);
    }
  };

  return (
    <div className={styles.contentArea}>
      
      {/* ========================================================= */}
      {/* 1. HEADER & STATISTIK PENGGUNA (Neo-Brutalism) */}
      {/* ========================================================= */}
      <div className={styles.appHeader}>
        <div className={styles.shapeRed}></div>
        <div className={styles.shapeYellow}></div>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
          </div>
        </div>
        
        <div className={styles.identityContainer}>
          <div>
            <p className={styles.welcomeText}>Selamat mengajar!</p>
            <h1 className={styles.userName}>{dataUser?.nama || "Pengajar Quantum"}</h1>
          </div>
          <div className={styles.containerIdNumber}>
             <span className={styles.IdNumber}>ID: {dataUser?.kodePengajar || dataUser?.nomorPeserta || "Staff"}</span>
          </div>
        </div>

        <div className={styles.infoContainer} style={{ marginBottom: '0', marginTop: '24px' }}>
           <h2 className={styles.infoHeader}>Ringkasan Mengajar</h2>
           <div className={styles.statGridContainer}>
              <div className={styles.statContainer}>
                <span className={styles.statLabel}>📚 Total Sesi</span>
                <span className={`${styles.statValue} ${styles.nilaiStatBiru}`}>{statsPengajar.totalKelas}</span>
              </div>
              <div className={styles.statContainer}>
                <span className={styles.statLabel}>📝 Jurnal OK</span>
                <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>{statsPengajar.jurnalSelesai}</span>
              </div>
           </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. AREA KONTEN (DETAIL KELAS VS DAFTAR KELAS) */}
      {/* ========================================================= */}
      <div style={{ padding: '32px 16px' }}>
        
        {jadwalTerpilih ? (
          
          /* --- TAMPILAN DETAIL KELAS & FORM JURNAL --- */
          <div className={styles.infoContainer}>
            
            {loadingDetail ? (
              <div className={styles.kotakPesanLoading} style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '12px' }}>
                <h3 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase' }}>Menyiapkan Kelas...</h3>
              </div>
            ) : (
              <>
                {/* INFO KELAS */}
                <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '4px solid #111827', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: 0, textTransform: 'uppercase' }}>{jadwalTerpilih.mapel}</h2>
                  <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '14px', margin: '8px 0 0 0' }}>
                    {jadwalTerpilih.kelasTarget} <br/> 
                    <span style={{ color: '#111827' }}>{formatTanggal ? formatTanggal(jadwalTerpilih.tanggal) : jadwalTerpilih.tanggal} • {jadwalTerpilih.jamMulai} - {jadwalTerpilih.jamSelesai}</span>
                  </p>
                </div>

                {/* QR CODE ABSENSI (Hanya tampil mencolok jika kelas hari ini) */}
                {jadwalTerpilih.tanggal === hariIni && (
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ background: 'white', padding: '16px', border: '4px solid #111827', borderRadius: '16px', display: 'inline-block', boxShadow: '8px 8px 0 #facc15' }}>
                      <QRCodeSVG value={`${PREFIX_BARCODE.KELAS}${jadwalTerpilih.mapel.toUpperCase()}`} size={180} level="H" />
                    </div>
                    <p style={{marginTop: '16px', fontSize: '14px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase'}}>
                      Arahkan siswa untuk scan QR ini!
                    </p>
                  </div>
                )}

                {/* Peringatan jika membuka jadwal masa lalu */}
                {jadwalTerpilih.tanggal < hariIni && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#fef08a', border: '4px solid #111827', boxShadow: '4px 4px 0 #111827', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: '900', color: '#111827', margin: 0, textTransform: 'uppercase' }}>
                      ⚠️ Kelas Berlalu. QR Code Mati. Anda hanya dapat merevisi jurnal & absensi.
                    </p>
                  </div>
                )}

                <form onSubmit={klikSimpanJurnal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* --- BAGIAN: MATERI & FOTO --- */}
                  <h3 className={styles.contentTitle} style={{ margin: 0 }}>
                    <FaBookBookmark color="#2563eb" /> 1. Laporan Materi
                  </h3>
                  
                  <input className={styles.opsiMapel} placeholder="Bab Materi (Contoh: Aljabar)" required value={formJurnal.bab} onChange={e => setFormJurnal(prev => ({...prev, bab: e.target.value}))} />
                  <textarea className={styles.opsiMapel} placeholder="Detail Sub-bab (Contoh: Persamaan Linear)" rows={3} required value={formJurnal.subBab} onChange={e => setFormJurnal(prev => ({...prev, subBab: e.target.value}))} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    
                    {/* 🚀 TOMBOL UPLOAD PAPAN (DIUPGRADE MULTIPLE & ANTI OVERWRITE) */}
                    <CldUploadWidget 
                      uploadPreset="quantum_unsigned" 
                      options={{ multiple: true }} 
                      onSuccess={res => {
                        setFormJurnal(prev => {
                          const linkLama = prev.galeriPapan ? prev.galeriPapan + "," : "";
                          return { ...prev, galeriPapan: linkLama + res.info.secure_url };
                        });
                      }}
                    >
                      {({ open }) => (
                        <button type="button" onClick={() => open()} className={styles.opsiMapel} style={{ background: formJurnal.galeriPapan ? '#dcfce3' : '#f3f4f6', cursor: 'pointer', textAlign: 'center' }}>
                          <FaImages size={20} style={{marginBottom: '8px'}} /> <br/> 
                          {formJurnal.galeriPapan ? `PAPAN OK (${formJurnal.galeriPapan.split(',').length})` : 'FOTO PAPAN'}
                        </button>
                      )}
                    </CldUploadWidget>

                    {/* 🚀 TOMBOL UPLOAD KELAS (FOTO BERSAMA, DIUPGRADE ANTI OVERWRITE) */}
                    <CldUploadWidget 
                      uploadPreset="quantum_unsigned" 
                      onSuccess={res => {
                        setFormJurnal(prev => ({ ...prev, fotoBersama: res.info.secure_url }));
                      }}
                    >
                      {({ open }) => (
                        <button type="button" onClick={() => open()} className={styles.opsiMapel} style={{ background: formJurnal.fotoBersama ? '#dcfce3' : '#f3f4f6', cursor: 'pointer', textAlign: 'center' }}>
                          <FaCamera size={20} style={{marginBottom: '8px'}} /> <br/> {formJurnal.fotoBersama ? 'KELAS OK' : 'FOTO KELAS'}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>

                  {/* --- BAGIAN: ADMIN MINI (ABSENSI & NILAI) --- */}
                  <div style={{ borderTop: '4px solid #111827', paddingTop: '20px', marginTop: '8px' }}>
                    <h3 className={styles.contentTitle} style={{ margin: 0 }}>
                      <FaUserGraduate color="#ef4444" /> 2. Manajemen Siswa
                    </h3>
                    <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', fontWeight: '800' }}>
                      Edit absen manual & beri catatan jika diperlukan.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dataSiswa.length === 0 ? (
                      <div className={styles.emptySchedule}>
                        TIDAK ADA DATA SISWA.
                      </div>
                    ) : (
                      dataSiswa.map((siswa, idx) => {
                        const isBelum = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                        return (
                          <div key={siswa.siswaId} style={{ 
                            background: isBelum ? '#fff' : '#dcfce3', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            border: '3px solid #111827',
                            boxShadow: '4px 4px 0 #111827'
                          }}>
                            <p style={{ fontWeight: '900', margin: '0 0 8px 0', fontSize: '15px', color: '#111827', textTransform: 'uppercase' }}>{siswa.nama}</p>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <select 
                                value={siswa.statusAbsen} 
                                onChange={(e) => ubahStatusSiswa(idx, e.target.value)} 
                                className={styles.opsiMapel}
                                style={{ flex: 1, padding: '10px', backgroundColor: isBelum ? '#fef08a' : '#fff', boxShadow: 'none', border: '2px solid #111827' }}
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
                                disabled={siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN || siswa.statusAbsen === STATUS_SESI.ALPA.id}
                                className={styles.opsiMapel}
                                style={{ width: '80px', padding: '10px', textAlign: 'center', boxShadow: 'none', border: '2px solid #111827' }} 
                              />
                            </div>
                            
                            {/* 🚀 BARU: CATATAN OPSIONAL */}
                            {!isBelum && (siswa.statusAbsen === STATUS_SESI.SAKIT.id || siswa.statusAbsen === STATUS_SESI.IZIN.id) && (
                              <input 
                                type="text"
                                placeholder="Catatan opsional (Cth: Tipes / Acara Keluarga)"
                                value={siswa.catatan || ""}
                                onChange={(e) => ubahCatatanSiswa(idx, e.target.value)}
                                className={styles.opsiMapel}
                                style={{ width: '100%', padding: '10px', marginTop: '8px', fontSize: '12px', boxShadow: 'none', border: '2px dashed #111827' }}
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* PESAN & TOMBOL SUBMIT */}
                  {pesanJurnal.teks && (
                    <div className={pesanJurnal.tipe === 'loading' ? styles.kotakPesanLoading : ''} style={{ padding: '16px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', textAlign: 'center', color: '#111827', backgroundColor: pesanJurnal.tipe === 'sukses' ? '#4ade80' : pesanJurnal.tipe === 'error' ? '#fca5a5' : '#fef08a', border: '3px solid #111827', textTransform: 'uppercase' }}>
                      {pesanJurnal.teks}
                    </div>
                  )}

                  <button type="submit" disabled={loadingJurnal} className={styles.tombolSimpanBiruBaru} style={{ width: '100%', padding: '18px', fontSize: '18px', marginTop: '8px' }}>
                    <FaFloppyDisk /> {loadingJurnal ? 'PROSES...' : 'SIMPAN JURNAL'}
                  </button>
                </form>
              </>
            )}

            <button onClick={() => setJadwalTerpilih(null)} className={styles.tombolLogout} style={{ marginTop: '20px', backgroundColor: 'white', color: '#111827' }}>
              BATAL & KEMBALI
            </button>
          </div>
          
        ) : (
          
          /* --- TAMPILAN DAFTAR KELAS (AGENDA & ARSIP) --- */
          <>
            {/* AGENDA HARI INI */}
            <h3 className={styles.contentTitle}><FaChalkboard color="#2563eb" /> Agenda Hari Ini</h3>
            {jadwalHariIni.length === 0 ? (
              <p className={styles.emptySchedule}>TIDAK ADA KELAS. ISTIRAHAT! ☕</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {jadwalHariIni.map((j) => (
                  <div key={j._id} onClick={() => klikBukaKelas(j)} className={styles.scheduleCard} style={{ backgroundColor: j.bab ? '#dcfce3' : '#white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>{j.mapel}</h4>
                         <span style={{ fontSize: '14px', fontWeight: '900', color: '#2563eb' }}>{j.kelasTarget} <span style={{color: '#111827'}}>• {j.jamMulai}</span></span>
                       </div>
                       <div style={{ background: j.bab ? '#15803d' : '#facc15', color: '#111827', padding: '10px 14px', borderRadius: '12px', fontWeight: '900', fontSize: '12px', border: '3px solid #111827', boxShadow: '3px 3px 0 #111827' }}>
                          {j.bab ? <><FaCheckDouble/> OK</> : "BUKA"}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ARSIP JADWAL MENGAJAR (30 HARI) */}
            <div style={{ marginTop: '48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '4px solid #111827', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 className={styles.contentTitle} style={{ margin: 0 }}><FaCalendarCheck color="#10b981" /> Arsip 30 Hari</h3>
              </div>
              
              {jadwalSemua.length === 0 ? (
                <p className={styles.emptySchedule}>BELUM ADA DATA.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {jadwalSemua.map((j) => {
                    const isSelesai = !!j.bab;
                    const isMasaLalu = j.tanggal < hariIni;
                    const isHariIni = j.tanggal === hariIni;
                    const isMasaDepan = j.tanggal > hariIni;

                    // Neo-Brutalism Setup untuk List Bawah
                    let bgColor = 'white';
                    let cursorStyle = 'pointer';
                    let opacityValue = 1;
                    let handleClick = () => klikBukaKelas(j);
                    
                    let statusText = isSelesai ? 'JURNAL OK' : 'PENDING';
                    let statusBg = isSelesai ? '#4ade80' : '#fca5a5';

                    if (isHariIni) {
                      bgColor = '#fef08a'; // Kuning brutal
                      cursorStyle = 'not-allowed';
                      handleClick = undefined; 
                      statusText = 'LIHAT ATAS';
                      statusBg = '#111827';
                    } else if (isMasaDepan) {
                      bgColor = '#e5e7eb';
                      cursorStyle = 'not-allowed';
                      handleClick = undefined; 
                      statusText = 'BELUM MULAI';
                      statusBg = '#9ca3af';
                    }

                    return (
                      <div key={j._id} onClick={handleClick} className={styles.infoContainer} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bgColor, cursor: cursorStyle, boxShadow: '4px 4px 0 #111827' }}>
                        <div>
                           <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>{j.mapel} <span style={{fontSize: '12px', color: '#2563eb'}}>({j.kelasTarget})</span></p>
                           <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: '900', color: '#4b5563' }}>
                             {formatTanggal ? formatTanggal(j.tanggal) : j.tanggal} • {j.jamMulai}
                           </p>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: isHariIni ? 'white' : '#111827', padding: '6px 10px', borderRadius: '8px', background: statusBg, border: '2px solid #111827' }}>
                          {statusText}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}