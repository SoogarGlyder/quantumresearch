"use client";

import { useState, useEffect } from "react";
import { FaXmark, FaDownload, FaSpinner } from "react-icons/fa6";
import { toPng } from 'html-to-image'; // 🚀 Senjata Baru
import { ambilLaporanBulananSiswa } from "../../actions/adminAction";
import { formatJam } from "../../utils/formatHelper";
import { STATUS_SESI } from "../../utils/constants";
import cetakStyles from "../../app/admin/LaporanCetak.module.css";

export default function ModalRaporSiswa({ siswa, onClose }) {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [dataRapor, setDataRapor] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [sedangMencetak, setSedangMencetak] = useState(false);

  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const formatHariTanggalKhusus = (tglString) => {
    if (!tglString) return "-";
    const d = new Date(tglString);
    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return `${namaHari[d.getDay()]}, Tanggal ${d.getDate()}`;
  };

  const tarikDataRapor = async () => {
    setLoadingData(true);
    const res = await ambilLaporanBulananSiswa(siswa._id, bulan, tahun);
    if (res.sukses) setDataRapor(res.data);
    setLoadingData(false);
  };

  useEffect(() => { if (siswa) tarikDataRapor(); }, [siswa, bulan, tahun]);

  const cetakGambar = async () => {
    setSedangMencetak(true);
    try {
      const elemenLaporan = document.getElementById("wrapper-kertas-rapor");
      
      // 🚀 PROSES HTML-TO-IMAGE (Lebih Akurat & Tajam)
      const dataUrl = await toPng(elemenLaporan, { 
        quality: 1.0, 
        backgroundColor: "#fdfbf7",
        pixelRatio: 2 // Kualitas High Definition
      });
      
      const link = document.createElement("a");
      link.download = `Rapor_${siswa.nama.replace(/\s+/g, '_')}_${namaBulan[bulan-1]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { 
      console.error(err);
      alert("Gagal mencetak rapor."); 
    } finally { 
      setSedangMencetak(false); 
    }
  };

  if (!siswa) return null;

  // REKAPITULASI
  const kelasHadir = dataRapor?.kelas.filter(k => k.status === STATUS_SESI.SELESAI.id).length || 0;
  const kelasIzin = dataRapor?.kelas.filter(k => k.status !== STATUS_SESI.SELESAI.id).length || 0;
  const totalExtraKelas = dataRapor?.kelas.reduce((sum, k) => sum + (k.konsulExtraMenit || 0), 0) || 0;
  const totalMenitKonsul = dataRapor?.konsul.reduce((sum, k) => {
    if (k.waktuMulai && k.waktuSelesai) {
      return sum + Math.max(0, Math.round((new Date(k.waktuSelesai) - new Date(k.waktuMulai)) / 60000));
    }
    return sum;
  }, 0) || 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17,24,39,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', padding: '40px 20px' }}>
      
      {/* 1. PANEL KONTROL */}
      <div style={{ background: 'white', border: '4px solid #111827', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '980px', marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '8px 8px 0 #facc15', zIndex: 10 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 900 }}>{siswa.nama}</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Pilih periode bulan sebelum mengunduh.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={{ padding: '10px', border: '2px solid #111827', borderRadius: '8px', fontWeight: 'bold' }}>
            {namaBulan.map((nm, idx) => <option key={nm} value={idx + 1}>{nm}</option>)}
          </select>
          <select value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ padding: '10px', border: '2px solid #111827', borderRadius: '8px', fontWeight: 'bold' }}>
            <option value={2026}>2026</option>
          </select>
        </div>
        <button onClick={cetakGambar} disabled={loadingData || sedangMencetak || !dataRapor} style={{ background: '#2563eb', color: 'white', padding: '12px 24px', border: '3px solid #111827', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sedangMencetak ? <FaSpinner className="spinAnimation" /> : <FaDownload />} Download Gambar Rapor
        </button>
        <button onClick={onClose} style={{ background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}><FaXmark /></button>
      </div>

      {/* 2. AREA KERTAS */}
      {loadingData ? (
        <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}><FaSpinner className="spinAnimation" style={{fontSize: '40px'}} /></div>
      ) : dataRapor ? (
        <div id="wrapper-kertas-rapor" style={{ background: '#fdfbf7', padding: '40px', borderRadius: '20px', flexShrink: 0 }}>
          <div className={cetakStyles.kertasPortrait}>
            
            {/* CONTAINER 1: LOGO & JUDUL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <img src="/logo-qr-persegi.png" alt="Logo" style={{ height: '90px', borderRight: '3px solid #111827', paddingRight: '15px'}} />
              <div>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#111827' }}>LAPORAN BULANAN BELAJAR SISWA</h1>
                <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#4b5563' }}>Bimbingan Belajar Quantum Research Cempaka Putih</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>Jalan Cempaka Putih Tengah XV No.05</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>021 2169 0016 | 0896 9612 9658</p>
              </div>
            </div>

            <div style={{ borderBottom: '5px solid #111827', marginBottom: '20px' }}></div>

            {/* CONTAINER 2: DATA SISWA (DI BAWAH LOGO) */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#111827', display: 'flex', flexWrap: 'wrap' }}>
                  {/* 🛡️ Taktik Jembatan Spasi Fisik */}
                  {dataRapor.profil.nama.toUpperCase().split(/\s+/).map((kata, idx, arr) => (
                    <span key={idx} style={{ display: 'inline-block' }}>
                      {kata}{idx < arr.length - 1 && <span style={{ display: 'inline-block', width: '10px' }} />}
                    </span>
                  ))}
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#4b5563', fontWeight: 'bold' }}>
                  ID Siswa: <strong style={{color: '#111827'}}>{dataRapor.profil.nomorPeserta}</strong>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#4b5563', fontWeight: 'bold' }}>
                  Program: <strong style={{color: '#111827'}}> Kelas {dataRapor.profil.kelas || "-"}</strong>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#4b5563', fontWeight: 'bold' }}>
                  Periode: <strong style={{color: '#111827'}}> {namaBulan[bulan-1]} {tahun}</strong>
                </p>
            </div>

            <div style={{ borderBottom: '5px solid #111827', marginBottom: '32px' }}></div>

            {/* PRESENSI KELAS */}
            <div className={cetakStyles.blokTabel}>
              <h2 className={cetakStyles.judulKolom}>📘 Presensi Kelas Reguler</h2>
              <div className={cetakStyles.summaryBox}>
                <div className={cetakStyles.summaryItem}><span>Jadwal</span><strong>{dataRapor.kelas.length} Sesi</strong></div>
                <div className={cetakStyles.summaryItem}><span className={cetakStyles.teksHijau}>Hadir</span><strong>{kelasHadir}</strong></div>
                <div className={cetakStyles.summaryItem}><span className={cetakStyles.teksMerah}>Izin/Lainnya</span><strong>{kelasIzin}</strong></div>
                <div className={cetakStyles.summaryItem}><span className={cetakStyles.teksBiru}>Extra Belajar</span><strong>{totalExtraKelas}m</strong></div>
              </div>
              <table className={cetakStyles.tabelRapor}>
                <thead>
                  <tr>
                    <th className={cetakStyles.colTgl}>Tanggal</th>
                    <th className={cetakStyles.colMapel}>Mapel</th>
                    <th className={cetakStyles.colWaktu} style={{textAlign: 'center'}}>Waktu</th>
                    <th className={cetakStyles.colStatus} style={{textAlign: 'center'}}>Status</th>
                    <th className={cetakStyles.colCatatan}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRapor.kelas.map(k => {
                    const isHadir = k.status === STATUS_SESI.SELESAI.id;
                    return (
                      <tr key={k._id}>
                        <td className={cetakStyles.teksTebal}>{formatHariTanggalKhusus(k.waktuMulai)}</td>
                        <td>{k.namaMapel}</td>
                        <td style={{textAlign:'center', fontSize: '12px'}}>{isHadir ? `${formatJam(k.waktuMulai)} - ${formatJam(k.waktuSelesai)}` : "-"}</td>
                        <td style={{textAlign:'center', fontWeight: 900}} className={isHadir ? cetakStyles.bgHadir : cetakStyles.bgAbsen}>
                          {isHadir ? "HADIR" : "TIDAK HADIR"}
                        </td>
                        <td style={{fontSize: '12px'}}>
                          {isHadir ? (
                            <>
                              {k.terlambatMenit > 0 && <div className={cetakStyles.teksMerah}>Telat {k.terlambatMenit}m</div>}
                              {k.konsulExtraMenit > 0 && <div className={cetakStyles.teksBiru}>Extra +{k.konsulExtraMenit}m</div>}
                              {!k.terlambatMenit && !k.konsulExtraMenit && "-"}
                            </>
                          ) : (
                            <div>
                              <span style={{ fontWeight: '900', color: '#ef4444' }}>{k.status.toUpperCase()}</span>
                              {k.keterangan && <span style={{ display: 'block', fontStyle: 'italic', marginTop: '2px' }}>"{k.keterangan}"</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* KONSUL EKSTRA */}
            <div className={cetakStyles.blokTabel}>
              <h2 className={cetakStyles.judulKolom}>📙 Inisiatif Konsul Ekstra</h2>
              <div className={cetakStyles.summaryBoxTwo}>
                <div className={cetakStyles.summaryItem}><span>Total Sesi</span><strong>{dataRapor.konsul.length} Kali</strong></div>
                <div className={cetakStyles.summaryItem}><span className={cetakStyles.teksHijau}>Total Menit Konsul</span><strong>{totalMenitKonsul} Menit</strong></div>
              </div>
              <table className={cetakStyles.tabelRapor}>
                <thead>
                  <tr>
                    <th className={cetakStyles.colKonsulTgl}>Tanggal</th>
                    <th className={cetakStyles.colKonsulMapel}>Mapel</th>
                    <th className={cetakStyles.colKonsulWaktu}>Waktu</th>
                    <th className={cetakStyles.colKonsulDurasi}>Durasi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRapor.konsul.map(k => (
                    <tr key={k._id}>
                      <td className={cetakStyles.teksTebal}>{formatHariTanggalKhusus(k.waktuMulai)}</td>
                      <td>{k.namaMapel}</td>
                      <td style={{textAlign:'center'}}>{formatJam(k.waktuMulai)} - {formatJam(k.waktuSelesai)}</td>
                      <td style={{textAlign:'center'}}><span>{Math.round((new Date(k.waktuSelesai) - new Date(k.waktuMulai)) / 60000)} Menit</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={cetakStyles.footerDoc}>
              <p>Dicetak otomatis oleh Sistem Akademik QuRi Bimbingan Belajar Quantum Research pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
              <br></br>
              <p className={cetakStyles.copyright}>Bimbingan Belajar Quantum Research &copy; {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}