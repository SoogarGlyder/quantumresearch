"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react"; 
import styles from "../../app/admin/AdminPage.module.css";
import { FaXmark, FaPrint, FaQrcode } from "react-icons/fa6";

// 👈 Import Konstanta (Jika ingin memberi default prefix)
import { PREFIX_BARCODE } from "../../utils/constants";

export default function ModalQr({ isOpen, onClose, dataAwal = "" }) {
  const [teksQr, setTeksQr] = useState(dataAwal);

  // Update teks jika dataAwal berubah (misal klik dari baris tabel tertentu)
  useEffect(() => {
    setTeksQr(dataAwal);
  }, [dataAwal]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlayModal} onClick={onClose}>
      <div className={styles.kotakModal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header Modal */}
        <div className={styles.headerModal}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaQrcode /> PABRIK QR CODE CEPAT
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <FaXmark size={20} />
          </button>
        </div>

        {/* Konten Modal */}
        <div className={styles.wadahQr} style={{ paddingTop: '10px', paddingBottom: '10px' }}>
          <div className={styles.wadahKontrolQr} style={{ marginBottom: '20px', padding: '16px' }}>
            <label className={styles.labelModal}>Isi Konten QR:</label>
            <input 
              type="text" 
              className={styles.inputPabrikQr} 
              value={teksQr} 
              onChange={(e) => setTeksQr(e.target.value.toUpperCase())}
              placeholder="Ketik ID, Nama, atau Kode..."
            />
          </div>

          {/* Area yang akan di-print */}
          <div className={styles.qrBox} id="area-cetak-qr">
            <QRCodeCanvas 
              value={teksQr || "QUANTUM-RESEARCH"} 
              size={250}
              level={"H"}
              includeMargin={true}
            />
            <p className={styles.teksHasilQr} style={{ fontSize: '20px', marginTop: '16px', fontWeight: '900' }}>
              {teksQr || "---"}
            </p>
          </div>

          <button onClick={handlePrint} className={styles.tombolCetakQr} style={{ marginTop: '20px', width: '100%' }}>
            <FaPrint /> CETAK SEKARANG
          </button>
        </div>

      </div>
    </div>
  );
}