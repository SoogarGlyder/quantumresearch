"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { 
  FaChalkboardUser, FaIdCard, FaWhatsapp, FaHashtag, 
  FaArrowRightFromBracket, FaPenToSquare, FaXmark, FaCheck 
} from "react-icons/fa6";

import { updateProfilSiswa } from "../../actions/profilAction"; 
import { prosesLogout } from "../../actions/authAction"; 
import { VALIDASI_SISTEM, KONFIGURASI_SISTEM } from "../../utils/constants"; 

import styles from "../TeacherApp.module.css";

export default function TabProfilPengajar({ dataUser }) {
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifikasi, setNotifikasi] = useState({ teks: "", tipe: "" });

  const handleSimpanPassword = async (e) => {
    e.preventDefault(); 
    if (!passwordBaru || passwordBaru.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setNotifikasi({ teks: `⚠️ PASSWORD MINIMAL ${VALIDASI_SISTEM.MIN_PASSWORD} KARAKTER!`, tipe: "error" });
      return;
    }

    setLoading(true);
    try {
      const hasil = await updateProfilSiswa(dataUser?._id, { password: passwordBaru });
      
      if (hasil.sukses) {
        setNotifikasi({ teks: "✅ PASSWORD BERHASIL DIGANTI!", tipe: "sukses" });
        setIsEditing(false);
        setPasswordBaru("");
        router.refresh();
      } else {
        setNotifikasi({ teks: `❌ ${hasil.pesan}`, tipe: "error" });
      }
    } catch (error) {
      setNotifikasi({ teks: "⚠️ GANGGUAN SERVER.", tipe: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await prosesLogout();
    router.push(KONFIGURASI_SISTEM.PATH_LOGIN); 
  };

  return (
    <div className={styles.areaKonten} style={{ padding: 0 }}>
      
      <div className={styles.headerHalaman}>
        <div className={styles.hiasanBulat1}></div>
        <div className={styles.hiasanBulat2}></div>
        <div className={styles.wadahLogoTengah}>
          <div className={styles.kotakLogo}>
            <Image src="/logo-qr-panjang.png" alt="Logo Quantum" width={1000} height={40} style={{width: '100%', height: 'auto'}} priority />
          </div>
        </div>
        <h1 className={styles.judulHalaman}>Profil Pengajar</h1>
      </div>

      <div style={{ padding: '24px' }}>
        <div className={styles.kartuInfo} style={{ marginBottom: '32px' }}>
          
          {/* HEADER PROFIL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '4px solid #111827', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '72px', height: '72px', backgroundColor: '#fef08a', border: '4px solid #111827', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 0 #111827' }}>
                <FaChalkboardUser size={36} color="#111827" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                  {dataUser?.nama || "Pengajar Quantum"}
                </h2>
                <span style={{ fontSize: '12px', fontWeight: '900', color: 'white', backgroundColor: '#2563eb', padding: '4px 10px', borderRadius: '8px', border: '3px solid #111827', display: 'inline-block', marginTop: '6px', boxShadow: '2px 2px 0 #111827' }}>
                  STAFF PENGAJAR
                </span>
              </div>
            </div>

            <button 
              onClick={() => { setIsEditing(!isEditing); setNotifikasi({ teks: "", tipe: "" }); }}
              className={styles.tombolNav}
              style={{ padding: '8px', width: '48px', height: '48px', backgroundColor: isEditing ? '#fca5a5' : '#e5e7eb', border: '4px solid #111827', borderRadius: '12px', boxShadow: '4px 4px 0 #111827', cursor: 'pointer', transition: '0.1s' }}
            >
              {isEditing ? <FaXmark size={24} color="#111827" /> : <FaPenToSquare size={20} color="#111827" />}
            </button>
          </div>

          {/* NOTIFIKASI */}
          {notifikasi.teks && (
            <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '12px', border: '4px solid #111827', fontSize: '13px', fontWeight: '900', backgroundColor: notifikasi.tipe === 'error' ? '#fecaca' : '#dcfce3', boxShadow: '4px 4px 0 #111827', textTransform: 'uppercase' }}>
              {notifikasi.teks}
            </div>
          )}

          {/* DATA PROFIL & FORM PASSWORD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InfoRow icon={<FaIdCard />} label="USERNAME" value={`@${dataUser?.username || "-"}`} highlight />
            
            {isEditing ? (
              <form onSubmit={handleSimpanPassword} style={{ marginTop: '8px', animation: 'slideDown 0.2s ease-out' }}>
                <label style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', display: 'block', color: '#111827' }}>GANTI KATA SANDI</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="password" 
                    placeholder={`MIN. ${VALIDASI_SISTEM.MIN_PASSWORD} KARAKTER`} 
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    className={styles.opsiMapel}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '4px solid #111827', fontWeight: '900', fontSize: '15px' }}
                  />
                  <button type="submit" disabled={loading} style={{ backgroundColor: '#4ade80', color: '#111827', border: '4px solid #111827', borderRadius: '12px', padding: '0 20px', cursor: 'pointer', boxShadow: '4px 4px 0 #111827' }}>
                    {loading ? "..." : <FaCheck size={24} />}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <InfoRow icon={<FaHashtag />} label="ID PENGAJAR" value={dataUser?.kodePengajar || dataUser?.nomorPeserta || "-"} />
                <InfoRow icon={<FaWhatsapp />} label="WHATSAPP" value={dataUser?.noHp || "-"} />
              </>
            )}
          </div>
        </div>

        {/* TOMBOL LOGOUT BRUTAL */}
        <button onClick={handleLogout} className={styles.tombolLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', backgroundColor: 'white', border: '4px solid #111827', borderRadius: '16px', fontWeight: '900', fontSize: '18px', color: '#ef4444', cursor: 'pointer', boxShadow: '6px 6px 0 #ef4444', transition: '0.1s' }}>
          <FaArrowRightFromBracket size={20} /> KELUAR APLIKASI
        </button>
      </div>
    </div>
  );
}

// Komponen Baris Info (Disesuaikan Gaya Brutal)
function InfoRow({ icon, label, value, highlight = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: highlight ? '#bfdbfe' : '#f3f4f6', padding: '16px', border: '4px solid #111827', borderRadius: '12px', boxShadow: '4px 4px 0 rgba(17, 24, 39, 1)' }}>
      <span style={{ fontSize: '13px', fontWeight: '900', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '16px', fontWeight: '900', color: highlight ? '#1d4ed8' : '#111827' }}>
        {value}
      </span>
    </div>
  );
}