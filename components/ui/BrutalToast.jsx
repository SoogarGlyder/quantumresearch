"use client";

import { useEffect } from "react";
import { FaCheck, FaTriangleExclamation, FaXmark } from "react-icons/fa6";

export default function BrutalToast({ pesan, tipe = "sukses", onClose }) {
  // Otomatis hilang setelah 3 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSukses = tipe === "sukses";

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      backgroundColor: isSukses ? "var(--brutal-kuning)" : "var(--brutal-merah)",
      color: isSukses ? "var(--brutal-hitam)" : "var(--brutal-putih)",
      padding: "16px 24px",
      border: "var(--brutal-border)",
      boxShadow: "var(--brutal-shadow)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      zIndex: 9999, // Selalu di paling atas
      fontWeight: "900",
      animation: "brutalPop 0.3s ease-out forwards" // Memanggil animasi dari globals.css
    }}>
      {isSukses ? <FaCheck size={20} /> : <FaTriangleExclamation size={20} />}
      
      <span style={{ fontSize: "15px" }}>{pesan}</span>
      
      <button 
        onClick={onClose} 
        style={{ 
          background: "transparent", 
          border: "none", 
          cursor: "pointer", 
          marginLeft: "16px",
          display: "flex",
          alignItems: "center"
        }}
        aria-label="Tutup Notifikasi"
      >
        <FaXmark size={20} color={isSukses ? "var(--brutal-hitam)" : "var(--brutal-putih)"} />
      </button>
    </div>
  );
}