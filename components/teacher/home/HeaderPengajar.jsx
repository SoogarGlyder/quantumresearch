"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaBuildingShield, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { PANGKAT_PENGAJAR } from "@/utils/constants";
import styles from "@/components/App.module.css";
import homeStyles from "@/components/teacher/home/Home.module.css";

// ============================================================================
// KOMPONEN HELPER: DONUT CHART NEO-BRUTALISM (Pure CSS)
// ============================================================================
const DonutChartMini = memo(({ data }) => {
  const totalSesi = data.reduce((sum, d) => sum + d.value, 0);
  let currentPercent = 0;
  
  const gradientStops = data.map(d => {
    const p = totalSesi > 0 ? (d.value / totalSesi) * 100 : 0;
    const stop = `${d.color} ${currentPercent}% ${currentPercent + p}%`;
    currentPercent += p;
    return stop;
  }).join(", ");

  if (totalSesi === 0) {
    return (
      <div className={homeStyles.wadahPlaceholder}>
        <span className={homeStyles.teksPlaceholder}>Belum ada data bulan ini</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
      {/* Lingkaran Donut */}
      <div style={{
        width: '90px', height: '90px', borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${gradientStops})`,
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '3px solid #111827', boxShadow: '4px 4px 0 #111827'
      }}>
        {/* Lubang Donut Tengah */}
        <div style={{ 
          width: '45px', height: '45px', backgroundColor: '#fdfbf7', borderRadius: '50%', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          border: '3px solid #111827' 
        }}>
          <span style={{ fontSize: '14px', fontWeight: '900', color: '#111827', lineHeight: '1' }}>{totalSesi}</span>
        </div>
      </div>

      {/* Daftar Legenda Kanan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, maxHeight: '90px', overflowY: 'auto', paddingRight: '4px' }}>
        {data.map((d, i) => {
          const p = totalSesi > 0 ? (d.value / totalSesi) * 100 : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: d.color, borderRadius: '4px', border: '2px solid #111827', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontWeight: '900', color: '#111827' }}>
                <span style={{ maxWidth: '80px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                <span>{p.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
DonutChartMini.displayName = "DonutChartMini";

// ============================================================================
// SUB-KOMPONEN SLIDER
// ============================================================================
const SlideRingkasan = memo(({ statsPengajar, jamKonsul, menitKonsul, totalSesiKonsul }) => (
  <div className={homeStyles.animasiSlideMasuk}>
    <div className={`${homeStyles.statGridContainer} ${homeStyles.statGrid3Col}`}>
      <div className={homeStyles.statContainer}>
        <span className={homeStyles.statLabel}>Total Sesi</span>
        <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatBiru}`}>
          {statsPengajar?.totalKelas || 0}
        </span>
      </div>
      <div className={homeStyles.statContainer}>
        <span className={homeStyles.statLabel}>Jurnal OK</span>
        <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatHijau}`}>
          {statsPengajar?.jurnalSelesai || 0}
        </span>
      </div>
      <div className={homeStyles.statContainer}>
        <span className={homeStyles.statLabel}>Presensi</span>
        <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatMerah}`}>
          {statsPengajar?.totalAbsensi || 0}
        </span>
      </div>
    </div>
    <div className={`${homeStyles.statGridContainer} ${homeStyles.statGrid2Col}`}>
      <div className={homeStyles.statContainer}>
        <span className={homeStyles.statLabel}>Durasi Konsul</span>
        <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatBiru}`}>
          {jamKonsul > 0 ? `${jamKonsul}j ` : ""}{menitKonsul}m
        </span>
      </div>
      <div className={homeStyles.statContainer}>
        <span className={homeStyles.statLabel}>Sesi Konsul</span>
        <span className={`${homeStyles.statValue} ${homeStyles.nilaiStatHijau}`}>
          {totalSesiKonsul}
        </span>
      </div>
    </div>
  </div>
));
SlideRingkasan.displayName = "SlideRingkasan";

const SlidePieChartMapel = memo(({ dataChart }) => (
  <div className={homeStyles.animasiSlideMasuk}><DonutChartMini data={dataChart} /></div>
));
SlidePieChartMapel.displayName = "SlidePieChartMapel";

const SlidePieChartKelas = memo(({ dataChart }) => (
  <div className={homeStyles.animasiSlideMasuk}><DonutChartMini data={dataChart} /></div>
));
SlidePieChartKelas.displayName = "SlidePieChartKelas";

const SlidePieChartMapelKonsul = memo(({ dataChart }) => (
  <div className={homeStyles.animasiSlideMasuk}><DonutChartMini data={dataChart} /></div>
));
SlidePieChartMapelKonsul.displayName = "SlidePieChartMapelKonsul";

const SlidePieChartKelasKonsul = memo(({ dataChart }) => (
  <div className={homeStyles.animasiSlideMasuk}><DonutChartMini data={dataChart} /></div>
));
SlidePieChartKelasKonsul.displayName = "SlidePieChartKelasKonsul";


// ============================================================================
// KOMPONEN UTAMA: HEADER PENGAJAR
// ============================================================================
const HeaderPengajar = memo(({ dataUser, statsPengajar }) => {
  const router = useRouter();
  
  // State Slider (Kini menjadi 5 Slide)
  const [slideAktif, setSlideAktif] = useState(0);
  const TOTAL_SLIDE = 5;

  const isBisaMasukAdmin =
    dataUser?.pangkat === PANGKAT_PENGAJAR.STAFF_AKADEMIK ||
    dataUser?.pangkat === PANGKAT_PENGAJAR.KAKAK_ASUH;

  const totalMenit    = Math.round(statsPengajar?.totalMenitKonsul || 0);
  const jamKonsul     = Math.floor(totalMenit / 60);
  const menitKonsul   = totalMenit % 60;
  const totalSesiKonsul = statsPengajar?.totalSesiKonsul || 0;

  // Handler Navigasi Slider
  const slideBerikutnya = useCallback(() => {
    setSlideAktif((prev) => (prev + 1) % TOTAL_SLIDE);
  }, []);

  const slideSebelumnya = useCallback(() => {
    setSlideAktif((prev) => (prev - 1 + TOTAL_SLIDE) % TOTAL_SLIDE);
  }, []);

  const judulSlide = [
    "Ringkasan Bulan Ini",
    "Mapel Reguler",
    "Kelas Target Reguler",
    "Mapel Konsultasi",
    "Kelas Konsultasi"
  ];

  return (
    <div className={`${homeStyles.appHeader} header-aman-poni`}>
      <div className={homeStyles.shapeRed} />
      <div className={styles.shapeYellow} />

      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <Image
            src="/logo-qr-panjang.png"
            alt="Logo Quantum Research"
            width={1000}
            height={40}
            style={{ width: "100%", height: "auto" }}
            priority
          />
        </div>
      </div>

      <div className={styles.identityContainer}>
        <p className={homeStyles.welcomeText}>Selamat mengajar!</p>
        <h1 className={styles.userName}>{dataUser?.nama || "Pengajar Quantum"}</h1>
        <div className={styles.containerIdNumber}>
          <span className={styles.IdNumber}>
            {dataUser?.kodePengajar} | {dataUser?.nomorPeserta}
            {dataUser?.pangkat && dataUser.pangkat !== PANGKAT_PENGAJAR.FREELANCE && (
              <span> | {dataUser.pangkat.replace("_", " ")}</span>
            )}
          </span>
        </div>
      </div>

      {/* ==================== AREA SLIDER ==================== */}
      <div className={styles.infoContainer}>
        {/* Header Slider & Tombol Kontrol */}
        <div className={homeStyles.sliderHeader}>
          <h2 className={homeStyles.sliderTitle}>{judulSlide[slideAktif]}</h2>
          <div className={homeStyles.sliderNavGroup}>
            <button onClick={slideSebelumnya} className={homeStyles.sliderTombolNav}>
              <FaChevronLeft size={12} />
            </button>
            <button onClick={slideBerikutnya} className={homeStyles.sliderTombolNav}>
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Konten Dinamis Slider */}
        <div className={homeStyles.sliderContentArea}>
          {slideAktif === 0 && (
            <SlideRingkasan
              statsPengajar={statsPengajar}
              jamKonsul={jamKonsul}
              menitKonsul={menitKonsul}
              totalSesiKonsul={totalSesiKonsul}
            />
          )}
          {slideAktif === 1 && <SlidePieChartMapel dataChart={statsPengajar?.chartMapel || []} />}
          {slideAktif === 2 && <SlidePieChartKelas dataChart={statsPengajar?.chartKelas || []} />}
          {slideAktif === 3 && <SlidePieChartMapelKonsul dataChart={statsPengajar?.chartMapelKonsul || []} />}
          {slideAktif === 4 && <SlidePieChartKelasKonsul dataChart={statsPengajar?.chartKelasKonsul || []} />}
        </div>
        
        {/* Indikator Titik (Dots) 5 Buah */}
        <div className={homeStyles.sliderDotGroup}>
          {[0, 1, 2, 3, 4].map((idx) => (
            <div 
              key={idx} 
              className={`${homeStyles.sliderDot} ${slideAktif === idx ? homeStyles.sliderDotAktif : ""}`} 
            />
          ))}
        </div>
      </div>

      {isBisaMasukAdmin && (
        <div>
          <button
            onClick={() => router.push("/admin")}
            className={homeStyles.tombolAdmin}
          >
            <FaBuildingShield size={18} /> Masuk Ruang Admin
          </button>
        </div>
      )}
    </div>
  );
});

HeaderPengajar.displayName = "HeaderPengajar";
export default HeaderPengajar;