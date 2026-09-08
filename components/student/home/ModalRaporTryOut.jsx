"use client";

import { useState } from "react";
import { FaAward, FaXmark, FaChevronRight } from "react-icons/fa6";
import styles from "@/components/App.module.css";
import ModalUjianCBT from "@/components/student/home/ModalUjianCBT";

export default function ModalRaporTryOut({ dataReview, jadwalId, siswa, onClose }) {
  const [subtesReviewIndex, setSubtesReviewIndex] = useState(null);

  if (!dataReview || dataReview.jenisUjian !== "TRYOUT") return null;

  const { daftarSubtes, riwayatSubtes } = dataReview;

  const totalSkor = riwayatSubtes.reduce((acc, curr) => acc + (curr.skorSubtes || 0), 0);
  const rataRataSkor = riwayatSubtes.length > 0 ? Math.round(totalSkor / riwayatSubtes.length) : 0;

  if (subtesReviewIndex !== null) {
    const subtesPilihan = daftarSubtes[subtesReviewIndex];
    const riwayatPilihan = riwayatSubtes[subtesReviewIndex];
    const jawabanPastFormatted = riwayatPilihan?.detailJawaban?.map(d => d.jawabanSiswa) || [];

    const kuisSubtesMock = {
      mapel: subtesPilihan.judulSubtes,
      jenisUjian: "KUIS", 
      soal: subtesPilihan.soal
    };

    return (
      <ModalUjianCBT 
        jadwalId={jadwalId}
        kuis={kuisSubtesMock}
        siswa={siswa}
        isReviewMode={true}
        jawabanPast={jawabanPastFormatted}
        onClose={() => setSubtesReviewIndex(null)} 
      />
    );
  }

  return (
    <div className={styles.cbtFixedOverlay} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999 }}>
      <div className={styles.cbtPromptCard} style={{ maxWidth: '600px', width: '90%', background: 'white', border: '4px solid #111827', boxShadow: '8px 8px 0 #111827', textAlign: 'left', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #111827', paddingBottom: '15px', marginBottom: '20px' }}>
          <div>
            <span style={{ background: '#fef08a', color: '#111827', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', border: '2px solid #111827' }}>LAPORAN HASIL UTBK</span>
            <h2 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '900', color: '#111827' }}>Rapor Try Out Estafet</h2>
          </div>
          <button onClick={onClose} style={{ border: '3px solid #111827', background: 'white', padding: '8px', cursor: 'pointer', borderRadius: '6px', boxShadow: '2px 2px 0 #111827' }}>
            <FaXmark size={18} />
          </button>
        </div>

        <div style={{ background: '#f0fdf4', border: '3px solid #111827', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', boxShadow: '4px 4px 0 #111827' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#166534' }}>SKOR AKUMULASI RATA-RATA</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '900', color: '#15803d' }}>{rataRataSkor} / 100</h3>
          </div>
          <div style={{ background: '#22c55e', color: 'white', padding: '12px', borderRadius: '50%', border: '2px solid #111827' }}>
            <FaAward size={24} />
          </div>
        </div>

        <p style={{ fontWeight: '900', fontSize: '14px', color: '#111827', marginBottom: '12px' }}>ANALISIS NILAI PER SUBTES:</p>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {riwayatSubtes.map((subtes, index) => (
            <div key={index} style={{ background: '#f8fafc', border: '3px solid #111827', padding: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '3px 3px 0 #111827' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b' }}>SUBTES {index + 1}</span>
                <h4 style={{ margin: '2px 0', fontSize: '16px', fontWeight: '900', color: '#111827' }}>{subtes.judulSubtes}</h4>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: subtes.skorSubtes >= 75 ? '#166534' : '#b91c1c' }}>
                  Skor: {subtes.skorSubtes} ({subtes.skorSubtes >= 75 ? 'Baik' : 'Perlu Evaluasi'})
                </p>
              </div>
              <button 
                onClick={() => setSubtesReviewIndex(index)}
                style={{ background: '#2563eb', color: 'white', border: '2px solid #111827', padding: '8px 12px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', boxShadow: '2px 2px 0 #111827', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Review <FaChevronRight size={12} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', borderTop: '3px solid #111827', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: '#111827', color: 'white', border: '2px solid #111827', padding: '10px 20px', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', boxShadow: '3px 3px 0 #64748b' }}>
            TUTUP
          </button>
        </div>

      </div>
    </div>
  );
}
