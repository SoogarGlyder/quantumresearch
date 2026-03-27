"use client";
import { formatTanggal } from "../../utils/formatHelper";
import styles from "../../app/admin/AdminPage.css";
import { FaClock, FaRightFromBracket, FaUserTie } from "react-icons/fa6";

export default function TabAbsenStaf({ dataAbsenStaf }) {
  return (
    <div className={styles.wadahTabel} style={{ animation: 'slideUp 0.3s ease-out', marginTop: '10px' }}>
      <table className={styles.tabelStyle}>
        <thead>
          <tr>
            <th>Pengajar</th>
            <th>Tanggal</th>
            <th>Clock-In (Masuk)</th>
            <th>Clock-Out (Pulang)</th>
            <th style={{textAlign: 'center'}}>Status</th>
          </tr>
        </thead>
        <tbody>
          {dataAbsenStaf.length === 0 ? (
            <tr><td colSpan="5" className={styles.selKosong}>Belum ada riwayat absensi staf.</td></tr>
          ) : (
            dataAbsenStaf.map((absen) => (
              <tr key={absen._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#111827', color: 'white', padding: '8px', borderRadius: '8px', border: '2px solid #facc15' }}>
                      <FaUserTie size={16} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '900', margin: 0, color: '#111827', textTransform: 'uppercase' }}>
                        {absen.pengajarId?.nama || "Staff"}
                      </p>
                      <p style={{ fontSize: '11px', margin: 0, color: '#2563eb', fontWeight: 'bold' }}>
                        KODE: {absen.pengajarId?.kodePengajar || "-"}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: '800' }}>{formatTanggal(absen.waktuMasuk)}</td>
                <td style={{ color: '#15803d', fontWeight: '900', fontSize: '16px' }}>
                  <FaClock size={14} /> {new Date(absen.waktuMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ color: absen.waktuKeluar ? '#ef4444' : '#9ca3af', fontWeight: '900', fontSize: '16px' }}>
                  {absen.waktuKeluar ? (
                    <><FaRightFromBracket size={14} /> {new Date(absen.waktuKeluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</>
                  ) : "--:--"}
                </td>
                <td style={{textAlign: 'center'}}>
                  <span style={{ 
                    padding: '6px 14px', borderRadius: '8px', border: '3px solid #111827',
                    background: absen.waktuKeluar ? '#e5e7eb' : '#4ade80',
                    fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
                    boxShadow: '2px 2px 0 #111827'
                  }}>
                    {absen.waktuKeluar ? "SELESAI" : "AKTIF"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}