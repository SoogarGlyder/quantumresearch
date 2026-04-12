"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPenToSquare, FaXmark } from "react-icons/fa6";

// 🚀 PATH ABSOLUTE
import { updateProfilSiswa } from "@/actions/profilAction"; 
import { VALIDASI_SISTEM } from "@/utils/constants";
import styles from "@/components/App.module.css";

// 🚀 IMPORT TETANGGA (LOKAL)
import ProfilView from "./ProfilView";

export default function ProfilCard({ siswa }) {
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
              placeholder={`Min ${VALIDASI_SISTEM.MIN_PASSWORD} karakter`}
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