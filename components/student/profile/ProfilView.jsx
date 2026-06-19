"use client";

import { memo } from "react";
import { FaIdCard, FaSchool, FaWhatsapp, FaHashtag } from "react-icons/fa6";
import profileStyles from "@/components/student/profile/Profile.module.css";

const InfoRow = memo(({ icon, label, value, highlight = false }) => (
  <div className={`${profileStyles.infoRow} ${highlight ? profileStyles.infoRowHighlight : ""}`}>
    <span className={profileStyles.infoRowLabel}>
      {icon} {label}
    </span>
    <span className={`${profileStyles.infoRowValue} ${highlight ? profileStyles.infoRowValueHighlight : ""}`}>
      {value}
    </span>
  </div>
));
InfoRow.displayName = "InfoRow";

const ProfilView = memo(({ siswa }) => (
  <div className={profileStyles.infoStack}>
    <InfoRow icon={<FaIdCard />}   label="Username"   value={`@${siswa.username}`}          highlight />
    <InfoRow icon={<FaHashtag />}  label="ID Peserta" value={siswa.nomorPeserta || "-"} />
    <InfoRow icon={<FaWhatsapp />} label="WhatsApp"    value={siswa.noHp || "-"} />
    <InfoRow icon={<FaSchool />}   label="Kelas"       value={siswa.kelas || "Belum Diatur"} />
  </div>
));
ProfilView.displayName = "ProfilView";

export default ProfilView;