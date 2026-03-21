"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { 
  FaChalkboardUser, FaIdCard, FaWhatsapp, FaHashtag, 
  FaArrowRightFromBracket, FaPenToSquare, FaXmark, FaCheck 
} from "react-icons/fa6";

import { updateProfilSiswa } from "../../actions/profilAction"; 
import { prosesLogout } from "../../actions/authAction"; // 🛡️ PERBAIKAN: Impor action logout
import styles from "../TeacherApp.module.css";

export default function TabProfilGuru({ dataUser }) {
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifikasi, setNotifikasi] = useState({ teks: "", tipe: "" });

  const handleSimpanPassword = async (e) => {
    e.preventDefault(); // 🛡️ PERBAIKAN: Cegah reload
    if (!passwordBaru || passwordBaru.length < 6) {
      setNotifikasi({ teks: "⚠️ Password minimal 6 karakter!", tipe: "error" });
      return;
    }

    setLoading(true);
    try {
      const hasil = await updateProfilSiswa(dataUser?._id, dataUser?.username, passwordBaru);
      
      if (hasil.sukses) {
        setNotifikasi({ teks: "✅ Password berhasil diperbarui!", tipe: "sukses" });
        setIsEditing(false);
        setPasswordBaru("");
        router.refresh();
      } else {
        setNotifikasi({ teks: `❌ ${hasil.pesan}`, tipe: "error" });
      }
    } catch (error) {
      setNotifikasi({ teks: "⚠️ Gangguan koneksi server.", tipe: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ PERBAIKAN: Handler Logout yang benar memanggil backend
  const handleLogout = async () => {
    await prosesLogout();
    router.push("/login");
  };

  return (
    <div className={styles.areaKonten} style={{ padding: 0 }}>
      <div className={styles.headerHalaman}>
        <div className={styles.hiasanBulat1}></div>
        <div className={styles.hiasanBulat2}></div>
        <div className={styles.wadahLogoTengah}>
          <div className={styles.kotakLogo}>
            <Image src="/logo-qr-panjang.png" alt="Logo Quantum" width={1000} height={40} className={styles.logoScannerPudar} priority />
          </div>
        </div>
        <h1 className={styles.judulHalaman}>Profil Pengajar</h1>
      </div>

      <div style={{ padding: '24px' }}>
        <div className={styles.kartuInfo} style={{ transform: 'none', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '3px solid #111827', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#fef08a', border: '3px solid #111827', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 0 #111827' }}>
                <FaChalkboardUser size={32} color="#111827" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827', textTransform: 'uppercase' }}>
                  {dataUser?.nama || "Guru Quantum"}
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '900', color: 'white', backgroundColor: '#2563eb', padding: '2px 8px', borderRadius: '6px', border: '2px solid #111827', display: 'inline-block', marginTop: '4px' }}>
                  STAFF PENGAJAR
                </span>
              </div>
            </div>

            <button 
              onClick={() => { setIsEditing(!isEditing); setNotifikasi({ teks: "", tipe: "" }); }}
              className={styles.tombolNav}
              style={{ padding: '8px', width: '40px', height: '40px', backgroundColor: isEditing ? '#ef4444' : '#f3f4f6', border: '3px solid #111827', borderRadius: '10px', boxShadow: '3px 3px 0 #111827', cursor: 'pointer' }}
            >
              {isEditing ? <FaXmark color="white" /> : <FaPenToSquare color="#111827" />}
            </button>
          </div>

          {notifikasi.teks && (
            <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', border: '2px solid #111827', fontSize: '12px', fontWeight: '800', backgroundColor: notifikasi.tipe === 'error' ? '#fecaca' : '#dcfce3' }}>
              {notifikasi.teks}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <InfoRow icon={<FaIdCard />} label="Username" value={`@${dataUser?.username || "-"}`} highlight />
            
            {isEditing ? (
              // 🛡️ PERBAIKAN: Dibungkus form agar mendukung "Enter" key
              <form onSubmit={handleSimpanPassword} style={{ marginTop: '4px', animation: 'slideDown 0.2s ease-out' }}>
                <label style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Ganti Kata Sandi</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="password" 
                    placeholder="Minimal 6 karakter"
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    style={{ flex: 1, padding: '10px', border: '3px solid #111827', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: '#22c55e', color: 'white', border: '3px solid #111827', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', boxShadow: '2px 2px 0 #111827' }}
                  >
                    {loading ? "..." : <FaCheck />}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <InfoRow icon={<FaHashtag />} label="ID Pengajar" value={dataUser?.nomorPeserta || "-"} />
                <InfoRow icon={<FaWhatsapp />} label="WhatsApp" value={dataUser?.noHp || "-"} />
              </>
            )}
          </div>
        </div>

        {/* 🛡️ PERBAIKAN: Gunakan handleLogout yang baru */}
        <button onClick={handleLogout} className={styles.tombolLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', backgroundColor: 'white', border: '4px solid #111827', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '6px 6px 0 #ef4444', transition: '0.1s' }}>
          <FaArrowRightFromBracket /> KELUAR APLIKASI
        </button>

      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, highlight = false }) {
  return (
    <div style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      backgroundColor: highlight ? '#dbeafe' : '#f8fafc', 
      padding: '12px 16px', border: '3px solid #111827', borderRadius: '12px',
      boxShadow: '2px 2px 0 rgba(0,0,0,0.05)' 
    }}>
      <span style={{ fontSize: '11px', fontWeight: '900', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '14px', fontWeight: '900', color: highlight ? '#2563eb' : '#111827' }}>
        {value}
      </span>
    </div>
  );
}