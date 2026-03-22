import { useState } from "react";
import { FaArrowLeft, FaCheck, FaImages, FaCameraRetro, FaDownload } from "react-icons/fa6";
import { CldUploadWidget } from 'next-cloudinary';
import html2canvas from "html2canvas";

import { formatTanggal, formatYYYYMMDD } from "../../utils/formatHelper";
// 👈 Import Konstanta Sistem
import { KONFIGURASI_MEDIA, STATUS_SESI, LABEL_SISTEM } from "../../utils/constants";

import styles from "../../app/admin/AdminPage.module.css";
import cetakStyles from "../../app/admin/LaporanCetak.module.css";

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

  // 🛡️ ZERO HARDCODE: Gunakan domain resmi dari constants
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
      {/* AREA RENDER KERTAS CETAK (Disembunyikan, hanya untuk HTML2Canvas) */}
      {/* ================================================================= */}
      <div id="kertas-laporan-jurnal" style={{ display: 'none' }} className={cetakStyles.kertasLaporan}>
        
        <div className={cetakStyles.header}>
          <div>
            <h1 className={cetakStyles.judulHeader}>Laporan Belajar Harian</h1>
            <p className={cetakStyles.subJudulHeader}>Quantum Research Академия</p>
          </div>
          <div className={cetakStyles.teksKananAtas}>
            <p className={cetakStyles.teksTanggal}>{formatTanggal(detailJadwal.tanggal)}</p>
            <p className={cetakStyles.teksJam}>⏰ {detailJadwal.jamMulai} - {detailJadwal.jamSelesai}</p>
          </div>
        </div>

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

        <div className={cetakStyles.gridDuaKolom}>
          {/* KOLOM KIRI: FOTO */}
          <div className={cetakStyles.kolomKiri}>
            <h3 className={cetakStyles.judulBagian}>Dokumentasi Kelas</h3>
            {formJurnal.fotoBersama ? (
              <div className={cetakStyles.wadahFoto}>
                <img src={ubahKeJpg(formJurnal.fotoBersama)} alt="Foto Bersama" className={cetakStyles.fotoBersama} crossOrigin="anonymous" />
                <div className={cetakStyles.captionFoto}>Keseruan Kelas Quantum Hari Ini</div>
              </div>
            ) : (
              <div className={cetakStyles.fotoKosong}>
                <p className={cetakStyles.teksFotoKosong}>📷 Tanpa Dokumentasi Foto</p>
              </div>
            )}
          </div>

          {/* KOLOM KANAN: TABEL NILAI */}
          <div className={cetakStyles.kolomKanan}>
            <h3 className={cetakStyles.judulBagian}>Ringkasan Kehadiran & Nilai</h3>
            <table className={cetakStyles.tabelLaporan}>
              <thead>
                <tr>
                  <th>Nama Siswa</th>
                  <th style={{ textAlign: 'center' }}>Kehadiran</th>
                  <th style={{ textAlign: 'center' }}>Nilai Kuis</th>
                </tr>
              </thead>
              <tbody>
                {dataSiswa.map(siswa => {
                  // 🛡️ ZERO HARDCODE: Cek apakah absen (selain Hadir/Berjalan/Belum)
                  const isHadir = siswa.statusAbsen === STATUS_SESI.SELESAI.id || siswa.statusAbsen === STATUS_SESI.BERJALAN.id;
                  const isBelumAbsen = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                  const isAbsen = !isHadir && !isBelumAbsen;

                  return (
                    <tr key={siswa.siswaId}>
                      <td className={cetakStyles.namaSiswa}>{siswa.nama}</td>
                      <td className={`${cetakStyles.statusSiswa} ${isAbsen ? cetakStyles.bgAbsen : cetakStyles.bgHadir}`}>
                        {isAbsen ? "Absen" : isBelumAbsen ? "Belum" : "Hadir"}
                      </td>
                      <td className={cetakStyles.nilaiTest}>
                        {siswa.nilaiTest !== null && siswa.nilaiTest !== "" ? siswa.nilaiTest : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cetakStyles.footer}>
           Laporan ini dicetak otomatis dari Sistem Akademik Quantum. <br/>
           Dokumentasi foto papan tulis selengkapnya dapat diakses melalui link resmi Admin. <br/>
           <span className={cetakStyles.copyright}>Quantum Research Academy &copy; {new Date().getFullYear()}</span>
        </div>
      </div>


      {/* ================================================================= */}
      {/* AREA RENDER FORM (Tampilan Admin) */}
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
        <div className={styles.kartuInfo}>
          <h2 className={styles.judulInfo}>{detailJadwal.mapel} - {detailJadwal.kelasTarget}</h2>
          <p className={styles.teksInfo}>📅 {formatTanggal(detailJadwal.tanggal)} | ⏰ {detailJadwal.jamMulai} - {detailJadwal.jamSelesai}</p>
        </div>

        {pesan && (
          <div className={`${styles.kotakPesan} ${pesan.includes("berhasil") ? styles.pesanSukses : styles.pesanGagal}`}>
            <p className={styles.teksPesan}>{pesan}</p>
          </div>
        )}

        {/* FORM INPUT JURNAL */}
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

            {/* UPLOAD FOTO PAPAN TULIS (MULTIPLE) */}
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
                  <tr><th>Nama Siswa</th><th>Status Kehadiran</th><th style={{width: '150px'}}>Nilai Kuis (0-100)</th></tr>
                </thead>
                <tbody>
                  {dataSiswa.length === 0 ? (
                    <tr><td colSpan="3" className={styles.selKosong}>Tidak ada siswa di kelas ini.</td></tr>
                  ) : (
                    dataSiswa.map((siswa, idx) => {
                      // 🛡️ ZERO HARDCODE STATUS
                      const isBelumAbsen = siswa.statusAbsen === LABEL_SISTEM.BELUM_ABSEN;
                      const isHadir = siswa.statusAbsen === STATUS_SESI.SELESAI.id || siswa.statusAbsen === STATUS_SESI.BERJALAN.id;
                      const isAbsen = !isHadir && !isBelumAbsen;
                      const isDisabled = isBelumAbsen || isAbsen;

                      return (
                        <tr key={siswa.siswaId}>
                          <td>
                            <p className={styles.teksNama}>{siswa.nama}</p>
                            <p className={styles.teksUsernameSiswa}>ID: {siswa.nomorPeserta}</p>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${isBelumAbsen ? styles.badgeBelum : isAbsen ? styles.badgeAbsen : styles.badgeHadir}`}>
                              {siswa.statusAbsen.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" max="100" 
                              placeholder={isDisabled ? "Tak Hadir" : "Isi Nilai"} 
                              value={siswa.nilaiTest === null ? "" : siswa.nilaiTest} 
                              onChange={(e) => ubahNilaiSiswa(idx, e.target.value)}
                              className={styles.inputNilai}
                              disabled={isDisabled} 
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