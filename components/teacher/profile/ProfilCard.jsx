"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPenToSquare, FaXmark } from "react-icons/fa6";
import { updateProfilSiswa } from "@/actions/profilAction";
import { VALIDASI_SISTEM } from "@/utils/constants";
import styles from "@/components/App.module.css";
import profileStyles from "@/components/teacher/profile/Profile.module.css";

import ProfilView from "./ProfilView";

export default function ProfilCard({ dataUser }) {
  const router = useRouter();

  const [isEditing,    setIsEditing]    = useState(false);
  const [usernameEdit, setUsernameEdit] = useState(dataUser.username || "");
  const [passwordEdit, setPasswordEdit] = useState("");
  const [pesan,        setPesan]        = useState({ teks: "", tipe: "" });
  const [loading,      setLoading]      = useState(false);

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
    setPesan({ teks: "", tipe: "" });
    if (!isEditing) {
      setUsernameEdit(dataUser.username);
      setPasswordEdit("");
    }
  };

  const handleSimpan = async (e) => {
    e.preventDefault();

    if (!usernameEdit?.trim()) {
      setPesan({ teks: "Username wajib diisi!", tipe: "error" });
      return;
    }
    if (passwordEdit && passwordEdit.length < VALIDASI_SISTEM.MIN_PASSWORD) {
      setPesan({ teks: `Password minimal ${VALIDASI_SISTEM.MIN_PASSWORD} karakter!`, tipe: "error" });
      return;
    }

    setLoading(true);
    setPesan({ teks: "Sedang memproses...", tipe: "info" });

    try {
      const hasil = await updateProfilSiswa(dataUser._id, {
        username: usernameEdit,
        password: passwordEdit,
      });

      if (hasil.ok) {
        setPesan({ teks: hasil.pesan, tipe: "sukses" });
        setIsEditing(false);
        setPasswordEdit("");
        router.refresh();
      } else {
        setPesan({ teks: hasil.pesan, tipe: "error" });
      }
    } catch {
      setPesan({ teks: "Gangguan server. Coba lagi.", tipe: "error" });
    } finally {
      setLoading(false);
    }
  };

  const pesanClass =
    pesan.tipe === "error"  ? profileStyles.pesanError  :
    pesan.tipe === "sukses" ? profileStyles.pesanSukses  :
    profileStyles.pesanInfo;

  return (
    <div className={`${styles.infoContainer} ${profileStyles.profilCardWrapper}`}>

      <div className={profileStyles.cardHeaderRow}>
        <h2 className={profileStyles.namaPengajar}>{dataUser.nama}</h2>
        <button
          onClick={handleToggleEdit}
          className={`${profileStyles.tombolToggleEdit} ${isEditing ? profileStyles.tombolToggleEditTutup : profileStyles.tombolToggleEditBuka}`}
          aria-label={isEditing ? "Batalkan edit" : "Edit profil"}
        >
          {isEditing ? <FaXmark size={18} /> : <FaPenToSquare size={18} />}
        </button>
      </div>

      {pesan.teks && (
        <div className={`${profileStyles.pesanNotif} ${pesanClass}`}>
          {pesan.teks}
        </div>
      )}

      {!isEditing ? (
        <ProfilView dataUser={dataUser} />
      ) : (
        <form onSubmit={handleSimpan} className={profileStyles.formStackProfil}>
          <div className={profileStyles.wrapperField}>
            <label className={styles.labelFilter}>Username</label>
            <input
              type="text"
              value={usernameEdit}
              onChange={(e) => setUsernameEdit(e.target.value)}
              className={`${styles.scheduleOption} ${profileStyles.inputProfil}`}
            />
          </div>

          <div className={profileStyles.wrapperField}>
            <label className={styles.labelFilter}>Password Baru</label>
            <input
              type="password"
              value={passwordEdit}
              onChange={(e) => setPasswordEdit(e.target.value)}
              placeholder="Kosongkan jika tidak diubah"
              className={`${styles.scheduleOption} ${profileStyles.inputProfil}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.tombolSimpanBiruBaru} ${profileStyles.tombolSimpanProfil}`}
          >
            {loading ? "Menyimpan..." : "Update Profil"}
          </button>
        </form>
      )}
    </div>
  );
}