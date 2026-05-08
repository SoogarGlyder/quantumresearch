"use client";

import { FaTriangleExclamation } from "react-icons/fa6";

export default function ModalLogout({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ 
        backgroundColor: 'white', border: '4px solid #111827', boxShadow: '8px 8px 0 #111827', 
        width: '100%', maxWidth: '350px', borderRadius: '16px', overflow: 'hidden', 
        textAlign: 'center', padding: '24px', animation: 'slideDownBrutal 0.2s ease-out' 
      }}>
        
        <FaTriangleExclamation size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
        
        <h3 style={{ margin: '0 0 8px 0', fontWeight: '900', fontSize: '20px', color: '#111827', textTransform: 'uppercase' }}>
          Konfirmasi Keluar
        </h3>
        
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#4b5563', fontWeight: '600' }}>
          Apakah Anda yakin ingin keluar dari aplikasi?
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ 
              flex: 1, padding: '12px', backgroundColor: '#f3f4f6', color: '#111827', 
              border: '3px solid #111827', borderRadius: '10px', fontWeight: '900', 
              cursor: 'pointer', boxShadow: '2px 2px 0 #111827' 
            }}
          >
            BATAL
          </button>
          
          <button 
            onClick={onConfirm}
            style={{ 
              flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', 
              border: '3px solid #111827', borderRadius: '10px', fontWeight: '900', 
              cursor: 'pointer', boxShadow: '2px 2px 0 #111827' 
            }}
          >
            YA, KELUAR
          </button>
        </div>

      </div>
    </div>
  );
}