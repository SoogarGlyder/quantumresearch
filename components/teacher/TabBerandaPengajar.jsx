"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react"; 
import { CldUploadWidget } from "next-cloudinary";
import { 
  FaClock, FaCircleXmark, FaCamera, FaFloppyDisk, 
  FaCheckDouble, FaImages, FaChalkboard, FaCalendarCheck,
  FaBookBookmark, FaCircleInfo
} from "react-icons/fa6";

import { simpanJurnalPengajar } from "../../actions/teacherAction";
import { PREFIX_BARCODE } from "../../utils/constants"; // 👈 Import Konstanta
import { timeHelper } from "../../utils/timeHelper";     // 👈 Import Helper

import styles from "../TeacherApp.module.css";

export default function TabBerandaPengajar({ dataUser, jadwal = [] }) {
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  const [formJurnal, setFormJurnal] = useState({ bab: "", subBab: "", galeriPapan: "", fotoBersama: "" });
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [pesanJurnal, setPesanJurnal] = useState({ teks: "", tipe: "" });

  const jadwalHariIni = useMemo(() => {
    const hariIni = timeHelper.getTglJakarta(); // 👈 Zero Hardcode Timezone
    return (jadwal || []).filter(j => j?.tanggal === hariIni);
  }, [jadwal]);

  const statsPengajar = useMemo(() => {
    const totalKelas = (jadwal || []).length;
    const jurnalSelesai = (jadwal || []).filter(j => j?.bab).length;
    return { totalKelas, jurnalSelesai };
  }, [jadwal]);

  const klikSimpanJurnal = async (e) => {
    e.preventDefault();
    if (!jadwalTerpilih?._id) return;

    setLoadingJurnal(true);
    setPesanJurnal({ teks: "Mengamankan data...", tipe: "loading" });

    const hasil = await simpanJurnalPengajar(jadwalTerpilih._id, formJurnal);
    setPesanJurnal({ teks: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
    setLoadingJurnal(false);
    
    if (hasil.sukses) {
      setTimeout(() => {
        setJadwalTerpilih(null);
        setPesanJurnal({ teks: "", tipe: "" });
      }, 2000);
    }
  };

  useEffect(() => {
    if (jadwalTerpilih) {
      setFormJurnal({
        bab: jadwalTerpilih.bab || "",
        subBab: jadwalTerpilih.subBab || "",
        galeriPapan: jadwalTerpilih.galeriPapan || "",
        fotoBersama: jadwalTerpilih.fotoBersama || ""
      });
    }
  }, [jadwalTerpilih]);

  return (
    <div className={styles.areaKontenBeranda}>
      {/* ... (Header Tetap Sama) ... */}
      <div className={styles.headerBeranda} style={{ paddingBottom: '40px' }}>
        <div className={styles.hiasanBulat1}></div>
        <div className={styles.hiasanBulat2}></div>
        <div className={styles.wadahLogoTengah}>
          <div className={styles.kotakLogo}>
            <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} className={styles.logoScannerPudar} priority />
          </div>
        </div>
        
        <div className={styles.barisSapaan}>
          <div>
            <p className={styles.teksSapaanKecil}>Selamat mengajar!</p>
            <h1 className={styles.teksNamaBesar}>{dataUser?.nama || "Pengajar Quantum"}</h1>
          </div>
          <div className={styles.badgeUser} style={{ background: '#2563eb' }}>
             <span className={styles.teksBadge} style={{ color: 'white' }}>ID: {dataUser?.nomorPeserta || "Staff"}</span>
          </div>
        </div>

        <div className={styles.kartuInfo} style={{ marginBottom: '0', marginTop: '-16px', zIndex: 20, position: 'relative' }}>
           <h2 className={styles.judulInfo}>Ringkasan Mengajar</h2>
           <div className={styles.wadahGridStat}>
              <div className={styles.kotakStat}>
                <span className={styles.labelStat}>📚 Total Sesi</span>
                <span className={`${styles.nilaiStat} ${styles.nilaiStatBiru}`}>{statsPengajar.totalKelas}</span>
              </div>
              <div className={styles.kotakStat}>
                <span className={styles.labelStat}>📝 Jurnal</span>
                <span className={`${styles.nilaiStat} ${styles.nilaiStatHijau}`}>{statsPengajar.jurnalSelesai}</span>
              </div>
           </div>
        </div>
      </div>

      <div style={{ padding: '40px 16px 32px 16px' }}>
        {jadwalTerpilih ? (
          <div className={styles.kartuInfo} style={{ border: '4px solid #111827', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', margin: 0 }}>{jadwalTerpilih.mapel}</h2>
              <p style={{ fontWeight: '800', color: '#64748b' }}>{jadwalTerpilih.kelasTarget} • {jadwalTerpilih.jamMulai} - {jadwalTerpilih.jamSelesai}</p>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ background: 'white', padding: '16px', border: '4px solid #111827', borderRadius: '16px', display: 'inline-block', boxShadow: '6px 6px 0 #fef08a' }}>
                {/* 🛡️ PERBAIKAN: Format QR disamakan dengan scanAction (QR-KLS-MAPEL) */}
                <QRCodeSVG value={`${PREFIX_BARCODE.KELAS}${jadwalTerpilih.mapel.toUpperCase()}`} size={180} level="H" />
              </div>
              <p style={{marginTop: '8px', fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>Arahkan siswa untuk scan QR ini.</p>
            </div>

            <form onSubmit={klikSimpanJurnal} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '3px dashed #111827', paddingTop: '20px' }}>
              <h3 style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '14px' }}><FaBookBookmark /> Isi Jurnal Mengajar</h3>
              
              <input className={styles.opsiMapel} placeholder="Bab Materi..." required value={formJurnal.bab} onChange={e => setFormJurnal({...formJurnal, bab: e.target.value})} />
              <textarea className={styles.opsiMapel} placeholder="Detail Sub-bab..." rows={2} required value={formJurnal.subBab} onChange={e => setFormJurnal({...formJurnal, subBab: e.target.value})} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <CldUploadWidget uploadPreset="quantum_unsigned" onSuccess={res => setFormJurnal({...formJurnal, galeriPapan: res.info.secure_url})}>
                  {({ open }) => (
                    <button type="button" onClick={() => open()} className={styles.tombolTabScan} style={{ background: formJurnal.galeriPapan ? '#dcfce3' : '#f3f4f6', height: 'auto', padding: '10px' }}>
                      <FaImages /> {formJurnal.galeriPapan ? 'Papan OK' : 'Foto Papan'}
                    </button>
                  )}
                </CldUploadWidget>

                <CldUploadWidget uploadPreset="quantum_unsigned" onSuccess={res => setFormJurnal({...formJurnal, fotoBersama: res.info.secure_url})}>
                  {({ open }) => (
                    <button type="button" onClick={() => open()} className={styles.tombolTabScan} style={{ background: formJurnal.fotoBersama ? '#dcfce3' : '#f3f4f6', height: 'auto', padding: '10px' }}>
                      <FaCamera /> {formJurnal.fotoBersama ? 'Kelas OK' : 'Foto Kelas'}
                    </button>
                  )}
                </CldUploadWidget>
              </div>

              {pesanJurnal.teks && (
                <div style={{ padding: '10px', borderRadius: '8px', fontWeight: '900', fontSize: '12px', textAlign: 'center', backgroundColor: pesanJurnal.tipe === 'sukses' ? '#dcfce3' : '#fef08a' }}>
                  {pesanJurnal.teks}
                </div>
              )}

              <button type="submit" disabled={loadingJurnal} className={styles.tombolSimpanBiruBaru} style={{ width: '100%', padding: '14px' }}>
                <FaFloppyDisk /> {loadingJurnal ? 'Proses...' : 'Simpan Jurnal'}
              </button>
            </form>

            <button onClick={() => setJadwalTerpilih(null)} style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'none', border: 'none', fontWeight: '900', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer' }}>
              Kembali ke Daftar Kelas
            </button>
          </div>
        ) : (
          <>
            <h3 className={styles.judulJadwal}><FaChalkboard color="#2563eb" /> Agenda Hari Ini</h3>
            {jadwalHariIni.length === 0 ? (
              <p className={styles.jadwalKosong}>Tidak ada jadwal mengajar hari ini. Waktunya istirahat! ☕</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {jadwalHariIni.map((j) => (
                  <div key={j._id} onClick={() => setJadwalTerpilih(j)} className={styles.kartuJadwalPintar} style={{ cursor: 'pointer', backgroundColor: j.bab ? '#dcfce3' : '#fdfbf7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{j.mapel}</h4>
                         <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>{j.kelasTarget} • {j.jamMulai}-{j.jamSelesai}</span>
                       </div>
                       <div style={{ background: j.bab ? '#22c55e' : '#111827', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '11px' }}>
                          {j.bab ? <FaCheckDouble /> : "BUKA QR"}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}