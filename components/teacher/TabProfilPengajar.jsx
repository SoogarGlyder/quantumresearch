"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 

import { updateProfilSiswa } from "../../actions/profilAction"; 
import { prosesLogout } from "../../actions/authAction";
import { VALIDASI_SISTEM, KONFIGURASI_SISTEM } from "../../utils/constants";
import { 
  FaIdCard, FaChalkboardUser, FaArrowRightFromBracket, 
  FaPenToSquare, FaWhatsapp, FaHashtag, FaXmark 
} from "react-icons/fa6";

import styles from "../App.module.css";

// ============================================================================
// 2. SUB-KOMPONEN: HEADER PROFIL (Pure & Memoized)
// ============================================================================
const HeaderProfilPengajar = memo(() => (
  <div className={styles.appHeader}>
    <div className={styles.shapeRed}></div>
    <div className={styles.shapeYellow}></div>
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <Image src="/logo-qr-panjang.png" alt="Logo" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
      </div>
    </div>
    <h1 className={styles.headerTitle}>Profil Pengajar</h1>
  </div>
));
HeaderProfilPengajar.displayName = "HeaderProfilPengajar";

// ============================================================================
// 3. SUB-KOMPONEN: INFO ROW (Pure & Memoized)
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
const ProfilView = memo(({ dataUser }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <InfoRow icon={<FaIdCard />} label="Username" value={`${dataUser.username}`} highlight />
    <InfoRow icon={<FaHashtag />} label="Kode Pengajar" value={dataUser.kodePengajar || "-"} />
    <InfoRow icon={<FaWhatsapp />} label="WhatsApp" value={dataUser.noHp || "-"} />
  </div>
));
ProfilView.displayName = "ProfilView";

// ============================================================================
// 5. SUB-KOMPONEN: LOGOUT SECTION (Pure & Memoized)
// ============================================================================
const LogoutSection = memo(({ handleLogout }) => (
  <div style={{ margin: '0 16px', padding: '0' }}>
    <button onClick={handleLogout} className={styles.logoutButton}>
      <FaArrowRightFromBracket size={20} /> KELUAR APLIKASI
    </button>
  </div>
));
LogoutSection.displayName = "LogoutSection";

// ============================================================================
// 6. SUB-KOMPONEN: KARTU PROFIL (Logic & State Colocation)
// ============================================================================
function ProfilCard({ dataUser }) {
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [usernameEdit, setUsernameEdit] = useState(dataUser.username || "");
  const [passwordEdit, setPasswordEdit] = useState("");
  const [pesan, setPesan] = useState({ teks: "", tipe: "" });
  const [loading, setLoading] = useState(false);

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
    setPesan({ teks: "", tipe: "" });
    if (!isEditing) { 
      setUsernameEdit(dataUser.username);
      setPasswordEdit("");
    }
  };

  const handleSimpan = async (e) => {
    e.preventDefault(); 
    
    if (!usernameEdit || usernameEdit.trim() === "") {
      setPesan({ teks: "⚠️ Username wajib diisi!", tipe: "error" });
      return;
    }

    if (passwordEdit && passwordEdit.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesan({ teks: `⚠️ Password minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`, tipe: "error" });
      return;
    }

    setLoading(true);
    setPesan({ teks: "Sedang memproses...", tipe: "info" });

    try {
      const hasil = await updateProfilSiswa(dataUser._id, usernameEdit, passwordEdit);

      if (hasil.sukses) {
        setPesan({ teks: `✅ ${hasil.pesan}`, tipe: "sukses" });
        setIsEditing(false);
        setPasswordEdit("");
        router.refresh(); 
      } else {
        setPesan({ teks: `❌ ${hasil.pesan}`, tipe: "error" });
      }
    } catch (error) {
      setPesan({ teks: "⚠️ Gangguan server. Coba lagi.", tipe: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.infoContainer} style={{ transform: 'none', margin: '0 16px 32px' }}>
      
      {/* CARD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '3px solid #111827', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
            {dataUser.nama}
          </h2>
        </div>

        <button 
          onClick={handleToggleEdit}
          style={{ 
            backgroundColor: isEditing ? '#ef4444' : '#facc15', 
            color: isEditing ? 'white' : '#111827', 
            border: '3px solid #111827', 
            borderRadius: '8px', 
            padding: '10px', 
            boxShadow: '3px 3px 0 #111827', 
            cursor: 'pointer'
          }}
          aria-label="Edit Profil"
        >
          {isEditing ? <FaXmark size={18} /> : <FaPenToSquare size={18} />}
        </button>
      </div>
      
      {/* NOTIFIKASI */}
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

      {/* RENDER MODE */}
      {!isEditing ? (
        <ProfilView dataUser={dataUser} />
      ) : (
        <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className={styles.labelFilter}>Username</label>
            <input 
              type="text" 
              value={usernameEdit} 
              onChange={(e) => setUsernameEdit(e.target.value)}
              className={styles.scheduleOption} 
              style={{ backgroundColor: '#f8fafc' }}
            />
          </div>

          <div>
            <label className={styles.labelFilter}>Password Baru</label>
            <input 
              type="password" 
              value={passwordEdit} 
              onChange={(e) => setPasswordEdit(e.target.value)}
              placeholder="Kosongkan jika tak diubah"
              className={styles.scheduleOption} 
              style={{ backgroundColor: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.tombolSimpanBiruBaru}
            style={{ width: '100%', marginTop: '12px', padding: '16px' }}
          >
            {loading ? 'Menyimpan...' : 'Update Profil'}
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================================
// 7. MAIN COMPONENT (Compositor)
// ============================================================================
export default function TabProfilPengajar({ dataUser }) {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
    if (konfirmasi) {
      await prosesLogout();
      router.push(KONFIGURASI_SISTEM.PATH_LOGIN);
    }
  }, [router]);

  return (
    <div className={styles.contentArea}>
      <HeaderProfilPengajar />

      <div className={styles.contentContainer}>
        {dataUser && <ProfilCard dataUser={dataUser} />}
        <LogoutSection handleLogout={handleLogout} />
      </div>
    </div>
  );
}