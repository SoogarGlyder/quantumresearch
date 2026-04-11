"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useMemo, useState, useEffect, memo } from "react"; 
import Image from "next/image"; 
import { useRouter } from "next/navigation"; 

import { pilahJadwalSiswa } from "../../utils/kalkulatorData";
import { 
  PERIODE_BELAJAR, TIPE_SESI, STATUS_SESI, EVENT_PENTING, GAMIFIKASI 
} from "../../utils/constants";
import { cekDanGenerateMisiHarian, klaimHadiahMisi } from "../../actions/misiAction"; 
import { formatYYYYMMDD, formatBulanTahun } from "../../utils/formatHelper";

import { 
  FaCalendarDays, FaBullseye, FaStar, FaFire, FaCircleCheck, 
  FaTrophy, FaUserTie, FaListCheck, FaGift, FaBookOpen, FaLink, FaPen
} from "react-icons/fa6";
import styles from "../App.module.css";

// 🚀 IMPORT KEDUA MODAL YANG SUDAH DIPISAH
import ModalKlasemen from "./ModalKlasemen";
import ModalIframeTugas from "./ModalIframeTugas";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER & PENCAPAIAN 
// ============================================================================
const HeaderSiswa = memo(({ siswa, statsBulanIni, streakKonsul, onBukaKlasemen }) => {
  const expSaatIni = siswa.totalExp || 0;
  const expPerLevel = 500; 
  const levelSiswa = Math.floor(expSaatIni / expPerLevel) + 1;
  const expSisaUntukNaik = expSaatIni % expPerLevel;
  const persenLevel = Math.round((expSisaUntukNaik / expPerLevel) * 100);
  const lencanaSiswa = siswa.koleksiLencana || [];

  return (
    <div className={styles.appHeader}>
      <div className={styles.shapeRed}></div>
      <div className={styles.shapeYellow}></div>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
        </div>
      </div>
      
      <div className={styles.identityContainer}>
        <div style={{ width: '100%' }}>
          <p className={styles.welcomeText}>Selamat datang!</p>
          <h1 className={styles.userName}>{siswa.nama}</h1>
          
          <div style={{ marginTop: '12px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '10px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaStar color="#facc15" /> Level {levelSiswa}</span>
              <span>{expSisaUntukNaik} / {expPerLevel} EXP</span>
            </div>
            <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${persenLevel}%`, backgroundColor: '#4ade80', height: '100%', borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
            </div>
          </div>

          {lencanaSiswa.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {lencanaSiswa.map((lencana, index) => {
                const info = GAMIFIKASI.KAMUS_LENCANA[lencana.idLencana];
                if (!info) return null; 
                return (
                  <div key={index} style={{ backgroundColor: info.warna, padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title={`Didapat pada: ${new Date(lencana.tanggalDidapat).toLocaleDateString('id-ID')}`}>
                    {info.ikon} {info.nama}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className={styles.containerIdNumber} style={{ marginTop: '12px' }}>
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
                <span style={{fontSize:'11px', color:'#64748b', marginLeft: '4px'}}>({statsBulanIni.kelasHadir}/{statsBulanIni.jadwalWajibBulanIni})</span>
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

         <button onClick={onBukaKlasemen} className={styles.top10Button}>
            <FaTrophy size={18} /> Lihat Top 10 Ambis
         </button>
      </div>
    </div>
  );
});
HeaderSiswa.displayName = "HeaderSiswa";

// ============================================================================
// 3. SUB-KOMPONEN: ARENA MISI BULANAN
// ============================================================================
const ArenaMisiBulanan = memo(({ targetKonsul, persenMisiKonsul, statsBulanIni, targetStreak, persenMisiStreak, streakKonsul }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaBullseye color="#ef4444" /> Target Berikutnya</h3>
    <div className={styles.missionList}>
      <div className={styles.missionCard}>
        <div className={styles.missionCardHeader}>
          <span className={styles.missionCardTitle}><FaStar color="#facc15" /> Kejar {targetKonsul} Jam!</span>
          {persenMisiKonsul >= 100 ? <FaCircleCheck color="#22c55e" size={20} /> : <span className={styles.missionCardProgress}>{Math.min(statsBulanIni.jamKonsul, targetKonsul)}/{targetKonsul} Jam</span>}
        </div>
        <div className={styles.progressTrackContainer}>
          <div className={styles.progressTrackValue} style={{ width: `${persenMisiKonsul}%`, backgroundColor: persenMisiKonsul >= 100 ? '#4ade80' : '#facc15' }}></div>
        </div>
      </div>
      <div className={styles.missionCard}>
        <div className={styles.missionCardHeader}>
          <span className={styles.missionCardTitle}><FaFire color="#ef4444" /> Streak {targetStreak} Hari!</span>
          {persenMisiStreak >= 100 ? <FaCircleCheck color="#22c55e" size={20} /> : <span className={styles.missionCardProgress}>{Math.min(streakKonsul, targetStreak)}/{targetStreak} Hari</span>}
        </div>
        <div className={styles.progressTrackContainer}>
          <div className={styles.progressTrackValue} style={{ width: `${persenMisiStreak}%`, backgroundColor: persenMisiStreak >= 100 ? '#4ade80' : '#f87171' }}></div>
        </div>
      </div>
    </div>
  </div>
));
ArenaMisiBulanan.displayName = "ArenaMisiBulanan";

// ============================================================================
// 4. SUB-KOMPONEN: ARENA MISI HARIAN 
// ============================================================================
const ArenaMisiHarian = memo(({ misiHarian, loadingMisi, onKlaim }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaListCheck color="#8b5cf6" /> Misi Hari Ini</h3>
    {loadingMisi ? (
      <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '14px' }}>Mencari misi baru...</div>
    ) : misiHarian.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '14px' }}>Belum ada misi hari ini.</div>
    ) : (
      <div className={styles.missionList}>
        {misiHarian.map((misi, index) => (
          <div key={misi.kodeMisi || index} className={styles.missionCard} style={{ backgroundColor: misi.diklaim ? '#4ade80' : misi.selesai ? '#facc15' : '#ffffff' }}>
            <div className={styles.missionCardHeader}>
              <span className={styles.missionCardTitle} style={{ color: misi.diklaim ? '#64748b' : '#111827', textDecoration: misi.diklaim ? 'line-through' : 'none' }}>{misi.judul}</span>
              <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><FaGift /> +{misi.expBonus} EXP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span className={styles.missionCardProgress}>{misi.progress}/{misi.target}</span>
              {misi.diklaim ? (
                <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><FaCircleCheck /> Diklaim</span>
              ) : misi.selesai ? (
                <button onClick={() => onKlaim(misi._id)} style={{ backgroundColor: '#facc15', color: '#111827', padding: '6px 14px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Klaim Hadiah</button>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sedang Berjalan</span>
              )}
            </div>
            {!misi.diklaim && (
              <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${(misi.progress / misi.target) * 100}%`, backgroundColor: misi.selesai ? '#facc15' : '#cbd5e1', height: '100%', transition: 'width 0.5s' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
));
ArenaMisiHarian.displayName = "ArenaMisiHarian";

// ============================================================================
// 5. SUB-KOMPONEN: JADWAL KELAS HARI INI
// ============================================================================
const JadwalHariIni = memo(({ jadwalAktif, setTab, setModeScan, resetScanner }) => {
  const tglHariIni = formatYYYYMMDD(new Date());
  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}><FaCalendarDays color="#2563eb" /> Pengingat Kelas</h3>
      {jadwalAktif.length === 0 ? (
        <p className={styles.emptySchedule}>Yeay! Tidak ada jadwal kelas untukmu hari ini. Ayo Konsul!</p>
      ) : (
        <div className={styles.scheduleList}>
          {jadwalAktif.map(({ item: j }) => {
            const isHariIni = j.tanggal === tglHariIni;
            return (
              <div key={j._id} className={styles.scheduleCard} onClick={isHariIni ? () => { setTab("scan"); setModeScan("kelas"); resetScanner(); } : undefined} style={isHariIni ? { backgroundColor: '#ffebcd', cursor: 'pointer' } : { cursor: 'default', opacity: 0.8, pointerEvents: 'none' }}>
                <div className={styles.scheduleCardRow}>
                  <div className={styles.scheduleDate}>{new Date(j.tanggal).toLocaleDateString('id-ID',{ timeZone: PERIODE_BELAJAR.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' })}</div>
                  <div className={styles.scheduleTime}>{j.jamMulai} - {j.jamSelesai}</div>
                </div>
                <div className={styles.scheduleCardRow}><p className={styles.scheduleSubject}>{j.mapel}</p></div>
                <div className={styles.scheduleCardRow}>
                  {j.kodePengajar && (<div className={styles.scheduleTeacher}><FaUserTie color="#2563eb" size={14} /> <span>Pengajar: <span className={styles.teacherName}>{j.kodePengajar}</span></span></div>)}
                  <div className={styles.scheduleCount}><span>P-{j.pertemuan}</span></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
});
JadwalHariIni.displayName = "JadwalHariIni";

// ============================================================================
// 6. SUB-KOMPONEN: LATIHAN SOAL HARI INI (BARU)
// ============================================================================
const LatihanHariIni = memo(({ latihanHariIni, setUrlMitra }) => {
  return (
    <div className={styles.contentContainer}>
      <h3 className={styles.contentTitle}><FaBookOpen color="#2563eb" /> Latihan Soal Hari Ini</h3>
      <div className={styles.missionList}>
      {latihanHariIni ? (  
        <div className={styles.missionCard} style={{ cursor: 'pointer', padding: '0', overflow: 'hidden' }} onClick={() => setUrlMitra(latihanHariIni.url)}>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb' }}><FaPen size={18} /></div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>{latihanHariIni.judul}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaUserTie size={10} /> {latihanHariIni.namaPembuat || "Admin Quantum"}
                  </span>
                </div>
              </div>
            </div>
            <button style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
              Kerjakan Sekarang <FaLink size={12} />
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.emptySchedule}>Yeay! Tidak ada latihan soal untuk hari ini. Ayo Konsul!</p>
      )}
      </div>
    </div>
  );
});
LatihanHariIni.displayName = "LatihanHariIni";

// ============================================================================
// 7. MAIN EXPORT COMPONENT
// ============================================================================
export default function TabBerandaSiswa({ siswa, jadwal, riwayat, setTab, setModeScan, resetScanner, latihanHariIni }) {
  const router = useRouter();
  
  const [isKlasemenOpen, setIsKlasemenOpen] = useState(false);
  const [misiHarian, setMisiHarian] = useState([]);
  const [loadingMisi, setLoadingMisi] = useState(true);
  const [urlMitra, setUrlMitra] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoadingMisi(true);
    cekDanGenerateMisiHarian().then(res => {
      if (isMounted && res.sukses) {
        setMisiHarian(res.data);
      }
      if (isMounted) setLoadingMisi(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleKlaimMisi = async (idMisi) => {
    const hasil = await klaimHadiahMisi(idMisi);
    if (hasil.sukses) {
      setMisiHarian(prev => prev.map(m => m._id === idMisi ? { ...m, diklaim: true } : m));
      router.refresh();
      alert(hasil.pesan);
    } else {
      alert(hasil.pesan);
    }
  };

  const { jadwalAktif } = useMemo(() => pilahJadwalSiswa(jadwal, riwayat, PERIODE_BELAJAR.MULAI, PERIODE_BELAJAR.AKHIR), [jadwal, riwayat]);

  const streakKonsul = useMemo(() => {
    if (!riwayat || riwayat.length === 0) return 0;
    const daftarLibur = EVENT_PENTING.TANGGAL_LIBUR || [];
    const tanggalUnikKonsul = new Set(
      riwayat.filter(r => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.SELESAI.id && r.waktuMulai)
             .map(r => formatYYYYMMDD(r.waktuMulai))
    );
    const hariIni = new Date();
    let tanggalCek = new Date(hariIni);
    let totalStreak = 0;

    while (true) {
      const tglStr = formatYYYYMMDD(tanggalCek);
      const isMinggu = tanggalCek.getDay() === 0;
      const isLibur = daftarLibur.includes(tglStr);
      if (tanggalUnikKonsul.has(tglStr)) break; 
      if (isMinggu || isLibur) { tanggalCek.setDate(tanggalCek.getDate() - 1); continue; }
      tanggalCek.setDate(tanggalCek.getDate() - 1);
      const tglKemarinStr = formatYYYYMMDD(tanggalCek);
      if (!tanggalUnikKonsul.has(tglKemarinStr) && tanggalCek.getDay() !== 0 && !daftarLibur.includes(tglKemarinStr)) return 0;
      break;
    }
    
    while (true) {
      const tglStr = formatYYYYMMDD(tanggalCek);
      const isMinggu = tanggalCek.getDay() === 0;
      const isLibur = daftarLibur.includes(tglStr);
      if (tanggalUnikKonsul.has(tglStr)) { totalStreak++; tanggalCek.setDate(tanggalCek.getDate() - 1); }
      else if (isMinggu || isLibur) { tanggalCek.setDate(tanggalCek.getDate() - 1); }
      else { break; }
    }
    return totalStreak;
  }, [riwayat]);

  const statsBulanIni = useMemo(() => {
    const sekarang = new Date();
    const bulanIniStr = formatBulanTahun(sekarang);
    const tglSekarangString = formatYYYYMMDD(sekarang);
    const riwayatBulanIni = riwayat?.filter(r => formatBulanTahun(r.waktuMulai) === bulanIniStr) || [];
    let totalMenitKonsul = 0;
    let mapelCount = {};
    let kelasHadir = 0;

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
      return formatBulanTahun(j.tanggal) === bulanIniStr && tglJadwalStr <= tglSekarangString && j.kelasTarget === siswa.kelas;
    }).length || 0;
    
    const persenHadir = jadwalWajibBulanIni > 0 ? Math.round((kelasHadir / jadwalWajibBulanIni) * 100) : 100;
    const jamKonsul = Math.floor(totalMenitKonsul / 60);
    const menitSisa = totalMenitKonsul % 60;
    const mapelTerambis = Object.keys(mapelCount).length > 0 ? Object.keys(mapelCount).reduce((a, b) => mapelCount[a] > mapelCount[b] ? a : b) : "-";
    const gelarMatch = GAMIFIKASI.GELAR_KLASEMEN.find(g => jamKonsul >= g.minJam);
    const gelar = gelarMatch ? gelarMatch.gelar : "🐢 Masih Pemanasan";
    const tanggalUTBK = new Date(EVENT_PENTING.TANGGAL_UTBK);
    const selisihHariUTBK = Math.max(0, Math.ceil((tanggalUTBK - sekarang) / (1000 * 60 * 60 * 24)));

    return { jamKonsul, menitSisa, persenHadir, kelasHadir, jadwalWajibBulanIni, mapelTerambis, gelar, selisihHariUTBK };
  }, [riwayat, jadwal, siswa.kelas]);

  const targetKonsul = statsBulanIni.jamKonsul >= 30 ? 50 : statsBulanIni.jamKonsul >= 20 ? 30 : statsBulanIni.jamKonsul >= 10 ? 20 : statsBulanIni.jamKonsul >= 5 ? 10 : 5;
  const persenMisiKonsul = (Math.min(statsBulanIni.jamKonsul, targetKonsul) / targetKonsul) * 100;
  const targetStreak = streakKonsul >= 14 ? 30 : streakKonsul >= 7 ? 14 : streakKonsul >= 3 ? 7 : 3;
  const persenMisiStreak = (Math.min(streakKonsul, targetStreak) / targetStreak) * 100;

  return (
    <div className={styles.contentArea}>
      <HeaderSiswa siswa={siswa} statsBulanIni={statsBulanIni} streakKonsul={streakKonsul} onBukaKlasemen={() => setIsKlasemenOpen(true)} />
      
      <ArenaMisiBulanan targetKonsul={targetKonsul} persenMisiKonsul={persenMisiKonsul} statsBulanIni={statsBulanIni} targetStreak={targetStreak} persenMisiStreak={persenMisiStreak} streakKonsul={streakKonsul} />
      
      <ArenaMisiHarian misiHarian={misiHarian} loadingMisi={loadingMisi} onKlaim={handleKlaimMisi} />
      
      <JadwalHariIni jadwalAktif={jadwalAktif} setTab={setTab} setModeScan={setModeScan} resetScanner={resetScanner} />
      
      <LatihanHariIni latihanHariIni={latihanHariIni} setUrlMitra={setUrlMitra} />

      {isKlasemenOpen && <ModalKlasemen onClose={() => setIsKlasemenOpen(false)} kelasSiswa={siswa.kelas} />}
      <ModalIframeTugas urlMitra={urlMitra} onClose={() => setUrlMitra(null)} />

    </div>
  );
}