"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useMemo, useState, useEffect } from "react"; 
import Image from "next/image"; 

import { pilahJadwalSiswa } from "../../utils/kalkulatorData";
import { PERIODE_BELAJAR, TIPE_SESI, STATUS_SESI, EVENT_PENTING } from "../../utils/constants";
import { dapatkanKlasemenBulanIni } from "../../actions/klasemenAction";
import { formatYYYYMMDD, formatBulanTahun } from "../../utils/formatHelper";

import { FaCalendarDays, FaBullseye, FaStar, FaFire, FaCircleCheck, FaTrophy, FaCrown, FaMedal, FaUserTie } from "react-icons/fa6";
import styles from "../StudentApp.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB BERANDA SISWA)
// ============================================================================
export default function TabBeranda({ siswa, jadwal, riwayat, setTab, setModeScan, resetScanner }) {
  
  // --- STATE: MODAL KLASEMEN ---
  const [isKlasemenOpen, setIsKlasemenOpen] = useState(false);
  const [dataKlasemen, setDataKlasemen] = useState([]);
  const [loadingKlasemen, setLoadingKlasemen] = useState(false);

  useEffect(() => {
    if (isKlasemenOpen && dataKlasemen.length === 0) {
      setLoadingKlasemen(true);
      dapatkanKlasemenBulanIni().then(hasil => {
        if (hasil.sukses) setDataKlasemen(hasil.data);
        setLoadingKlasemen(false);
      });
    }
  }, [isKlasemenOpen, dataKlasemen.length]);

  // --- LOGIKA 1: PILAH JADWAL HARI INI ---
  const { jadwalAktif } = useMemo(() => {
    return pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR);
  }, [jadwal, riwayat]);

  // --- LOGIKA 2: HITUNG STREAK KONSUL ---
  const streakKonsul = useMemo(() => {
    if (!riwayat || riwayat.length === 0) return 0;
    
    // 🛡️ ZERO HARDCODE STATUS & JENIS SESI
    const tanggalUnikKonsul = new Set(
      riwayat
        .filter(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuMulai)
        .map(r => formatYYYYMMDD(r.waktuMulai))
    );
    
    const hariIni = new Date();
    const tglHariIniStr = formatYYYYMMDD(hariIni);
    
    let tanggalCek = new Date(hariIni);
    let totalStreak = 0;

    if (!tanggalUnikKonsul.has(tglHariIniStr)) {
      tanggalCek.setDate(tanggalCek.getDate() - 1);
      if (!tanggalUnikKonsul.has(formatYYYYMMDD(tanggalCek))) return 0; 
    }
    
    while (true) {
      if (tanggalUnikKonsul.has(formatYYYYMMDD(tanggalCek))) {
        totalStreak++;
        tanggalCek.setDate(tanggalCek.getDate() - 1);
      } else {
        break; 
      }
    }
    return totalStreak;
  }, [riwayat]);

  // --- LOGIKA 3: STATISTIK BULAN INI & GAMIFIKASI ---
  const statsBulanIni = useMemo(() => {
    const sekarang = new Date();
    const bulanIniStr = formatBulanTahun(sekarang);
    const tglSekarangString = formatYYYYMMDD(sekarang);

    const riwayatBulanIni = riwayat?.filter(r => formatBulanTahun(r.waktuMulai) === bulanIniStr) || [];

    let totalMenitKonsul = 0;
    let mapelCount = {};
    let kelasHadir = 0;

    // 🛡️ ZERO HARDCODE STATUS & JENIS SESI
    riwayatBulanIni.forEach(r => {
      if (r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuSelesai) {
        totalMenitKonsul += Math.floor((new Date(r.waktuSelesai) - new Date(r.waktuMulai)) / 60000);
        const namaMapel = r.namaMapel || "Umum";
        mapelCount[namaMapel] = (mapelCount[namaMapel] || 0) + 1;
      }
      if (r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.SELESAI.id) {
        kelasHadir++;
        totalMenitKonsul += (r.konsulExtraMenit || 0); 
      }
    });

    const jadwalWajibBulanIni = jadwal?.filter(j => {
      const tglJadwalStr = formatYYYYMMDD(j.tanggal);
      return formatBulanTahun(j.tanggal) === bulanIniStr && 
             tglJadwalStr <= tglSekarangString && 
             j.kelasTarget === siswa.kelas;
    }).length || 0;
    
    const persenHadir = jadwalWajibBulanIni > 0 ? Math.round((kelasHadir / jadwalWajibBulanIni) * 100) : 100;
    const jamKonsul = Math.floor(totalMenitKonsul / 60);
    const menitSisa = totalMenitKonsul % 60;
    
    const mapelTerambis = Object.keys(mapelCount).length > 0 
      ? Object.keys(mapelCount).reduce((a, b) => mapelCount[a] > mapelCount[b] ? a : b) 
      : "-";

    let gelar = jamKonsul >= 30 ? "👑 Yang Punya Quantum" 
              : jamKonsul >= 20 ? "🔥 Sepuh Quantum" 
              : jamKonsul >= 10 ? "⚔️ Pejuang Ambis" 
              : jamKonsul >= 5 ? "🚀 Mulai Panas" 
              : "🐢 Masih Pemanasan";
    
    // 🛡️ ZERO HARDCODE TANGGAL UTBK
    const tanggalUTBK = new Date(EVENT_PENTING.TANGGAL_UTBK);
    const selisihHariUTBK = Math.max(0, Math.ceil((tanggalUTBK - sekarang) / (1000 * 60 * 60 * 24)));

    return { jamKonsul, menitSisa, persenHadir, kelasHadir, jadwalWajibBulanIni, mapelTerambis, gelar, selisihHariUTBK };
  }, [riwayat, jadwal, siswa.kelas]);

  const targetKonsul = statsBulanIni.jamKonsul >= 30 ? 50 : statsBulanIni.jamKonsul >= 20 ? 30 : statsBulanIni.jamKonsul >= 10 ? 20 : statsBulanIni.jamKonsul >= 5 ? 10 : 5;
  const persenMisiKonsul = (Math.min(statsBulanIni.jamKonsul, targetKonsul) / targetKonsul) * 100;

  const targetStreak = streakKonsul >= 14 ? 30 : streakKonsul >= 7 ? 14 : streakKonsul >= 3 ? 7 : 3;
  const persenMisiStreak = (Math.min(streakKonsul, targetStreak) / targetStreak) * 100;

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER & KARTU PENCAPAIAN SISWA */}
      {/* ------------------------------------------------------------- */}
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
            <p className={styles.teksSapaanKecil}>Selamat datang!</p>
            <h1 className={styles.teksNamaBesar}>{siswa.nama}</h1>
          </div>
          <div className={styles.badgeUser}>
             <span className={styles.teksBadge}>@{siswa.username}</span>
          </div>
        </div>

        <div className={styles.kartuInfo} style={{ marginTop: '-16px', zIndex: 20, position: 'relative' }}>
           <h2 className={styles.judulInfo}>Pencapaian Bulan Ini</h2>
           
           <div className={styles.badgeGelar}>{statsBulanIni.gelar}</div>

           <div className={styles.wadahGridStat}>
              <div className={styles.kotakStat}>
                <span className={styles.labelStat}>⏱️ Belajar</span>
                <span className={`${styles.nilaiStat} ${styles.nilaiStatBiru}`}>{statsBulanIni.jamKonsul}j {statsBulanIni.menitSisa}m</span>
              </div>
              <div className={styles.kotakStat}>
                <span className={styles.labelStat}>✅ Kehadiran</span>
                <span className={`${styles.nilaiStat} ${styles.nilaiStatHijau}`}>
                  {statsBulanIni.persenHadir}% 
                  <span style={{fontSize:'11px', color:'#64748b', marginLeft: '4px'}}>
                    ({statsBulanIni.kelasHadir}/{statsBulanIni.jadwalWajibBulanIni})
                  </span>
                </span>
              </div>
              <div className={styles.kotakStat}>
                <span className={styles.labelStat}>📚 Terambis</span>
                <span className={styles.nilaiStat} style={{fontSize: '14px'}}>{statsBulanIni.mapelTerambis}</span>
              </div>
              <div className={styles.kotakStat}>
                {(siswa.kelas?.includes("12") || siswa.kelas?.toLowerCase().includes("alumni")) ? (
                  <>
                    <span className={styles.labelStat}>⏳ UTBK 2026</span>
                    <span className={`${styles.nilaiStat} ${styles.nilaiStatMerah}`}>H-{statsBulanIni.selisihHariUTBK}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.labelStat}>🔥 Streak Konsul</span>
                    <span className={`${styles.nilaiStat} ${styles.nilaiStatMerah}`}>{streakKonsul} Hari</span>
                  </>
                )}
              </div>
           </div>

           <button onClick={() => setIsKlasemenOpen(true)} className={styles.tombolLihatTop10}>
              <FaTrophy size={18} /> Lihat Top 10 Ambis
           </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ARENA MISI (GAMIFIKASI) */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.wadahMisi}>
        <h3 className={`${styles.judulJadwal} ${styles.judulJadwalMisi}`}>
          <FaBullseye color="#ef4444" /> Target Berikutnya
        </h3>
        
        <div className={styles.daftarMisi}>
          <div className={styles.kartuMisi}>
            <div className={styles.headerKartuMisi}>
              <span className={styles.judulKartuMisi}>
                <FaStar color="#facc15" /> Kejar {targetKonsul} Jam!
              </span>
              {persenMisiKonsul >= 100 ? (
                <FaCircleCheck color="#22c55e" size={20} />
              ) : (
                <span className={styles.teksProgressMisi}>
                  {Math.min(statsBulanIni.jamKonsul, targetKonsul)}/{targetKonsul} Jam
                </span>
              )}
            </div>
            <div className={styles.wadahProgressTrack}>
              <div className={styles.progressIsi} style={{ width: `${persenMisiKonsul}%`, backgroundColor: persenMisiKonsul >= 100 ? '#4ade80' : '#facc15', borderRight: persenMisiKonsul > 0 && persenMisiKonsul < 100 ? '3px solid #111827' : 'none' }}></div>
            </div>
          </div>

          <div className={styles.kartuMisi}>
            <div className={styles.headerKartuMisi}>
              <span className={styles.judulKartuMisi}>
                <FaFire color="#ef4444" /> Streak {targetStreak} Hari!
              </span>
              {persenMisiStreak >= 100 ? (
                <FaCircleCheck color="#22c55e" size={20} />
              ) : (
                <span className={styles.teksProgressMisi}>
                  {Math.min(streakKonsul, targetStreak)}/{targetStreak} Hari
                </span>
              )}
            </div>
            <div className={styles.wadahProgressTrack}>
              <div className={styles.progressIsi} style={{ width: `${persenMisiStreak}%`, backgroundColor: persenMisiStreak >= 100 ? '#4ade80' : '#f87171', borderRight: persenMisiStreak > 0 && persenMisiStreak < 100 ? '3px solid #111827' : 'none' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* JADWAL KELAS HARI INI */}
      {/* ------------------------------------------------------------- */}
      <div style={{ padding: '0 16px', paddingBottom: '32px' }}>
        <h3 className={styles.judulJadwal}><FaCalendarDays color="#2563eb" /> Pengingat Kelas</h3>
        
        {jadwalAktif.length === 0 ? (
          <p className={styles.jadwalKosong}>Yeay! Tidak ada jadwal kelas untukmu hari ini.</p>
        ) : (
          <div className={styles.wadahDaftarJadwal} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jadwalAktif.map(({ item: j }) => (
              
              <div key={j._id} className={styles.kartuJadwalPintar} onClick={() => { setTab("scan"); setModeScan("kelas"); resetScanner(); }} style={{ cursor: 'pointer', backgroundColor: '#fdfbf7', border: '3px solid #111827', borderRadius: '12px', padding: '16px', boxShadow: '4px 4px 0 #111827', transition: 'transform 0.1s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#111827', backgroundColor: '#fef08a', padding: '4px 8px', borderRadius: '6px', border: '2px solid #111827', textTransform: 'uppercase' }}>
                    {/* 🛡️ ZERO HARDCODE TIMEZONE */}
                    {new Date(j.tanggal).toLocaleDateString('id-ID', { timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                  
                  {j.pertemuan && (
                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'white', backgroundColor: '#2563eb', padding: '4px 8px', borderRadius: '6px', border: '2px solid #111827', textTransform: 'uppercase' }}>
                      P-{j.pertemuan}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className={styles.hariJadwal} style={{ margin: 0, fontSize: '20px', color: '#111827', letterSpacing: '-0.5px' }}>{j.mapel}</p>
                  <div className={styles.waktuJadwal} style={{ margin: 0, backgroundColor: 'white', color: '#ef4444', border: '2px solid #111827', boxShadow: '2px 2px 0 #111827', padding: '4px 8px' }}>
                    {j.jamMulai} - {j.jamSelesai}
                  </div>
                </div>

                {j.pengajar && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '8px', border: '2px dashed #9ca3af' }}>
                    <FaUserTie color="#2563eb" size={14} /> 
                    <span>Pengajar: <span style={{ color: '#111827', fontWeight: '900' }}>{j.pengajar}</span></span>
                  </div>
                )}

              </div>

            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL BOTTOM SHEET: PAPAN KLASEMEN */}
      {/* ------------------------------------------------------------- */}
      {isKlasemenOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsKlasemenOpen(false)}>
          <div className={styles.modalKonten} onClick={(e) => e.stopPropagation()}>
            <button className={styles.tombolTutupModal} onClick={() => setIsKlasemenOpen(false)}>X</button>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', textTransform: 'uppercase', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaTrophy color="#facc15" /> Top 10 Ambis</h2>
            
            {loadingKlasemen ? (
              <div className={styles.wadahKlasemen}>{[1, 2, 3].map(i => <div key={i} className={styles.kotakPesanLoading} style={{ height: '80px', borderRadius: '16px' }}></div>)}</div>
            ) : dataKlasemen.length === 0 ? (
              <p className={styles.jadwalKosong}>Belum ada data konsul bulan ini.</p>
            ) : (
              <div className={styles.wadahKlasemen}>
                {dataKlasemen.map((sis) => (
                  <div key={sis.idSiswa} className={`${styles.kartuPeringkat} ${sis.peringkat === 1 ? styles.juara1 : sis.peringkat === 2 ? styles.juara2 : sis.peringkat === 3 ? styles.juara3 : ""}`}>
                    <div className={styles.kiriPeringkat}>
                      <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                        {sis.peringkat === 1 ? <FaCrown color="white" size={28} /> : sis.peringkat === 2 ? <FaMedal color="#64748b" size={24} /> : sis.peringkat === 3 ? <FaMedal color="#b45309" size={24} /> : <span className={styles.angkaPeringkat}>{sis.peringkat}</span>}
                      </div>
                      <div className={styles.infoPeringkat}><p className={styles.namaPeringkat}>{sis.namaTampil}</p><span className={styles.gelarPeringkat}>{sis.gelar}</span></div>
                    </div>
                    <div className={styles.kananPeringkat}><div className={styles.waktuPeringkat}>{sis.jam}j {sis.menit}m</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}