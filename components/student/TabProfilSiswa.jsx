"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 

import { updateProfilSiswa } from "../../actions/profilAction"; 
import { VALIDASI_SISTEM } from "../../utils/constants";
import { 
  FaIdCard, FaSchool, FaArrowRightFromBracket, 
  FaPenToSquare, FaWhatsapp, FaHashtag, FaXmark 
} from "react-icons/fa6";

import styles from "../App.module.css";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER PROFIL (Pure & Memoized)
// ============================================================================
const HeaderProfil = memo(() => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <h1 className={styles.headerTitle}>Profilku</h1>
  </div>
));
HeaderProfil.displayName = "HeaderProfil";

// ============================================================================
// 3. SUB-KOMPONEN: MINI HELPER (Pure & Memoized)
// ============================================================================
const InfoRow = memo(({ icon, label, value, highlight = false }) => (
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
));
InfoRow.displayName = "InfoRow";

// ============================================================================
// 4. SUB-KOMPONEN: PROFIL VIEW (Pure & Memoized)
// ============================================================================
const ProfilView = memo(({ siswa }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <InfoRow icon={<FaIdCard />} label="Username" value={`@${siswa.username}`} highlight />
    <InfoRow icon={<FaHashtag />} label="ID Peserta" value={siswa.nomorPeserta || "-"} />
    <InfoRow icon={<FaWhatsapp />} label="WhatsApp" value={siswa.noHp || "-"} />
    <InfoRow icon={<FaSchool />} label="Kelas" value={siswa.kelas || "Belum Diatur"} />
  </div>
));
ProfilView.displayName = "ProfilView";

// ============================================================================
// 5. SUB-KOMPONEN: TOMBOL LOGOUT (Pure & Memoized)
// ============================================================================
const LogoutSection = memo(({ klikLogout }) => (
  <div style={{ margin: '0 16px', padding: '0' }}>
    <button onClick={klikLogout} className={styles.logoutButton}>
      <FaArrowRightFromBracket size={20} /> LOG OUT
    </button>
  </div>
));
LogoutSection.displayName = "LogoutSection";

// ============================================================================
// 6. SUB-KOMPONEN: KARTU PROFIL (State Colocation & Logic)
// Area ini terisolasi agar saat siswa mengetik, hanya kotak ini yang render ulang!
// ============================================================================
function ProfilCard({ siswa }) {
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [usernameEdit, setUsernameEdit] = useState(siswa.username || "");
  const [passwordEdit, setPasswordEdit] = useState("");
  const [pesan, setPesan] = useState({ teks: "", tipe: "" });
  const [loading, setLoading] = useState(false);

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
    setPesan({ teks: "", tipe: "" });
    if (!isEditing) { 
      setUsernameEdit(siswa.username);
      setPasswordEdit("");
    }
  };

  const handleSimpan = async (e) => {
    e.preventDefault(); 
    
    if (!usernameEdit || usernameEdit.trim() === "") {
      setPesan({ teks: "⚠️ Username tidak boleh kosong!", tipe: "error" });
      return;
    }

    if (passwordEdit && passwordEdit.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesan({ teks: `⚠️ Kata sandi minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`, tipe: "error" });
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

  return (
    <div className={styles.infoContainer} style={{ transform: 'none', margin: '0 16px 32px' }}>
      
      {/* CARD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '3px solid #111827', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' , paddingRight: '15px'}}>
              {siswa.nama}
            </h2>
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
      
      {/* NOTIFICATION BOX */}
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

      {/* RENDER VIEW OR EDIT MODE */}
      {!isEditing ? (
        <ProfilView siswa={siswa} />
      ) : (
        <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slideDownBrutal 0.2s ease-out' }}>
          <div>
            <label className={styles.labelFilter}>Username Baru</label>
            <input 
              type="text" 
              value={usernameEdit} 
              onChange={(e) => setUsernameEdit(e.target.value)}
              className={styles.scheduleOption} 
              style={{ backgroundColor: '#f8fafc' }}
            />
          </div>

          <div>
            <label className={styles.labelFilter}>Kata Sandi Baru</label>
            <input 
              type="password" 
              value={passwordEdit} 
              onChange={(e) => setPasswordEdit(e.target.value)}
              placeholder={`Min ${VALIDASI_SISTEM.MIN_PASSWORD} karakter (kosongkan jika tak diubah)`}
              className={styles.scheduleOption} 
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
  );
}

// ============================================================================
// 7. MAIN EXPORT COMPONENT (Compositor)
// ============================================================================
export default function TabProfil({ siswa, klikLogout }) {
  return (
    <div className={styles.contentArea}>
      <HeaderProfil />

      <div className={styles.contentContainer}>
        <ProfilCard siswa={siswa} />
        <LogoutSection klikLogout={klikLogout} />
      </div>
    </div>
  );
}