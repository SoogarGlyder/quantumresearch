"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react"; 
import { CldUploadWidget } from "next-cloudinary";
import { 
  FaCamera, FaFloppyDisk, FaImages, FaBookBookmark, 
  FaUserGraduate, FaXmark, FaFileSignature, FaListUl, FaTrashCan // 🚀 TAMBAHAN: Ikon baru
} from "react-icons/fa6";

import { simpanJurnalPengajar, ambilDetailJurnalPengajar } from "@/actions/teacherAction";
// 🚀 UBAH IMPORT: Masukkan fungsi Bank Soal, cabut ModalKuis
import { ambilKuisByJadwal, ambilSemuaBankSoal, terapkanBankSoalKeJadwal, hapusQuizDariJadwal } from "@/actions/quizAction"; 
import { PREFIX_BARCODE, STATUS_SESI, LABEL_SISTEM } from "@/utils/constants"; 
import { formatTanggal } from "@/utils/formatHelper";
import styles from "@/components/App.module.css";

// 🚀 HELPER: Konverter Tanggal iOS / WebKit Safe
const getSafeTanggalJakarta = (dateInput) => {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput.substring(0, 10);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return typeof dateInput === 'string' ? dateInput.substring(0, 10) : "";
  }
};

export default function ModalJurnal({ jadwalTerpilih, hariIni, onClose }) {
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [formJurnal, setFormJurnal] = useState({ bab: "", subBab: "", galeriPapan: "", fotoBersama: "" });
  const [dataSiswa, setDataSiswa] = useState([]); 
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [pesanJurnal, setPesanJurnal] = useState({ teks: "", tipe: "" });

  const [dataKuisAktif, setDataKuisAktif] = useState(null);
  const [isMemuatKuis, setIsMemuatKuis] = useState(false);

  // 🚀 STATE BARU KHUSUS BANK SOAL
  const [isModalBankOpen, setIsModalBankOpen] = useState(false);
  const [listBankSoal, setListBankSoal] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [isMemprosesKuis, setIsMemprosesKuis] = useState(false);

  const tanggalJadwalMurni = getSafeTanggalJakarta(jadwalTerpilih?.tanggal);
  
  const isMasaDepan = tanggalJadwalMurni > hariIni;
  const isHariIni = tanggalJadwalMurni === hariIni;
  const isMasaLalu = tanggalJadwalMurni < hariIni;

  useEffect(() => {
    let isMounted = true; 
    const fetchDetail = async () => {
      setLoadingDetail(true);
      setIsMemuatKuis(true); 
      
      const [hasilJurnal, hasilKuis] = await Promise.all([
        ambilDetailJurnalPengajar(jadwalTerpilih._id),
        ambilKuisByJadwal(jadwalTerpilih._id)
      ]);

      if (!isMounted) return;
      
      if (hasilJurnal.sukses && hasilJurnal.data) {
        const { jadwal: jdlServer, dataSiswa: listSiswa } = hasilJurnal.data;
        setFormJurnal({
          bab: jdlServer.bab || "",
          subBab: jdlServer.subBab || "",
          galeriPapan: jdlServer.galeriPapan?.join(",") || "",
          fotoBersama: jdlServer.fotoBersama || ""
        });
        setDataSiswa(listSiswa || []);
      } else {
        alert(hasilJurnal.pesan || "Gagal memuat data kelas.");
        onClose();
      }

      setDataKuisAktif(hasilKuis);
      setIsMemuatKuis(false);
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

  // 🚀 FUNGSI BARU: Buka Daftar Bank Soal
  const bukaPanelBankSoal = async () => {
    setIsModalBankOpen(true);
    setLoadingBank(true);
    // Ambil bank soal milik pengajar ini
    const data = await ambilSemuaBankSoal(jadwalTerpilih.pengajarId);
    setListBankSoal(data || []);
    setLoadingBank(false);
  };

  // 🚀 FUNGSI BARU: Eksekusi Terapkan Kuis ke Jadwal
  const handlePilihBankSoal = async (idBankSoal) => {
    if (!window.confirm("Yakin ingin menerapkan paket soal ini ke kelas ini?")) return;
    
    setIsMemprosesKuis(true);
    const res = await terapkanBankSoalKeJadwal(idBankSoal, jadwalTerpilih._id, jadwalTerpilih.pengajarId);
    
    if (res.sukses) {
      alert("✅ " + res.pesan);
      setIsModalBankOpen(false);
      // Refresh Data Kuis di Jurnal agar tampil
      const kuisBaru = await ambilKuisByJadwal(jadwalTerpilih._id);
      setDataKuisAktif(kuisBaru);
    } else {
      alert("❌ " + res.pesan);
    }
    setIsMemprosesKuis(false);
  };

  // 🚀 FUNGSI BARU: Lepas Kuis dari Jadwal
  const handleLepasKuis = async () => {
    if (!window.confirm("Yakin ingin membatalkan/melepas kuis dari kelas ini?")) return;
    
    setIsMemprosesKuis(true);
    const res = await hapusQuizDariJadwal(jadwalTerpilih._id);
    if (res.sukses) {
      alert("✅ " + res.pesan);
      setDataKuisAktif(null);
    } else {
      alert("❌ " + res.pesan);
    }
    setIsMemprosesKuis(false);
  };

  return (
    <div className={styles.wrapperGallery} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 99999, backgroundColor: '#f8fafc', overflowY: 'auto', paddingBottom: '40px'
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
              {/* INFO KELAS */}
              <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '4px solid #111827', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: 0, textTransform: 'uppercase' }}>{jadwalTerpilih.mapel}</h2>
                <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '14px', margin: '8px 0 0 0' }}>
                  {jadwalTerpilih.kelasTarget} <br/> 
                  <span style={{ color: '#111827' }}>{formatTanggal ? formatTanggal(jadwalTerpilih.tanggal) : jadwalTerpilih.tanggal} • {jadwalTerpilih.jamMulai} - {jadwalTerpilih.jamSelesai}</span>
                </p>
              </div>

              {isMasaDepan ? (
                // MASA DEPAN
                <div style={{ padding: '24px', backgroundColor: 'white', border: '4px dashed #94a3b8', borderRadius: '16px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#334155', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Fase Persiapan Kelas</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', margin: '0 0 24px 0' }}>Kelas ini belum dimulai. Anda dapat mempersiapkan Pre-Test besok.</p>

                  {/* 🚀 TOMBOL BARU MASA DEPAN */}
                  <button 
                    type="button" 
                    onClick={dataKuisAktif ? handleLepasKuis : bukaPanelBankSoal}
                    disabled={isMemuatKuis || isMemprosesKuis}
                    style={{ 
                      width: '100%', padding: '16px', border: '3px solid #111827', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: (isMemuatKuis || isMemprosesKuis) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '4px 4px 0 #111827',
                      backgroundColor: dataKuisAktif ? '#fca5a5' : '#3b82f6', color: dataKuisAktif ? '#111827' : 'white'
                    }}
                  >
                    {isMemuatKuis || isMemprosesKuis ? "MEMPROSES..." : (
                      dataKuisAktif ? <><FaTrashCan /> BATALKAN / LEPAS KUIS</> : <><FaListUl /> PILIH DARI BANK SOAL</>
                    )}
                  </button>
                  {dataKuisAktif && (
                    <p style={{ marginTop: '12px', fontWeight: 'bold', color: '#166534', fontSize: '14px' }}>✅ Kelas ini sudah dipasangkan paket soal ({dataKuisAktif.soal?.length || 0} Soal).</p>
                  )}
                </div>
              ) : (
                // HARI INI & LALU
                <>
                  {/* PANEL TOMBOL KUIS LAMA (DIGANTI KE MODE PILIH BANK) */}
                  <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ padding: '16px', border: '3px solid #111827', borderRadius: '12px', backgroundColor: dataKuisAktif ? '#dcfce3' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontWeight: '900', color: '#111827' }}>
                          <FaFileSignature /> {dataKuisAktif ? "KUIS CBT AKTIF" : "KUIS CBT KOSONG"}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 'bold' }}>
                          {isMemuatKuis ? "Memeriksa..." : (dataKuisAktif ? `Terpasang ${dataKuisAktif.soal?.length || 0} Soal (${dataKuisAktif.durasi || 10} Menit).` : "Belum ada paket soal yang dipasang.")}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {dataKuisAktif ? (
                          <button type="button" onClick={handleLepasKuis} disabled={isMemprosesKuis} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: '2px solid #111827', borderRadius: '8px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', boxShadow: '2px 2px 0 #111827' }}>
                            {isMemprosesKuis ? "..." : "LEPAS"}
                          </button>
                        ) : (
                          <button type="button" onClick={bukaPanelBankSoal} disabled={isMemprosesKuis} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: '2px solid #111827', borderRadius: '8px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', boxShadow: '2px 2px 0 #111827' }}>
                            {isMemprosesKuis ? "..." : "PASANG SOAL"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isHariIni && (
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                      <div style={{ background: 'white', padding: '16px', border: '4px solid #111827', borderRadius: '16px', display: 'inline-block', boxShadow: '8px 8px 0 #facc15' }}>
                        <QRCodeSVG value={`${PREFIX_BARCODE.KELAS}${jadwalTerpilih._id}`} size={180} level="H" />
                      </div>
                      <p style={{marginTop: '16px', fontSize: '14px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase'}}>Scan QR ini untuk Masuk Kelas!</p>
                    </div>
                  )}

                  {isMasaLalu && (
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
                      <h3 className={styles.contentTitle} style={{ margin: '0 0 10px 0' }}><FaUserGraduate color="#ef4444" /> 2. Manajemen Siswa</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {dataSiswa.length === 0 ? (
                        <div className={styles.emptySchedule}>TIDAK ADA DATA SISWA.</div>
                      ) : (
                        dataSiswa.map((siswa, idx) => {
                          const isBelum = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                          const butuhCatatan = [STATUS_SESI.SAKIT.id, STATUS_SESI.IZIN.id].includes(siswa.statusAbsen);
                          
                          return (
                            <div key={siswa.siswaId} style={{ background: isBelum ? '#fff' : '#dcfce3', padding: '16px', borderRadius: '12px', border: '3px solid #111827', boxShadow: '4px 4px 0 #111827' }}>
                              <p style={{ fontWeight: '900', margin: '0 0 8px 0', fontSize: '15px', color: '#111827', textTransform: 'uppercase' }}>{siswa.nama}</p>
                              
                              <div style={{ display: 'flex', gap: '8px', marginBottom: butuhCatatan ? '10px' : '0' }}>
                                <select value={siswa.statusAbsen} onChange={(e) => ubahStatusSiswa(idx, e.target.value)} className={styles.scheduleOption} style={{ flex: 1, padding: '10px', backgroundColor: isBelum ? '#fef08a' : '#fff', boxShadow: 'none', border: '2px solid #111827' }}>
                                  <option value={LABEL_SISTEM.BELUM_ABSEN}>⚠️ BELUM ABSEN</option>
                                  <option value={STATUS_SESI.SELESAI.id}>✅ HADIR</option>
                                  <option value={STATUS_SESI.ALPA.id}>❌ ALPA</option>
                                  <option value={STATUS_SESI.SAKIT.id}>🤒 SAKIT</option>
                                  <option value={STATUS_SESI.IZIN.id}>💌 IZIN</option>
                                </select>
                                
                                <input type="number" placeholder="NILAI" value={siswa.nilaiTest === null ? "" : siswa.nilaiTest} onChange={(e) => ubahNilaiSiswa(idx, e.target.value)} disabled={siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN || siswa.statusAbsen === STATUS_SESI.ALPA.id} className={styles.scheduleOption} style={{ width: '80px', padding: '10px', textAlign: 'center', boxShadow: 'none', border: '2px solid #111827' }} />
                              </div>

                              {/* 🚀 FITUR CATATAN SISWA AMAN TERKENDALI */}
                              {butuhCatatan && (
                                <input 
                                  type="text" 
                                  placeholder="Keterangan Sakit/Izin (Cth: Sakit Demam)" 
                                  value={siswa.catatan || ""} 
                                  onChange={(e) => ubahCatatanSiswa(idx, e.target.value)}
                                  className={styles.scheduleOption} 
                                  style={{ width: '100%', padding: '10px', backgroundColor: '#fff', boxShadow: 'none', border: '2px solid #111827', fontSize: '13px' }} 
                                />
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
            </>
          )}
        </div>
      </div>

      {/* 🚀 OVERLAY MODAL PILIH BANK SOAL (PENGGANTI MODAL KUIS BUILDER) */}
      {isModalBankOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '4px solid #111827', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '8px 8px 0 #111827' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #111827', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontWeight: '900', color: '#111827' }}>PILIH PAKET SOAL</h2>
              <button onClick={() => setIsModalBankOpen(false)} style={{ background: 'white', border: '3px solid #111827', borderRadius: '8px', padding: '6px', cursor: 'pointer', boxShadow: '2px 2px 0 #ef4444' }}>
                <FaXmark size={20} color="#ef4444" />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingBank ? (
                <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Memuat Bank Soal...</p>
              ) : listBankSoal.length === 0 ? (
                <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>Belum ada Master Soal. Silakan buat di Tab Tugas/Bank Soal terlebih dahulu.</p>
              ) : (
                listBankSoal.map((bank) => (
                  <div key={bank._id} style={{ background: 'white', border: '3px solid #111827', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '4px 4px 0 #cbd5e1' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: '900', color: '#111827', fontSize: '16px' }}>{bank.judul || "Tanpa Judul"}</h4>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>{bank.soal?.length || 0} Soal • {bank.durasi || 10} Menit</p>
                    </div>
                    <button 
                      onClick={() => handlePilihBankSoal(bank._id)} 
                      disabled={isMemprosesKuis}
                      style={{ padding: '10px 16px', background: '#22c55e', color: '#111827', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: isMemprosesKuis ? 'wait' : 'pointer' }}
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

    </div>
  );
}