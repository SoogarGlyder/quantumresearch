"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react"; 
import { CldUploadWidget } from "next-cloudinary";
import { 
  FaCamera, FaFloppyDisk, FaImages, FaBookBookmark, 
  FaUserGraduate, FaXmark 
} from "react-icons/fa6";

import { simpanJurnalPengajar, ambilDetailJurnalPengajar } from "../../actions/teacherAction";
import { PREFIX_BARCODE, STATUS_SESI, LABEL_SISTEM } from "../../utils/constants"; 
import { formatTanggal } from "../../utils/formatHelper";

import styles from "../App.module.css";

export default function ModalJurnal({ jadwalTerpilih, hariIni, onClose }) {
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
    // 🚀 FIX: Inline Style Anti-Badai untuk Full Screen (Menutupi Navbar Bawah)
    <div className={styles.wrapperGallery} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      backgroundColor: '#f8fafc',
      overflowY: 'auto',
      paddingBottom: '40px'
    }}>
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