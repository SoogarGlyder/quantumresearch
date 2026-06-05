"use client";

import { memo } from "react";
import { FaIdCard, FaHashtag, FaWhatsapp } from "react-icons/fa6";
import profileStyles from "@/components/teacher/profile/Profile.module.css";

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

const ProfilView = memo(({ dataUser }) => (
  <div className={profileStyles.infoStack}>
    <InfoRow icon={<FaIdCard />}    label="Username"      value={dataUser.username}          highlight />
    <InfoRow icon={<FaHashtag />}   label="Kode Pengajar" value={dataUser.kodePengajar || "-"} />
    <InfoRow icon={<FaWhatsapp />}  label="WhatsApp"      value={dataUser.noHp || "-"}          />
  </div>
));
ProfilView.displayName = "ProfilView";

export default ProfilView;