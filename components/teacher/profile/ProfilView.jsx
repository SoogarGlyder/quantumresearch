"use client";

import { memo } from "react";
import { FaIdCard, FaHashtag, FaWhatsapp } from "react-icons/fa6";

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

const ProfilView = memo(({ dataUser }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <InfoRow icon={<FaIdCard />} label="Username" value={`${dataUser.username}`} highlight />
    <InfoRow icon={<FaHashtag />} label="Kode Pengajar" value={dataUser.kodePengajar || "-"} />
    <InfoRow icon={<FaWhatsapp />} label="WhatsApp" value={dataUser.noHp || "-"} />
  </div>
));
ProfilView.displayName = "ProfilView";

export default ProfilView;