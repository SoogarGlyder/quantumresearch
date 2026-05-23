"use client";

import { useState, useEffect } from "react";
import { FaXmark, FaDownload, FaSpinner } from "react-icons/fa6";
import { toPng } from 'html-to-image'; 
import { formatJam } from "../../utils/formatHelper";
// 🚀 FIX: Import CABANG_QUANTUM ditambahkan di sini
import { STATUS_SESI, CABANG_QUANTUM } from "../../utils/constants";
import cetakStyles from "../../app/admin/LaporanCetak.module.css";
import { ambilLaporanBulananPengajar } from "../../actions/adminAction"; 

// FUNGSI HELPER UNTUK MEMBUAT DIAGRAM LINGKARAN CSS MURNI (DONUT CHART)
const DonutChartCustom = ({ title, data }) => {
  const totalSesi = data.reduce((sum, d) => sum + d.sesi, 0);
  const totalMenit = data.reduce((sum, d) => sum + d.menit, 0);

  let currentPercent = 0;
  const gradientStops = data.map(d => {
    const p = totalMenit > 0 ? (d.menit / totalMenit) * 100 : 0;
    const stop = `${d.color} ${currentPercent}% ${currentPercent + p}%`;
    currentPercent += p;
    return stop;
  }).join(", ");

  return (
    <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '2px solid #cbd5e1' }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '900', color: '#1e293b', textAlign: 'center' }}>
        {title}
      </h4>
      
      {totalMenit === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '20px 0' }}>Belum ada aktivitas</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%', 
              background: `conic-gradient(${gradientStops})`,
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #111827'
            }}>
              <div style={{ width: '65px', height: '65px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid #111827' }}>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#111827' }}>{totalSesi}</span>
                <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>Sesi</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.map((d, i) => {
              const p = totalMenit > 0 ? (d.menit / totalMenit) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: d.color, borderRadius: '3px', marginTop: '2px', flexShrink: 0, border: '1px solid #111827' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#334155' }}>
                      <span style={{ maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                      <span>{p.toFixed(0)}%</span>
                    </div>
                    <div style={{ color: '#64748b' }}>
                      {d.sesi} sesi &bull; {Math.floor(d.menit/60)}j {d.menit%60}m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default function ModalRaporPengajar({ pengajar, onClose }) {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [dataRapor, setDataRapor] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [sedangMencetak, setSedangMencetak] = useState(false);
  const [insentif, setInsentif] = useState("");

  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const WARNA_CHART = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

  const formatHariTanggalKhusus = (tglString) => {
    if (!tglString) return "-";
    const d = new Date(tglString);
    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return `${namaHari[d.getDay()]}, Tanggal ${d.getDate()}`;
  };

  const getTglMurni = (isoString) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const tarikDataRapor = async () => {
    setLoadingData(true);
    try {
      const res = await ambilLaporanBulananPengajar(pengajar._id, bulan, tahun);
      if (res.sukses) setDataRapor(res.data);
    } catch (error) { 
      console.error("Gagal menarik data rapor:", error); 
    }
    setLoadingData(false);
  };

  useEffect(() => { if (pengajar) tarikDataRapor(); }, [pengajar, bulan, tahun]);

  const cetakGambar = async () => {
    setSedangMencetak(true);
    try {
      const el = document.getElementById("wrapper-kertas-rapor-pengajar");
      const url = await toPng(el, { quality: 1.0, backgroundColor: "#fdfbf7", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `Kinerja_${pengajar.nama.replace(/\s+/g, '_')}_${namaBulan[bulan-1]}.png`;
      link.href = url;
      link.click();
    } catch (err) { alert("Gagal cetak."); } finally { setSedangMencetak(false); }
  };

  if (!pengajar) return null;

  // ==========================================================================
  // PENGOLAHAN DATA: 1. STATISTIK KONSUL (3 PIE CHART)
  // ==========================================================================
  const rawKonsul = []; 
  
  dataRapor?.konsulExtraSiswa?.forEach(k => {
    rawKonsul.push({ 
      tipe: "Extra Pasca-Kelas", 
      mapel: k.namaMapel ? k.namaMapel.replace(" (Extra)", "").trim() : "Umum", 
      kelas: k.siswaId?.kelas || "-", 
      menit: k.konsulExtraMenit 
    });
  });

  dataRapor?.konsul?.forEach(k => {
    if (k.status === STATUS_SESI.SELESAI.id && k.waktuMulai && k.waktuSelesai) {
      const m = Math.max(0, Math.round((new Date(k.waktuSelesai) - new Date(k.waktuMulai)) / 60000));
      rawKonsul.push({ 
        tipe: "Inisiatif Mandiri", 
        mapel: k.namaMapel || "Umum", 
        kelas: k.siswaId?.kelas || "-", 
        menit: m 
      });
    }
  });

  const tipeMap = {};
  rawKonsul.forEach(r => {
    if(!tipeMap[r.tipe]) tipeMap[r.tipe] = { sesi: 0, menit: 0 };
    tipeMap[r.tipe].sesi += 1;
    tipeMap[r.tipe].menit += r.menit;
  });
  const chartTipe = Object.entries(tipeMap).map(([label, v]) => ({ label, sesi: v.sesi, menit: v.menit, color: label==="Inisiatif Mandiri" ? '#10b981' : '#f59e0b' }));

  const mapelMap = {};
  rawKonsul.forEach(r => {
    if(!mapelMap[r.mapel]) mapelMap[r.mapel] = { sesi: 0, menit: 0 };
    mapelMap[r.mapel].sesi += 1;
    mapelMap[r.mapel].menit += r.menit;
  });
  const chartMapel = Object.entries(mapelMap).sort((a,b) => b[1].menit - a[1].menit).map(([label, v], i) => ({ label, sesi: v.sesi, menit: v.menit, color: WARNA_CHART[i % WARNA_CHART.length] }));

  const kelasMap = {};
  rawKonsul.forEach(r => {
    if(!kelasMap[r.kelas]) kelasMap[r.kelas] = { sesi: 0, menit: 0 };
    kelasMap[r.kelas].sesi += 1;
    kelasMap[r.kelas].menit += r.menit;
  });
  const chartKelas = Object.entries(kelasMap).sort((a,b) => b[1].menit - a[1].menit).map(([label, v], i) => ({ label, sesi: v.sesi, menit: v.menit, color: WARNA_CHART[(i+3) % WARNA_CHART.length] }));

  // ==========================================================================
  // PENGOLAHAN DATA: 2. TABEL KELAS BERDASARKAN TANGGAL MASUK (ABSEN)
  // ==========================================================================
  const tglMasukSet = new Set();
  dataRapor?.absen?.forEach(a => tglMasukSet.add(getTglMurni(a.waktuMasuk)));
  dataRapor?.kelas?.forEach(k => tglMasukSet.add(getTglMurni(k.waktuMulai))); 
  
  const arrayTglMasuk = Array.from(tglMasukSet).sort();

  //LOGIKA BARU: MENGHITUNG SUMMARY KEHADIRAN & BEBAN HARIAN
  let totalPresensi = 0;
  let hariTanpaKelas = 0;
  let kelasDouble = 0;
  let kelasTriple = 0;

  const mapelKelasMap = {};
  const targetKelasMap = {};

  arrayTglMasuk.forEach(tgl => {
    const isHadir = dataRapor?.absen?.some(a => getTglMurni(a.waktuMasuk) === tgl);
    const kelasHariIni = dataRapor?.kelas?.filter(k => getTglMurni(k.waktuMulai) === tgl) || [];
    const jmlKelas = kelasHariIni.length;

    if (isHadir) {
      totalPresensi++;
      if (jmlKelas === 0) hariTanpaKelas++; 
    }
    if (jmlKelas === 2) kelasDouble++;
    if (jmlKelas >= 3) kelasTriple++; 

    // Mengumpulkan data untuk 2 Pie Chart Jurnal Kelas
    kelasHariIni.forEach(k => {
      const m = k.namaMapel || "Umum";
      if(!mapelKelasMap[m]) mapelKelasMap[m] = { sesi: 0, menit: 0 };
      mapelKelasMap[m].sesi += 1;
      const durasi = k.waktuMulai && k.waktuSelesai ? Math.max(0, Math.round((new Date(k.waktuSelesai) - new Date(k.waktuMulai)) / 60000)) : 0;
      mapelKelasMap[m].menit += durasi;

      const c = k.kelasTarget || "-";
      if(!targetKelasMap[c]) targetKelasMap[c] = { sesi: 0, menit: 0 };
      targetKelasMap[c].sesi += 1;
      targetKelasMap[c].menit += durasi;
    });
  });

  const chartMapelKelas = Object.entries(mapelKelasMap).sort((a,b) => b[1].menit - a[1].menit).map(([label, v], i) => ({
    label, sesi: v.sesi, menit: v.menit, color: WARNA_CHART[i % WARNA_CHART.length]
  }));

  const chartDistribusiKelas = Object.entries(targetKelasMap).sort((a,b) => b[1].menit - a[1].menit).map(([label, v], i) => ({
    label, sesi: v.sesi, menit: v.menit, color: WARNA_CHART[(i+4) % WARNA_CHART.length]
  }));

  //LOGIKA FORMAT JABATAN KAKAK ASUH
  const profilData = dataRapor?.profil || {};
  const isKakakAsuh = profilData.pangkat === "KAKAK_ASUH";
  const teksJabatanFinal = isKakakAsuh 
    ? `Kakak Asuh ${profilData.kelasAsuh?.length > 0 ? profilData.kelasAsuh.join(", ") : "-"}`
    : (profilData.pangkat?.replace('_', ' ') || "FREELANCE");

  // 🚀 LOGIKA PENCARIAN CABANG (Sama seperti Rapor Siswa & Jurnal)
  // Ambil dari profil yang ditarik backend, jika null fallback ke PUSAT.
  const kodeCabangGuru = profilData.kodeCabang || pengajar?.kodeCabang;
  const infoCabang = Object.values(CABANG_QUANTUM).find(c => c.id === kodeCabangGuru) || CABANG_QUANTUM.PUSAT;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17,24,39,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', padding: '40px 20px' }}>
      
      {/* 1. PANEL KONTROL */}
      <div style={{ background: 'white', border: '4px solid #111827', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '1050px', marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '8px 8px 0 #3b82f6', zIndex: 10 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 900 }}>{pengajar.nama}</h2>
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
          {sedangMencetak ? <FaSpinner className="spinAnimation" /> : <FaDownload />} Cetak Rapor
        </button>
        <button onClick={onClose} style={{ background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}><FaXmark /></button>
      </div>

      {/* 2. KERTAS LAPORAN */}
      {loadingData ? (
        <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}><FaSpinner className="spinAnimation" style={{fontSize: '40px'}} /></div>
      ) : dataRapor ? (
        <div id="wrapper-kertas-rapor-pengajar" style={{ background: '#fdfbf7', padding: '40px', borderRadius: '20px', flexShrink: 0, width: '100%', maxWidth: '1000px' }}>
          <div className={cetakStyles.kertasPortrait}>
            
            {/* 🚀 HEADER LOGO & CABANG DINAMIS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <img src="/logo-qr-persegi.png" alt="Logo" style={{ height: '90px', borderRight: '3px solid #111827', paddingRight: '15px'}} />
              <div>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#111827' }}>LAPORAN KINERJA PENGAJAR</h1>
                {infoCabang.id === CABANG_QUANTUM.PUSAT.id ? (
                  <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#4b5563' }}>Bimbingan Belajar Quantum Research</p>
                ) : (
                  <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#4b5563' }}>Bimbingan Belajar Quantum Research {infoCabang.nama}</p>
                )}
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>{infoCabang.alamat}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>{infoCabang.kontak}</p>
              </div>
            </div>
            <div style={{ borderBottom: '5px solid #111827', marginBottom: '20px' }}></div>

            {/* IDENTITAS */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: 900, color: '#111827' }}>
                  {profilData.nama?.toUpperCase()}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 40px', maxWidth: '700px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: 'bold' }}>
                    ID Pengajar: <strong style={{color: '#111827', marginLeft: '4px'}}>{profilData.nomorPeserta}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: 'bold' }}>
                    Jabatan: <strong style={{color: isKakakAsuh ? '#9333ea' : '#111827', marginLeft: '4px', textTransform: 'capitalize'}}>{teksJabatanFinal}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: 'bold' }}>
                    Kode Pengajar: <strong style={{color: '#111827', marginLeft: '4px'}}>{profilData.kodePengajar}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: 'bold' }}>
                    Periode: <strong style={{color: '#111827', marginLeft: '4px'}}>{namaBulan[bulan-1]} {tahun}</strong>
                  </p>
                </div>
            </div>
            <div style={{ borderBottom: '5px solid #111827', marginBottom: '10px' }}></div>

            {/* BAGIAN 1: STATISTIK KONSUL (3 PIE CHART) */}
            <div className={cetakStyles.blokTabel}>
              <h2 className={cetakStyles.judulKolom}>📈 Analisis Inisiatif Konsul & Ekstra Pasca-Kelas</h2>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <DonutChartCustom title="Jenis Konsul" data={chartTipe} />
                <DonutChartCustom title="Sebaran Mapel" data={chartMapel} />
                <DonutChartCustom title="Distribusi Kelas" data={chartKelas} />
              </div>
            </div>

            <div style={{ borderBottom: '5px solid #111827', marginBottom: '10px' }}></div>

            {/* BAGIAN 2: TABEL RINCIAN KELAS HARIAN */}
            <div className={cetakStyles.blokTabel}>
              <h2 className={cetakStyles.judulKolom}>📘 Jurnal Kehadiran & Jadwal Kelas Mengajar</h2>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ alignContent: 'center', flex: 1, minWidth: '120px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '2px solid #cbd5e1', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#1d4ed8' }}>{totalPresensi}</div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Hari Datang</div>
                    </div>
                    <div style={{ alignContent: 'center', flex: 1, minWidth: '120px', background: '#fdf2f8', padding: '12px', borderRadius: '8px', border: '2px solid #fbcfe8', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#be185d' }}>{hariTanpaKelas}</div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#9d174d', textTransform: 'uppercase' }}>Hari Tanpa Kelas</div>
                    </div>
                    <div style={{ alignContent: 'center', flex: 1, minWidth: '120px', background: '#fef3c7', padding: '12px', borderRadius: '8px', border: '2px solid #f9a8d4', textAlign: 'center', borderColor: '#fde047' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#b45309' }}>{kelasDouble}</div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase' }}>Kelas Double</div>
                    </div>
                    <div style={{ alignContent: 'center', flex: 1, minWidth: '120px', background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '2px solid #6ee7b7', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#047857' }}>{kelasTriple}</div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#065f46', textTransform: 'uppercase' }}>Kelas Triple</div>
                    </div>
                  </div>
                  <DonutChartCustom title="Sebaran Mapel" data={chartMapelKelas} />
                  <DonutChartCustom title="Distribusi Kelas" data={chartDistribusiKelas} />
                </div>
              <table className={cetakStyles.tabelRapor}>
                <thead>
                  <tr>
                    <th className={cetakStyles.colTgl} style={{ width: '25%' }}>Tanggal Masuk</th>
                    <th>Detail Aktivitas Kelas</th>
                  </tr>
                </thead>
                <tbody>
                  {arrayTglMasuk.length === 0 ? (
                    <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>Belum ada data mengajar bulan ini.</td></tr>
                  ) : (
                    arrayTglMasuk.map(tgl => {
                      const absenHariIni = dataRapor.absen.filter(a => getTglMurni(a.waktuMasuk) === tgl);
                      const kelasHariIni = dataRapor.kelas.filter(k => getTglMurni(k.waktuMulai) === tgl);

                      return (
                        <tr key={tgl}>
                          <td style={{ verticalAlign: 'center', borderRight: '2px solid #e2e8f0', paddingRight: '12px' }}>
                            <div className={cetakStyles.teksTebal} style={{ marginBottom: '6px' }}>{formatHariTanggalKhusus(tgl)}</div>
                            {absenHariIni.length > 0 ? (
                               absenHariIni.map((a, idx) => (
                                 <div key={idx} style={{ marginBottom: idx !== absenHariIni.length - 1 ? '10px' : '0' }}>
                                   <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', marginBottom: '2px' }}>
                                     ✓ Clock In: {formatJam(a.waktuMasuk)}
                                   </div>
                                   <div style={{ fontSize: '11px', color: a.waktuKeluar ? '#ea580c' : '#94a3b8', fontWeight: 'bold' }}>
                                     {a.waktuKeluar ? `⬅ Clock Out: ${formatJam(a.waktuKeluar)}` : "⏱️ Belum Clock Out"}
                                   </div>
                                 </div>
                               ))
                            ) : (
                               <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic' }}>⚠️ Tidak Scan Absen Masuk</div>
                            )}
                          </td>
                          
                          <td style={{ verticalAlign: 'center' }}>
                            {kelasHariIni.length === 0 ? (
                               <span style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>Tidak mengajar kelas reguler.</span>
                            ) : (
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {kelasHariIni.map(k => (
                                    <div key={k._id} style={{ display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
                                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: k.status === STATUS_SESI.SELESAI.id ? '#3b82f6' : '#ef4444' }}></div>
                                      <strong style={{ minWidth: '100px' }}>{k.namaMapel}</strong>
                                      <span style={{ color: '#4b5563' }}>({k.kelasTarget})</span>
                                      <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#111827', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                                        {formatJam(k.waktuMulai)} - {k.waktuSelesai ? formatJam(k.waktuSelesai) : "..."}
                                      </span>
                                    </div>
                                  ))}
                               </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ borderBottom: '5px solid #111827', margin: '20px 0' }}></div>
            
            {/* INPUT KETERANGAN HR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <p style={{ fontSize: '16px', color: '#111827', fontWeight: '900', margin: 0 }}>Catatan HR / Insentif:</p>
              <input
                type="text" value={insentif} onChange={(e) => setInsentif(e.target.value)}
                placeholder="Ketik rincian honor di sini..."
                style={{ fontSize: '16px', color: '#111827', fontWeight: '700', flex: 1, border: 'none', borderBottom: '2px dashed #94a3b8', outline: 'none', background: 'transparent' }}
              />
            </div>
            
            <div className={cetakStyles.footerDoc}>
              <p>Dicetak otomatis oleh Sistem Akademik QuRi Bimbingan Belajar Quantum pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
              <br></br>
              <p className={cetakStyles.copyright}>Bimbingan Belajar Quantum Research &copy; {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}