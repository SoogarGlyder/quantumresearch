// ============================================================================
// 1. DATA MASTER KELAS (SUMBU Y) - DISINKRONKAN DENGAN constants.js
// ============================================================================
export const DAFTAR_KELAS_BIMBEL = [
  // SESI 1 (SMP)
  { id: "KLS-7", nama: "7 SMP", sesi: 1 },
  { id: "KLS-8", nama: "8 SMP", sesi: 1 },
  { id: "KLS-9", nama: "9 SMP", sesi: 1 },
  
  // SESI 2 (SMA 10 & 11)
  { id: "KLS-10", nama: "10 SMA", sesi: 2 },
  { id: "KLS-11-IPA", nama: "11 IPA SMA", sesi: 2 },
  { id: "KLS-11-IPS", nama: "11 IPS SMA", sesi: 2 },
  
  // SESI 3 (SMA 12 & ALUMNI)
  { id: "KLS-12-IPA", nama: "12 IPA SMA", sesi: 3 },
  { id: "KLS-12-IPS", nama: "12 IPS SMA", sesi: 3 },
  { id: "KLS-ALUMNI", nama: "Alumni / Gap Year", sesi: 3 } // Biasanya alumni ikut sesi malam/sesi 3
];

// ============================================================================
// 2. KAMUS WAKTU OTOMATIS
// ============================================================================
export const KAMUS_JAM_SESI = {
  normal: { // Senin - Jumat
    1: { mulai: "14:30", selesai: "16:00" },
    2: { mulai: "16:00", selesai: "17:30" },
    3: { mulai: "17:30", selesai: "19:00" }
  },
  sabtu: { // Khusus Sabtu
    1: { mulai: "09:30", selesai: "11:00" },
    2: { mulai: "11:00", selesai: "12:30" },
    3: { mulai: "12:30", selesai: "14:00" }
  }
};

// ============================================================================
// 3. MESIN GENERATOR TANGGAL (SUMBU X)
// ============================================================================
export function generateDuaMingguKerja(tanggalAwalSenin) {
  const tanggalMulai = new Date(`${tanggalAwalSenin}T00:00:00+07:00`);
  const daftarHari = [];
  
  for (let i = 0; i < 14; i++) {
    const hariBidikan = new Date(tanggalMulai);
    hariBidikan.setDate(tanggalMulai.getDate() + i);

    const indexHari = hariBidikan.getDay();
    
    if (indexHari !== 0) {
      daftarHari.push({

        tanggalPenuh: hariBidikan.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }), 
        
        namaHari: hariBidikan.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' }), 
        
        tanggalTampil: hariBidikan.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' }), 
        
        isSabtu: indexHari === 6 
      });
    }
  }
  
  return daftarHari; 
}