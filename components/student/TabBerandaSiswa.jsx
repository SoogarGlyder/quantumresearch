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
export default function TabBerandaSiswa({ siswa, jadwal, riwayat, setTab, setModeScan, resetScanner }) {
  
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
    <div className={styles.contentArea}>
      {/* ------------------------------------------------------------- */}
      {/* HEADER & KARTU PENCAPAIAN SISWA */}
      {/* ------------------------------------------------------------- */}
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
            <p className={styles.welcomeText}>Selamat datang!</p>
            <h1 className={styles.userName}>{siswa.nama}</h1>
          </div>
          <div className={styles.containerIdNumber}>
             <span className={styles.IdNumber}>{siswa.username} | {siswa.nomorPeserta}</span>
          </div>
        </div>

        <div className={styles.infoContainer}>
           <h2 className={styles.infoHeader}>Pencapaian Bulan Ini</h2>
           
           <div className={styles.titleBadge}>{statsBulanIni.gelar}</div>

           <div className={styles.statGridContainer}>
              <div className={styles.statContainer}>
                <span className={styles.statLabel}>⏱️ Belajar</span>
                <span className={`${styles.statValue} ${styles.nilaiStatBiru}`}>{statsBulanIni.jamKonsul}j {statsBulanIni.menitSisa}m</span>
              </div>
              <div className={styles.statContainer}>
                <span className={styles.statLabel}>✅ Kehadiran</span>
                <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>
                  {statsBulanIni.persenHadir}% 
                  <span style={{fontSize:'11px', color:'#64748b', marginLeft: '4px'}}>
                    ({statsBulanIni.kelasHadir}/{statsBulanIni.jadwalWajibBulanIni})
                  </span>
                </span>
              </div>
              <div className={styles.statContainer}>
                <span className={styles.statLabel}>📚 Terambis</span>
                <span className={styles.statValue} style={{fontSize: '14px'}}>{statsBulanIni.mapelTerambis}</span>
              </div>
              <div className={styles.statContainer}>
                {(siswa.kelas?.includes("12") || siswa.kelas?.toLowerCase().includes("alumni")) ? (
                  <>
                    <span className={styles.statLabel}>⏳ UTBK 2026</span>
                    <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>H-{statsBulanIni.selisihHariUTBK}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.statLabel}>🔥 Streak Konsul</span>
                    <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>{streakKonsul} Hari</span>
                  </>
                )}
              </div>
           </div>

           <button onClick={() => setIsKlasemenOpen(true)} className={styles.top10Button}>
              <FaTrophy size={18} /> Lihat Top 10 Ambis
           </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ARENA MISI (GAMIFIKASI) */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.contentContainer}>
        <h3 className={styles.contentTitle}>
          <FaBullseye color="#ef4444" /> Target Berikutnya
        </h3>
        
        <div className={styles.missionList}>
          <div className={styles.missionCard}>
            <div className={styles.missionCardHeader}>
              <span className={styles.missionCardTitle}>
                <FaStar color="#facc15" /> Kejar {targetKonsul} Jam!
              </span>
              {persenMisiKonsul >= 100 ? (
                <FaCircleCheck color="#22c55e" size={20} />
              ) : (
                <span className={styles.missionCardProgress}>
                  {Math.min(statsBulanIni.jamKonsul, targetKonsul)}/{targetKonsul} Jam
                </span>
              )}
            </div>
            <div className={styles.progressTrackContainer}>
              <div className={styles.progressTrackValue} style={{ width: `${persenMisiKonsul}%`, backgroundColor: persenMisiKonsul >= 100 ? '#4ade80' : '#facc15', borderRight: persenMisiKonsul > 0 && persenMisiKonsul < 100 ? '3px solid #111827' : 'none' }}></div>
            </div>
          </div>

          <div className={styles.missionCard}>
            <div className={styles.missionCardHeader}>
              <span className={styles.missionCardTitle}>
                <FaFire color="#ef4444" /> Streak {targetStreak} Hari!
              </span>
              {persenMisiStreak >= 100 ? (
                <FaCircleCheck color="#22c55e" size={20} />
              ) : (
                <span className={styles.missionCardProgress}>
                  {Math.min(streakKonsul, targetStreak)}/{targetStreak} Hari
                </span>
              )}
            </div>
            <div className={styles.progressTrackContainer}>
              <div className={styles.progressTrackValue} style={{ width: `${persenMisiStreak}%`, backgroundColor: persenMisiStreak >= 100 ? '#4ade80' : '#f87171', borderRight: persenMisiStreak > 0 && persenMisiStreak < 100 ? '3px solid #111827' : 'none' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* JADWAL KELAS HARI INI */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.contentContainer}>
        <h3 className={styles.contentTitle}>
          <FaCalendarDays color="#2563eb" /> Pengingat Kelas
        </h3>
        
        {jadwalAktif.length === 0 ? (
          <p className={styles.emptySchedule}>Yeay! Tidak ada jadwal kelas untukmu hari ini.</p>
        ) : (
          <div className={styles.scheduleList}>
            {jadwalAktif.map(({ item: j }) => (
              
              <div key={j._id} className={styles.scheduleCard} onClick={() => { setTab("scan"); setModeScan("kelas"); resetScanner(); }}>
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleDate}>
                    {new Date(j.tanggal).toLocaleDateString('id-ID',{
                      timeZone: PERIODE_BELAJAR.TIMEZONE,
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <div className={styles.scheduleTime}>
                    {j.jamMulai} - {j.jamSelesai}
                  </div>
                </div>
                
                <div className={styles.scheduleCardRow}>
                  {j.pertemuan && (
                    <div className={styles.scheduleCount}>
                      P-{j.pertemuan}
                    </div>
                  )}
                  <p className={styles.scheduleSubject}>
                    {j.mapel}
                  </p>
                </div>

                <div className={styles.scheduleCardRow}>
                {j.kodePengajar && (
                  <div className={styles.scheduleTeacher}>
                    <FaUserTie color="#2563eb" size={14} /> 
                    <span>Pengajar: <span className={styles.teacherName}>{j.kodePengajar}</span></span>
                  </div>
                )}
                </div>
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
              <p className={styles.emptySchedule}>Belum ada data konsul bulan ini.</p>
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