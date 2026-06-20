"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPenToSquare, FaXmark } from "react-icons/fa6";
import { updateProfilSiswa } from "@/actions/profilAction";
import { VALIDASI_SISTEM } from "@/utils/constants";
import styles from "@/components/App.module.css";
import profileStyles from "@/components/student/profile/Profile.module.css";
import ProfilView from "./ProfilView";

export default function ProfilCard({ siswa, isDemoMode = false }) {
  const router = useRouter();

  const [isEditing,    setIsEditing]    = useState(false);
  const [usernameEdit, setUsernameEdit] = useState(siswa.username || "");
  const [passwordEdit, setPasswordEdit] = useState("");
  const [pesan,        setPesan]        = useState({ teks: "", tipe: "" });
  const [loading,      setLoading]      = useState(false);

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
    setPesan({ teks: "", tipe: "" });
    if (!isEditing) {
      setUsernameEdit(siswa.username);
      setPasswordEdit("");
    }
  };

  const handleSimpan = async (e) => {
    e.preventDefault();

    if (!usernameEdit?.trim()) {
      setPesan({ teks: "Username tidak boleh kosong!", tipe: "error" });
      return;
    }
    if (passwordEdit && passwordEdit.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesan({ teks: `Kata sandi minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`, tipe: "error" });
      return;
    }

    setLoading(true);
    setPesan({ teks: "Menyimpan perubahan...", tipe: "info" });

    // 🎭 Mode Demo: JANGAN PERNAH panggil updateProfilSiswa sungguhan. siswa._id di
    // demo adalah ID palsu ("demo-siswa-001") — memanggil server hanya akan gagal
    // dengan pesan error yang membingungkan, dan tetap membebani server tanpa guna.
    if (isDemoMode) {
      setTimeout(() => {
        setPesan({ teks: "Simulasi berhasil disimpan! (Mode Demo — tidak benar-benar tersimpan)", tipe: "sukses" });
        setIsEditing(false);
        setPasswordEdit("");
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const hasil = await updateProfilSiswa(siswa._id, {
        username: usernameEdit,
        password: passwordEdit,
      });

      // ✅ FIX: hasil.sukses → hasil.ok (responseHelper contract)
      if (hasil.ok) {
        setPesan({ teks: hasil.pesan, tipe: "sukses" });
        setIsEditing(false);
        setPasswordEdit("");
        router.refresh();
      } else {
        setPesan({ teks: hasil.pesan, tipe: "error" });
      }
    } catch {
      setPesan({ teks: "Gagal menghubungi server. Periksa koneksi.", tipe: "error" });
    } finally {
      setLoading(false);
    }
  };

  const pesanClass =
    pesan.tipe === "error"  ? profileStyles.pesanError  :
    pesan.tipe === "sukses" ? profileStyles.pesanSukses :
    profileStyles.pesanInfo;

  return (
    <div className={`${styles.infoContainer} ${profileStyles.profilCardWrapper}`}>

      {/* Header — disederhanakan dari 3 div bersarang menjadi 1 */}
      <div className={profileStyles.cardHeaderRow}>
        <h2 className={profileStyles.namaSiswa}>{siswa.nama}</h2>
        <button
          onClick={handleToggleEdit}
          // ✅ FIX: onPointerDown/onPointerUp JS dihapus — efek :active sekarang via CSS
          className={`${profileStyles.tombolToggleEdit} ${isEditing ? profileStyles.tombolToggleEditTutup : profileStyles.tombolToggleEditBuka}`}
          aria-label={isEditing ? "Batalkan edit" : "Edit profil"}
        >
          {isEditing ? <FaXmark size={18} /> : <FaPenToSquare size={18} />}
        </button>
      </div>

      {/* Notifikasi */}
      {pesan.teks && (
        <div className={`${profileStyles.pesanNotif} ${pesanClass}`}>
          {pesan.teks}
        </div>
      )}

      {/* Mode baca / edit */}
      {!isEditing ? (
        <ProfilView siswa={siswa} />
      ) : (
        <form onSubmit={handleSimpan} className={profileStyles.formStackProfil}>
          <div>
            <label className={styles.labelFilter}>Username Baru</label>
            <input
              type="text"
              value={usernameEdit}
              onChange={(e) => setUsernameEdit(e.target.value)}
              className={`${styles.scheduleOption} ${profileStyles.inputProfil}`}
            />
          </div>

          <div>
            <label className={styles.labelFilter}>Kata Sandi Baru</label>
            <input
              type="password"
              value={passwordEdit}
              onChange={(e) => setPasswordEdit(e.target.value)}
              placeholder={`Min ${VALIDASI_SISTEM.MIN_PASSWORD} karakter`}
              className={`${styles.scheduleOption} ${profileStyles.inputProfil}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.tombolSimpanBiruBaru} ${profileStyles.tombolSimpanProfil}`}
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      )}
    </div>
  );
}