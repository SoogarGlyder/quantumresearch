"use client";

import { memo } from "react";
import { FaBookOpen, FaBullseye, FaPenToSquare, FaTrash, FaLink } from "react-icons/fa6";
import styles from "../App.module.css";

const DaftarTugas = memo(({ dataSoal, loading, onEdit, onHapus }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaBookOpen color="#2563eb" /> Daftar Materi Buatanku</h3>
    
    {loading ? (
      <div className={styles.messageLoading} style={{ borderRadius: '12px', margin: '0 16px' }}>MEMUAT DATA...</div>
    ) : (!dataSoal || dataSoal.length === 0) ? (
      <p className={styles.emptySchedule}>BELUM ADA MATERI YANG DIBUAT.</p>
    ) : (
      <div className={styles.scheduleList}>
        {(dataSoal || []).map(item => (
          <div 
            key={item._id} 
            className={styles.scheduleCard} 
            style={{ 
              backgroundColor: item.isAktif ? '#ffffff' : '#f3f4f6', 
              opacity: item.isAktif ? 1 : 0.7
            }}
          >
            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleDate} style={{ color: '#2563eb' }}>
                <FaBullseye style={{marginRight: '6px'}}/> {item.tipeTarget}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => onEdit(item)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}><FaPenToSquare size={20}/></button>
                <button onClick={() => onHapus(item._id, item.judul)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><FaTrash size={20}/></button>
              </div>
            </div>

            <div className={styles.scheduleCardRow}>
              <p className={styles.scheduleSubject} style={{ fontSize: '18px' }}>{item.judul}</p>
            </div>

            <div className={styles.scheduleCardRow}>
              <div className={styles.scheduleInfoBox} style={{ background: '#111827', border: '2px solid #111827' }}>
                <span className={styles.scheduleInfo} style={{ color: 'white' }}>{item.target}</span>
              </div>
              <a 
                href={item.url} target="_blank" rel="noreferrer" 
                className={styles.scheduleCount} 
                style={{ background: '#fef08a', color: '#111827', textDecoration: 'none', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                CEK LINK <FaLink size={12}/> 
              </a>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

DaftarTugas.displayName = "DaftarTugas";
export default DaftarTugas;