"use client";

import { useState, useMemo, memo } from "react";
import Image from "next/image";
import { 
  FaChalkboard, FaClock, FaArrowRightToBracket, 
  FaChevronDown, FaChevronUp, FaCalendarDay, FaCirclePlay, 
  FaHourglassHalf, FaCalendarCheck 
} from "react-icons/fa6";

import { timeHelper } from "../../utils/timeHelper";
import ModalJurnal from "./ModalJurnal"; 
import styles from "../App.module.css";

// ============================================================================
// 1. SUB-KOMPONEN: HEADER PENGAJAR
// ============================================================================
const HeaderPengajar = memo(({ dataUser, statsPengajar }) => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <div className={styles.identityContainer}>
      <p className={styles.welcomeText}>Selamat mengajar!</p>
      <h1 className={styles.userName}>{dataUser?.nama || "Pengajar Quantum"}</h1>
      <div className={styles.containerIdNumber}>
         <span className={styles.IdNumber}>Kode: {dataUser?.kodePengajar} | ID: {dataUser?.nomorPeserta}</span>
      </div>
    </div>
    <div className={styles.infoContainer} style={{ marginBottom: '0', marginTop: '24px' }}>
       <h2 className={styles.infoHeader}>Ringkasan Mengajar Bulan Ini</h2>
       <div className={styles.statGridContainer} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className={styles.statContainer}>
            <span className={styles.statLabel} style={{fontSize: '11px'}}>Total Sesi</span>
            <span className={`${styles.statValue} ${styles.nilaiStatBiru}`}>{statsPengajar.totalKelas}</span>
          </div>
          <div className={styles.statContainer}>        
            <span className={styles.statLabel} style={{fontSize: '11px'}}>Jurnal OK</span>
            <span className={`${styles.statValue} ${styles.nilaiStatHijau}`}>{statsPengajar.jurnalSelesai}</span>
          </div>
          <div className={styles.statContainer}>        
            <span className={styles.statLabel} style={{fontSize: '11px'}}>Absensi</span>
            <span className={`${styles.statValue} ${styles.nilaiStatMerah}`}>{statsPengajar.totalAbsensi}</span>
          </div>
       </div>
    </div>
  </div>
));
HeaderPengajar.displayName = "HeaderPengajar";

