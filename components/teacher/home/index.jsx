"use client";

import { useState, useMemo } from "react";
import { timeHelper } from "@/utils/timeHelper";
import styles from "@/components/App.module.css";

import HeaderPengajar from "./HeaderPengajar";
import AgendaHariIni from "./AgendaHariIni";
import JadwalMendatang from "./JadwalMendatang"; 

import ModalJurnal from "@/components/teacher/journal/ModalJurnal"; 
import WidgetRadarCBT from "./WidgetRadarCBT";

//  FIX: HELPER: Ultimate Safari & Old iOS Safe Date Normalizer
const getNormalizeDate = (dateInput) => {
  if (!dateInput) return 0;
  
  try {
    // 1. SAFARI STRING HACK: Ubah "-" jadi "/" karena iOS benci format YYYY-MM-DD
    let dateObj;
    if (typeof dateInput === 'string') {
      let cleanStr = dateInput;
      if (!cleanStr.includes('T')) {
         cleanStr = cleanStr.replace(/-/g, '/'); 
      }
      dateObj = new Date(cleanStr);
    } else {
      dateObj = new Date(dateInput);
    }

    if (isNaN(dateObj.getTime())) return 0;
    
    // 2. Dapatkan string waktu Jakarta (MM/DD/YYYY, hh:mm:ss AM)
    const jktString = dateObj.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    
    // 3. iOS KILLER FIX: Culik angka murni pakai Regex
    const datePart = jktString.split(',')[0]; 
    const [month, day, year] = datePart.match(/\d+/g); 
    
    // 4. Rakit ulang pakai Date Number Constructor (Aman dari Invalid Date Safari)
    const jktDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    return jktDate.getTime();
  } catch (error) {
    return 0; 
  }
};

//  FIX: Tangkap statsKonsul yang sudah dikirim dari TeacherApp.jsx
export default function TabBerandaPengajar({ dataUser, jadwal = [], absensi = [], absenAktif, statsKonsul }) {
  const hariIniMurni = getNormalizeDate(new Date());
  const hariIniString = timeHelper.getTglJakarta(); 
  
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // 1. FILTER: Jadwal Hari Ini
  const jadwalHariIni = useMemo(() => (jadwal || [])
    .filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      return tglJadwalMurni === hariIniMurni && !j.bab;
    })
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)), 
  [jadwal, hariIniMurni]);

  // 2. FILTER: Jadwal Mendatang (Besok dan seterusnya)
  const jadwalMendatang = useMemo(() => (jadwal || [])
    .filter(j => {
      const tglJadwalMurni = getNormalizeDate(j.tanggal);
      return tglJadwalMurni > hariIniMurni && !j.bab;
    }) 
    .sort((a, b) => {
      const tglAMurni = getNormalizeDate(a.tanggal);
      const tglBMurni = getNormalizeDate(b.tanggal);
      return tglAMurni - tglBMurni || a.jamMulai.localeCompare(b.jamMulai);
    }), 
  [jadwal, hariIniMurni]);

  //  FIX: Selipkan variabel Konsul ke dalam Statistik Gabungan
  const statsPengajar = useMemo(() => ({ 
    totalKelas: (jadwal || []).length, 
    jurnalSelesai: (jadwal || []).filter(j => j?.bab).length,
    totalAbsensi: (absensi || []).length,
    totalMenitKonsul: statsKonsul?.totalMenit || 0, // 👈 Kabel Konsul tersambung!
    totalSesiKonsul: statsKonsul?.totalSesi || 0    // 👈 Kabel Konsul tersambung!
  }), [jadwal, absensi, statsKonsul]);

  return (
    <div className={styles.contentArea}>
      {/* Objek statsPengajar yang sudah komplet dilempar ke Header */}
      <HeaderPengajar dataUser={dataUser} statsPengajar={statsPengajar} />
      
      <WidgetRadarCBT jadwalHariIni={jadwalHariIni} />
      
      <AgendaHariIni jadwalHariIni={jadwalHariIni} onPilihJadwal={setJadwalTerpilih} />
      
      <JadwalMendatang 
        jadwalMendatang={jadwalMendatang} 
        onPilihJadwal={setJadwalTerpilih} 
      />

      {jadwalTerpilih && (
        <ModalJurnal jadwalTerpilih={jadwalTerpilih} hariIni={hariIniString} onClose={() => setJadwalTerpilih(null)} />
      )}
    </div>
  );
}