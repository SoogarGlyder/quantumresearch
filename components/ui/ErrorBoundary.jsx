"use client";

import React from "react";
import { FaTriangleExclamation, FaArrowRotateRight } from "react-icons/fa6";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error, errorInfo) {
    // Di sini Bos bisa menyambungkan ke layanan log seperti Sentry di masa depan
    console.error("ErrorBoundary menangkap error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fee2e2', borderRadius: '12px', border: '4px solid #111827', margin: '20px', boxShadow: '6px 6px 0 #111827' }}>
          <FaTriangleExclamation size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>Waduh, Tab Ini Mengalami Kendala!</h2>
          <p style={{ color: '#4b5563', marginBottom: '24px', fontWeight: 'bold' }}>
            Tenang, tab lain masih aman. Error: <span style={{ fontStyle: 'italic', color: '#b91c1c' }}>{this.state.errorMsg}</span>
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: '12px 24px', backgroundColor: '#111827', color: '#facc15', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FaArrowRotateRight /> Muat Ulang Tab
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;