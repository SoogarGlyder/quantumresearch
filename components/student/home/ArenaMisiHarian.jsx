"use client";

import { memo } from "react";
import { FaListCheck, FaGift, FaCircleCheck } from "react-icons/fa6";
import styles from "@/components/App.module.css";

const ArenaMisiHarian = memo(({ misiHarian, loadingMisi, onKlaim }) => (
  <div className={styles.contentContainer}>
    <h3 className={styles.contentTitle}><FaListCheck color="#8b5cf6" /> Misi Hari Ini</h3>
    {loadingMisi ? (
      <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '14px' }}>Mencari misi baru...</div>
    ) : misiHarian.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '14px' }}>Belum ada misi hari ini.</div>
    ) : (
      <div className={styles.missionList}>
        {misiHarian.map((misi, index) => (
          <div key={misi.kodeMisi || index} className={styles.missionCard} style={{ backgroundColor: misi.diklaim ? '#4ade80' : misi.selesai ? '#facc15' : '#ffffff' }}>
            <div className={styles.missionCardHeader}>
              <span className={styles.missionCardTitle} style={{ color: misi.diklaim ? '#64748b' : '#111827', textDecoration: misi.diklaim ? 'line-through' : 'none' }}>{misi.judul}</span>
              <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><FaGift /> +{misi.expBonus} EXP</span>
            </div>
            {/* 🚀 FIX: justifyContent dan alignItems sudah menggunakan camelCase! */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span className={styles.missionCardProgress}>{misi.progress}/{misi.target}</span>
              {misi.diklaim ? (
                <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><FaCircleCheck /> Diklaim</span>
              ) : misi.selesai ? (
                <button onClick={() => onKlaim(misi._id)} style={{ backgroundColor: '#facc15', color: '#111827', padding: '6px 14px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Klaim Hadiah</button>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sedang Berjalan</span>
              )}
            </div>
            {!misi.diklaim && (
              <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${(misi.progress / misi.target) * 100}%`, backgroundColor: misi.selesai ? '#facc15' : '#cbd5e1', height: '100%', transition: 'width 0.5s' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
));

ArenaMisiHarian.displayName = "ArenaMisiHarian";
export default ArenaMisiHarian;