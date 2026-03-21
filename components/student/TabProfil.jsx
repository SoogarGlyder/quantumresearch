"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 

import { updateProfilSiswa } from "../../actions/profilAction"; 
import { FaUserAstronaut, FaIdCard, FaSchool, FaArrowRightFromBracket, FaPenToSquare, FaWhatsapp, FaHashtag, FaXmark } from "react-icons/fa6";

import styles from "../StudentApp.module.css";

// ============================================================================
// 2. MAIN COMPONENT (TAB PROFIL SISWA)
// ============================================================================
export default function TabProfil({ siswa, klikLogout }) {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [isEditing, setIsEditing] = useState(false);
  const [usernameEdit, setUsernameEdit] = useState(siswa.username || "");
  const [passwordEdit, setPasswordEdit] = useState("");
  
  const [pesan, setPesan] = useState({ teks: "", tipe: "" });
  const [loading, setLoading] = useState(false);

  // --- HANDLERS ---
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
    setPesan({ teks: "", tipe: "" });
    if (!isEditing) { // Diubah: Jika baru mau edit, reset form ke data awal
      setUsernameEdit(siswa.username);
      setPasswordEdit("");
    }
  };

  // 🛡️ PENAWAR UX: Menangkap event submit dari form (termasuk tombol Enter)
  const handleSimpan = async (e) => {
    e.preventDefault(); // Mencegah reload halaman bawaan browser
    
    if (!usernameEdit || usernameEdit.trim() === "") {
      setPesan({ teks: "⚠️ Username tidak boleh kosong!", tipe: "error" });
      return;
    }

    setLoading(true);
    setPesan({ teks: "Menyimpan perubahan...", tipe: "info" });

    try {
      const hasil = await updateProfilSiswa(siswa._id, usernameEdit, passwordEdit);

      if (hasil.sukses) {
        setPesan({ teks: `✅ ${hasil.pesan}`, tipe: "sukses" });
        setIsEditing(false);
        setPasswordEdit("");
        
        router.refresh(); 
      } else {
        setPesan({ teks: `❌ ${hasil.pesan}`, tipe: "error" });
      }
    } catch (error) {
      console.error("[ERROR Update Profil]:", error);
      setPesan({ teks: "⚠️ Gagal menghubungi server. Periksa koneksi.", tipe: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={styles.areaKonten} style={{ padding: 0 }}>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER HALAMAN */}
      {/* ------------------------------------------------------------- */}
      <div className={styles.headerHalaman}>
        <div className={styles.hiasanBulat1}></div>
        <div className={styles.hiasanBulat2}></div>
        <div className={styles.wadahLogoTengah}>
          <div className={styles.kotakLogo}>
            <Image src="/logo-qr-panjang.png" alt="Logo Quantum" width={1000} height={40} className={styles.logoScannerPudar} priority />
          </div>
        </div>
        <h1 className={styles.judulHalaman}>Profilku</h1>
      </div>

      <div style={{ padding: '24px' }}>
        
        {/* ------------------------------------------------------------- */}
        {/* KARTU PROFIL UTAMA */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.kartuInfo} style={{ transform: 'none', marginBottom: '32px' }}>
    
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '3px solid #111827', paddingBottom: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: '#dbeafe', border: '3px solid #111827', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 0 #111827' }}>
                <FaUserAstronaut size={30} color="#2563eb" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                  {siswa.nama}
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#111827', backgroundColor: '#facc15', padding: '2px 8px', borderRadius: '6px', border: '2px solid #111827', display: 'inline-block', marginTop: '4px' }}>
                  Siswa Quantum
                </span>
              </div>
            </div>

            <button 
              onClick={handleToggleEdit}
              style={{ 
                backgroundColor: isEditing ? '#ef4444' : '#facc15', 
                color: isEditing ? 'white' : '#111827', 
                border: '3px solid #111827', 
                borderRadius: '8px', 
                padding: '10px', 
                fontWeight: '900', 
                boxShadow: '3px 3px 0 #111827', 
                cursor: 'pointer', 
                transition: 'transform 0.1s' 
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '0 0 0 #111827'; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0 #111827'; }}
              aria-label="Edit Profil"
            >
              {isEditing ? <FaXmark size={18} /> : <FaPenToSquare size={18} />}
            </button>
          </div>
          
          {pesan.teks && (
             <div style={{ 
               marginBottom: '20px', padding: '12px', borderRadius: '12px', border: '3px solid #111827', 
               fontWeight: '900', fontSize: '13px', color: '#111827',
               backgroundColor: pesan.tipe === 'error' ? '#fecaca' : pesan.tipe === 'sukses' ? '#dcfce3' : '#fef08a', 
               boxShadow: '4px 4px 0 #111827'
             }}>
               {pesan.teks}
             </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* KONTEN BERDASARKAN MODE (VIEW / EDIT) */}
          {/* ------------------------------------------------------------- */}
          {!isEditing ? (
            
            /* --- MODE LIHAT PROFIL (VIEW) --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <InfoRow icon={<FaIdCard />} label="Username" value={`@${siswa.username}`} highlight />
              <InfoRow icon={<FaHashtag />} label="No. Peserta" value={siswa.nomorPeserta || "-"} />
              <InfoRow icon={<FaWhatsapp />} label="No. WhatsApp" value={siswa.noHp || "-"} />
              <InfoRow icon={<FaSchool />} label="Kelas Utama" value={siswa.kelas || "Belum Diatur"} />
            </div>

          ) : (
            
            /* --- MODE EDIT PROFIL (FORM) --- */
            <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slideDownBrutal 0.2s ease-out' }}>
              
              <div>
                <label className={styles.labelPilihMapel}>Username Baru</label>
                <input 
                  type="text" 
                  value={usernameEdit} 
                  onChange={(e) => setUsernameEdit(e.target.value)}
                  className={styles.opsiMapel} 
                  style={{ backgroundColor: '#f8fafc' }}
                />
              </div>

              <div>
                <label className={styles.labelPilihMapel}>Kata Sandi Baru</label>
                <input 
                  type="password" 
                  value={passwordEdit} 
                  onChange={(e) => setPasswordEdit(e.target.value)}
                  placeholder="Kosongkan jika tidak ubah sandi"
                  className={styles.opsiMapel} 
                  style={{ backgroundColor: '#f8fafc', fontSize: '14px' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={styles.tombolSimpanBiruBaru}
                style={{ width: '100%', marginTop: '12px', padding: '16px', fontSize: '16px' }}
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>

          )}

        </div>

        {/* ------------------------------------------------------------- */}
        {/* TOMBOL LOGOUT (ZONA BAHAYA) */}
        {/* ------------------------------------------------------------- */}
        <div className={styles.bagianPengaturan} style={{ marginTop: '0', padding: '0' }}>
          <button onClick={klikLogout} className={styles.tombolLogout}>
            <FaArrowRightFromBracket size={20} /> Keluar dari Perangkat
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// 4. MINI HELPER COMPONENT (DUMB COMPONENT)
// ============================================================================
function InfoRow({ icon, label, value, highlight = false }) {
  return (
    <div style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      backgroundColor: highlight ? '#dbeafe' : '#f8fafc', 
      padding: '12px 16px', 
      border: '3px solid #111827', 
      borderRadius: '12px',
      boxShadow: '2px 2px 0 rgba(0,0,0,0.1)' 
    }}>
      <span style={{ fontSize: '12px', fontWeight: '900', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '14px', fontWeight: '900', color: highlight ? '#2563eb' : '#111827' }}>
        {value}
      </span>
    </div>
  );
}