// ============================================================================
// 2. SUB-KOMPONEN: AGENDA HARI INI
// ============================================================================
const AgendaHariIni = memo(({ jadwalHariIni, onPilihJadwal }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaChalkboard color="#2563eb" /> Agenda Hari Ini</h3>
    
    {jadwalHariIni.length === 0 ? (
      <p className={styles.emptySchedule}>Tidak ada jadwal kelas untukmu hari ini. Ayo ajak adek-adeknya konsul!</p>
    ) : (
      <div className={styles.scheduleList}>
        {jadwalHariIni.map((j) => (
          <div 
            key={j._id} 
            onClick={() => onPilihJadwal(j)} 
            className={styles.scheduleCard} 
            style={{ backgroundColor: '#ffffff', border: '3px solid #111827', cursor: 'pointer', boxShadow: '4px 4px 0 #111827' }}
          >
            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleDate} style={{ color: '#2563eb', fontWeight: '900' }}>
                <FaCalendarDay /> HARI INI
              </div>
              <div className={styles.scheduleTime} style={{ fontWeight: '900' }}>{j.jamMulai} - {j.jamSelesai}</div>
            </div>
            <div className={styles.scheduleCardRow}>
              <p className={styles.scheduleSubject} style={{ fontSize: '18px' }}>{j.mapel}</p>
            </div>
            <div className={styles.scheduleCardRow}>
              <div style={{ backgroundColor: '#fef08a', color: '#111827', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', border: '2px solid #111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCirclePlay /> MULAI KELAS
              </div>
              <div className={styles.scheduleCount} style={{ fontWeight: '900' }}>{j.kelasTarget}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));
AgendaHariIni.displayName = "AgendaHariIni";

// ============================================================================
// 3. SUB-KOMPONEN: ABSENCE CARD
// ============================================================================
const AbsenceCard = memo(({ abs, isOpen, onToggle }) => {
  const isSelesai = !!abs.waktuKeluar;
  const formatWaktu = (date) => new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatTanggal = (date) => new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={`${styles.recordCard} ${styles.recordCardClickable}`} onClick={() => onToggle(abs._id)} style={{ border: '3px solid #111827', margin: '0 0 20px'}}>
      <div className={styles.recordCardRow}>
        <p className={styles.recordDate}>{formatTanggal(abs.waktuMasuk)}</p>
        
        {!isSelesai && (
          <span className={styles.recordDuration} style={{ backgroundColor: '#fef08a', color: '#111827', border: '2px solid #111827', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <FaHourglassHalf className={styles.spin} /> Bertugas
          </span>
        )}
        
        <div style={{ color: '#111827' }}>
          {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className={styles.recordDetail} style={{ marginTop: '12px' }}>
            <div className={styles.recordDetailRow} style={{ backgroundColor: '#dbeafe', border: '2px solid #111827', marginBottom: '4px' }}>
              <span>Clock In</span>
              <span style={{ fontWeight: '900' }}>{formatWaktu(abs.waktuMasuk)} WIB</span>
            </div>
            <div className={styles.recordDetailRow} style={{ backgroundColor: isSelesai ? '#dcfce3' : '#fef08a', border: '2px solid #111827' }}>
              <span>Clock Out</span>
              <span style={{ fontWeight: '900' }}>{isSelesai ? `${formatWaktu(abs.waktuKeluar)} WIB` : 'Sedang Bertugas...'}</span>
            </div>
        </div>
      )}
    </div>
  );
});
AbsenceCard.displayName = "AbsenceCard";

// ============================================================================
// 4. SUB-KOMPONEN: DAFTAR ABSENSI BULAN INI
// ============================================================================
const DaftarAbsensiBulanIni = memo(({ riwayatAbsenBulanIni, idAbsenTerbuka, toggleAbsen }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaClock color="#facc15" /> Absensi Bulan Ini</h3>
    
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px'}}>
      {riwayatAbsenBulanIni.length === 0 ? (
        <p className={styles.emptySchedule}>Belum ada riwayat absensi bulan ini.</p>
      ) : (
        riwayatAbsenBulanIni.map(abs => (
          <AbsenceCard 
            key={abs._id} 
            abs={abs} 
            isOpen={idAbsenTerbuka === abs._id} 
            onToggle={toggleAbsen} 
          />
        ))
      )}
    </div>
  </div>
));
DaftarAbsensiBulanIni.displayName = "DaftarAbsensiBulanIni";

// ============================================================================
// 5. MAIN COMPONENT (Kini Sangat Bersih!)
// ============================================================================
export default function TabBerandaPengajar({ dataUser, jadwal = [], absensi = [], absenAktif }) {
  const hariIni = timeHelper.getTglJakarta();
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  const [idAbsenTerbuka, setIdAbsenTerbuka] = useState(null);

  const toggleAbsen = (id) => setIdAbsenTerbuka(prev => prev === id ? null : id);

  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => j?.tanggal === hariIni && !j.bab)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)), 
  [jadwal, hariIni]);

  const riwayatAbsenBulanIni = useMemo(() => absensi || [], [absensi]);

  const statsPengajar = useMemo(() => ({ 
    totalKelas: (jadwal || []).length, 
    jurnalSelesai: (jadwal || []).filter(j => j?.bab).length,
    totalAbsensi: (absensi || []).length 
  }), [jadwal, absensi]);

  return (
    <div className={styles.contentArea}>
      <HeaderPengajar 
        dataUser={dataUser} 
        statsPengajar={statsPengajar} 
      />
      
      <AgendaHariIni 
        jadwalHariIni={jadwalHariIni} 
        onPilihJadwal={setJadwalTerpilih} 
      />

      <DaftarAbsensiBulanIni 
        riwayatAbsenBulanIni={riwayatAbsenBulanIni} 
        idAbsenTerbuka={idAbsenTerbuka} 
        toggleAbsen={toggleAbsen} 
      />

      {jadwalTerpilih && (
        <ModalJurnal 
          jadwalTerpilih={jadwalTerpilih} 
          hariIni={hariIni} 
          onClose={() => setJadwalTerpilih(null)} 
        />
      )}
    </div>
  );
}