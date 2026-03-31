"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState } from "react";
import { 
  FaArrowLeft, FaCheck, FaImages, FaCameraRetro, 
  FaDownload, FaClock, FaTriangleExclamation 
} from "react-icons/fa6";
import { CldUploadWidget } from 'next-cloudinary';
import html2canvas from "html2canvas";

// 🚀 Menggunakan formatJam dari helper agar seragam dengan TabKelas
import { formatTanggal, formatYYYYMMDD, formatJam } from "../../utils/formatHelper";
import { KONFIGURASI_MEDIA, STATUS_SESI, LABEL_SISTEM } from "../../utils/constants";

import styles from "../../app/admin/AdminPage.module.css";
import cetakStyles from "../../app/admin/LaporanCetak.module.css";

// ============================================================================
// 2. MAIN EXPORT COMPONENT
// ============================================================================
export default function DetailJurnal({ 
  detailJadwal, 
  dataSiswa, 
  setDataSiswa, 
  formJurnal, 
  setFormJurnal, 
  tutupJurnal, 
  prosesSimpanJurnal, 
  loadingJurnal, 
  pesan 
}) {
  const [sedangMencetak, setSedangMencetak] = useState(false);

  const ubahKeJpg = (url) => {
    if (!url) return "";
    if (url.includes(KONFIGURASI_MEDIA.DOMAIN_RESMI)) {
      return url.replace(/\.[^/.]+$/, ".jpg");
    }
    return url;
  };

  const ubahNilaiSiswa = (index, nilaiBaru) => {
    const newData = [...dataSiswa];
    newData[index].nilaiTest = nilaiBaru === "" ? "" : Math.min(100, Math.max(0, Number(nilaiBaru)));
    setDataSiswa(newData);
  };

  const ubahExtraMenit = (index, nilaiBaru) => {
    const newData = [...dataSiswa];
    newData[index].konsulExtraMenit = nilaiBaru === "" ? "" : Math.max(0, Number(nilaiBaru));
    setDataSiswa(newData);
  };

  const cetakLaporanKeGambar = async () => {
    setSedangMencetak(true);
    try {
      const elemenLaporan = document.getElementById("kertas-laporan-jurnal");
      elemenLaporan.style.display = "block";
      
      const canvas = await html2canvas(elemenLaporan, {
        scale: 2, 
        backgroundColor: "#fdfbf7",
        useCORS: true, 
        allowTaint: false,
      });
      
      elemenLaporan.style.display = "none";

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Laporan-${detailJadwal.mapel}-${detailJadwal.kelasTarget}-${formatYYYYMMDD(new Date(detailJadwal.tanggal))}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("[ERROR Cetak Jurnal]:", error);
      alert("⚠️ Gagal mencetak laporan. Pastikan gambar sudah ter-upload sempurna.");
    } finally {
      setSedangMencetak(false);
    }
  };

  return (
    <div className={styles.isiTab}>
      
      {/* ================================================================= */}
      {/* AREA RENDER KERTAS CETAK (POTRAIT) */}
      {/* ================================================================= */}
      {/* 🚀 FIX: Diberi style inline width: 800px agar memanjang ke bawah layaknya A4 */}
      <div id="kertas-laporan-jurnal" style={{ display: 'none', width: '800px', margin: '0 auto' }} className={cetakStyles.kertasLaporan}>
        
        {/* HEADER DOKUMEN */}
        <div className={cetakStyles.header}>
          <div>
            <h1 className={cetakStyles.judulHeader}>Laporan Belajar Harian</h1>
            <p className={cetakStyles.subJudulHeader}>Quantum Research Academy</p>
          </div>
          <div className={cetakStyles.teksKananAtas}>
            <p className={cetakStyles.teksTanggal}>{formatTanggal(detailJadwal.tanggal)}</p>
            <p className={cetakStyles.teksJam}>⏰ {detailJadwal.jamMulai} - {detailJadwal.jamSelesai}</p>
          </div>
        </div>

        {/* INFO KELAS (Side-by-side tetap aman di 800px) */}
        <div className={cetakStyles.infoBox}>
          <div className={cetakStyles.infoKiri}>
            <p className={cetakStyles.labelLabel}>Kelas & Mata Pelajaran</p>
            <p className={cetakStyles.nilaiLabel}>{detailJadwal.kelasTarget}</p>
            <p className={cetakStyles.nilaiLabelBiru}>{detailJadwal.mapel}</p>
          </div>
          <div className={cetakStyles.infoKanan}>
            <p className={cetakStyles.labelLabel}>Pokok Bahasan Materi</p>
            <p className={cetakStyles.nilaiLabel}>{formJurnal.bab || "Belum Diisi"}</p>
            <p className={cetakStyles.nilaiSubBab}>{formJurnal.subBab ? `(${formJurnal.subBab})` : ""}</p>
          </div>
        </div>

        {/* 🚀 LAYOUT POTRAIT: FOTO DI ATAS */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className={cetakStyles.judulBagian} style={{ display: 'block', textAlign: 'center' }}>📸 Dokumentasi Kelas</h3>
          {formJurnal.fotoBersama ? (
            <div className={cetakStyles.wadahFoto}>
              {/* Foto dibikin full width dengan max-height proporsional */}
              <img src={ubahKeJpg(formJurnal.fotoBersama)} alt="Foto Bersama" className={cetakStyles.fotoBersama} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} crossOrigin="anonymous" />
              <div className={cetakStyles.captionFoto}>Keseruan Kelas Quantum Hari Ini</div>
            </div>
          ) : (
            <div className={cetakStyles.fotoKosong} style={{ height: '200px' }}>
              <p className={cetakStyles.teksFotoKosong}>📷 Tanpa Dokumentasi Foto</p>
            </div>
          )}
        </div>

        {/* 🚀 LAYOUT POTRAIT: TABEL DI BAWAH FOTO */}
        <div style={{ marginBottom: '24px' }}>
          <h3 className={cetakStyles.judulBagian} style={{ display: 'block', textAlign: 'center' }}>📊 Kehadiran & Kedisiplinan</h3>
          <table className={cetakStyles.tabelLaporan} style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px' }}>Nama Siswa</th>
                <th style={{ textAlign: 'center', padding: '16px' }}>Waktu Sesi</th>
                <th style={{ textAlign: 'center', padding: '16px' }}>Absensi</th>
                <th style={{ textAlign: 'center', padding: '16px' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {dataSiswa.map(siswa => {
                const isHadir = siswa.statusAbsen === STATUS_SESI.SELESAI.id || siswa.statusAbsen === STATUS_SESI.BERJALAN.id;
                const isBelumAbsen = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                const isAbsen = !isHadir && !isBelumAbsen;
                const telat = siswa.terlambatMenit > 0;
                const extra = siswa.konsulExtraMenit > 0;

                return (
                  <tr key={siswa.siswaId}>
                    <td className={cetakStyles.namaSiswa} style={{ padding: '16px' }}>{siswa.nama}</td>
                    
                    <td style={{ textAlign: 'center', fontWeight: '900', fontSize: '15px', color: '#4b5563', padding: '16px' }}>
                      {isAbsen || isBelumAbsen ? "-" : `${siswa.waktuMulai ? formatJam(siswa.waktuMulai) : '--:--'} - ${siswa.waktuSelesai ? formatJam(siswa.waktuSelesai) : '??:??'}`}
                    </td>
                    
                    <td className={`${cetakStyles.statusSiswa} ${isAbsen ? cetakStyles.bgAbsen : isHadir ? cetakStyles.bgHadir : ''}`} style={{ padding: '16px' }}>
                      {isAbsen ? "Absen" : isBelumAbsen ? "Belum" : "Hadir"}
                    </td>
                    
                    <td style={{ textAlign: 'center', fontWeight: '900', fontSize: '14px', padding: '16px' }}>
                      {telat && <div style={{ color: '#ef4444' }}>Telat {siswa.terlambatMenit}m</div>}
                      {extra && <div style={{ color: '#2563eb' }}>Extra {siswa.konsulExtraMenit}m</div>}
                      {!telat && !extra ? "-" : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={cetakStyles.footer}>
           Laporan ini dicetak otomatis dari Sistem Akademik Quantum. <br/>
           Dokumentasi foto papan tulis selengkapnya dapat diakses melalui link resmi Admin. <br/>
           <span className={cetakStyles.copyright}>Quantum Research Academy &copy; {new Date().getFullYear()}</span>
        </div>
      </div>


      {/* ================================================================= */}
      {/* AREA RENDER FORM (Tampilan UI Interaktif Admin) - TIDAK BERUBAH */}
      {/* ================================================================= */}
      <div className={styles.aksiAtas}>
        <button onClick={tutupJurnal} className={`${styles.tombolBatalForm} ${styles.tombolKembali}`}>
          <FaArrowLeft /> Kembali ke Daftar
        </button>
        
        <button onClick={cetakLaporanKeGambar} disabled={sedangMencetak} className={styles.tombolCetak}>
          <FaDownload /> {sedangMencetak ? "Mencetak Laporan..." : "Download Laporan (Kirim ke WA)"}
        </button>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.kartuInfoJurnal}>
          <h2 className={styles.judulInfoJurnal}>{detailJadwal.mapel} - {detailJadwal.kelasTarget}</h2>
          <p className={styles.teksInfoJurnal}>📅 {formatTanggal(detailJadwal.tanggal)} | ⏰ {detailJadwal.jamMulai} - {detailJadwal.jamSelesai}</p>
        </div>

        {pesan && (
          <div className={`${styles.messageBox} ${pesan.includes("berhasil") ? styles.messageSuccess : styles.messageFail}`}>
            <p className={styles.message}>{pesan}</p>
          </div>
        )}

        <form onSubmit={prosesSimpanJurnal}>
          <div className={styles.formGrid}>
            <div className={styles.formKolom}>
              <label className={styles.labelForm}>Topik / Bab</label>
              <input type="text" placeholder="Contoh: Trigonometri" value={formJurnal.bab} onChange={e => setFormJurnal({...formJurnal, bab: e.target.value})} className={styles.formInput} />
            </div>
            <div className={styles.formKolom}>
              <label className={styles.labelForm}>Sub-Bab</label>
              <input type="text" placeholder="Contoh: Aturan Sinus & Cosinus" value={formJurnal.subBab} onChange={e => setFormJurnal({...formJurnal, subBab: e.target.value})} className={styles.formInput} />
            </div>
          </div>
          
          <div className={styles.formGrid}>
            {/* UPLOAD FOTO BERSAMA */}
            <div className={styles.formKolom}>
              <label className={styles.labelForm}><FaCameraRetro /> Upload Foto Kelas (Sampul Laporan)</label>
              <CldUploadWidget 
                uploadPreset="quantum_lms"
                onSuccess={(result) => setFormJurnal({...formJurnal, fotoBersama: result.info.secure_url})}
              >
                {({ open }) => (
                  <button type="button" onClick={() => open()} className={styles.tombolSimpanKuning} style={{width: '100%', padding: '14px', fontSize: '14px', marginTop: '4px'}}>
                    {formJurnal.fotoBersama ? "📸 Ganti Foto Tersimpan" : "📸 Pilih Foto Kelas"}
                  </button>
                )}
              </CldUploadWidget>
              {formJurnal.fotoBersama && <p style={{fontSize: '13px', color: '#15803d', fontWeight: '900', marginTop: '8px'}}>✅ Foto siap dicetak!</p>}
            </div>

            {/* UPLOAD FOTO PAPAN TULIS */}
            <div className={styles.formKolom}>
              <label className={styles.labelForm}><FaImages /> Upload Foto Papan Tulis (Arsip Bebas)</label>
              <CldUploadWidget 
                uploadPreset="quantum_lms" 
                onSuccess={(result) => {
                  const linkLama = formJurnal.galeriLink ? formJurnal.galeriLink + ", " : "";
                  setFormJurnal({...formJurnal, galeriLink: linkLama + result.info.secure_url});
                }}
              >
                {({ open }) => (
                  <button type="button" onClick={() => open()} className={styles.tombolSimpanKuning} style={{width: '100%', padding: '14px', fontSize: '14px', marginTop: '4px'}}>
                    🖼️ Tambah Foto Papan
                  </button>
                )}
              </CldUploadWidget>
              {formJurnal.galeriLink && <p style={{fontSize: '13px', color: '#15803d', fontWeight: '900', marginTop: '8px'}}>✅ {formJurnal.galeriLink.split(',').length} Foto tersimpan di arsip.</p>}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 className={styles.judulTabelKanan}>Daftar Siswa & Penilaian</h3>
            
            <div className={styles.wadahTabel}>
              <table className={styles.tabelStyle}>
                <thead>
                  <tr>
                    <th>NAMA & INFO</th>
                    <th style={{textAlign: 'center'}}>WAKTU</th>
                    <th style={{textAlign: 'center'}}>EXTRA KONSUL</th>
                    <th style={{textAlign: 'center'}}>KETERANGAN</th>
                    <th style={{textAlign: 'center'}}>STATUS</th>
                    <th style={{textAlign: 'center'}}>NILAI</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSiswa.length === 0 ? (
                    <tr><td colSpan="6" className={styles.selKosong}>Tidak ada siswa di kelas ini.</td></tr>
                  ) : (
                    dataSiswa.map((siswa, idx) => {
                      const isHadir = siswa.statusAbsen === STATUS_SESI.SELESAI.id || siswa.statusAbsen === STATUS_SESI.BERJALAN.id;
                      const isBelumAbsen = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                      const isAbsen = !isHadir && !isBelumAbsen;
                      const isDisabled = isBelumAbsen || isAbsen;

                      return (
                        <tr key={siswa.siswaId}>
                          
                          <td className={styles.tdLebar}>
                            <p className={styles.teksNama}>{siswa.nama}</p>
                            <p className={styles.teksUsernameSiswa}>ID: {siswa.nomorPeserta}</p>
                          </td>

                          <td style={{textAlign: 'center'}}>
                            {isAbsen || isBelumAbsen ? (
                              <span className={styles.teksPudar}>-</span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <span className={styles.teksJam}>{siswa.waktuMulai ? formatJam(siswa.waktuMulai) : "--:--"}</span>
                                <span className={styles.panahJam}>→</span>
                                <span className={styles.teksJamPudar}>{siswa.waktuSelesai ? formatJam(siswa.waktuSelesai) : "??:??"}</span>
                              </div>
                            )}
                          </td>

                          <td style={{textAlign: 'center'}}>
                            {siswa.konsulExtraMenit > 0 ? (
                              <span className={styles.badgeExtraBadge}><FaClock style={{marginRight: '4px'}} /> +{siswa.konsulExtraMenit}m</span>
                            ) : (
                              <span className={styles.teksPudar}>-</span>
                            )}
                          </td>

                          <td style={{textAlign: 'center'}}>
                            {isAbsen ? (
                              <span className={styles.teksAlpa}>{siswa.statusAbsen.toUpperCase()}</span>
                            ) : isBelumAbsen ? (
                               <span className={styles.teksPudar}>-</span>
                            ) : siswa.terlambatMenit > 0 ? (
                              <span className={styles.teksTelat}><FaTriangleExclamation /> Telat {siswa.terlambatMenit}m</span>
                            ) : (
                              <span className={styles.teksTepatWaktu}>Tepat Waktu</span>
                            )}
                          </td>

                          <td style={{textAlign: 'center'}}>
                            <span className={`${styles.badgeStatus} ${isAbsen || isHadir ? styles.statusSelesai : styles.badgeBelum}`} style={isAbsen ? {backgroundColor: '#ef4444', color: 'white'} : {}}>
                              {isAbsen ? "ABSEN" : isBelumAbsen ? "BELUM" : siswa.statusAbsen.toUpperCase()}
                            </span>
                          </td>

                          <td style={{textAlign: 'center'}}>
                            <input 
                              type="number" 
                              min="0" max="100" 
                              placeholder={isDisabled ? "-" : "Nilai"} 
                              value={siswa.nilaiTest === null ? "" : siswa.nilaiTest} 
                              onChange={(e) => ubahNilaiSiswa(idx, e.target.value)}
                              className={styles.inputNilai}
                              disabled={isDisabled} 
                              style={{ textAlign: 'center', width: '80px', padding: '10px' }}
                            />
                          </td>

                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button type="submit" disabled={loadingJurnal} className={`${styles.tombolSimpanBiruBaru} ${styles.tombolSimpan}`}>
            <FaCheck /> {loadingJurnal ? "Menyimpan ke Server..." : "Simpan Permanen Jurnal Kelas"}
          </button>
        </form>
      </div>

    </div>
  );
}