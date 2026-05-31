"use client";

import React from "react";
import { FaTriangleExclamation, FaArrowRotateRight } from "react-icons/fa6";
import styles from "./ErrorBoundary.module.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Error tertangkap:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <FaTriangleExclamation size={48} />
          </div>

          <h2 className={styles.errorTitle}>
            Komponen ini mengalami kendala
          </h2>

          <p className={styles.errorMessage}>
            Terjadi kesalahan yang tidak terduga. Silakan coba muat ulang,
            atau hubungi tim teknis jika masalah berlanjut.
          </p>

          <button
            onClick={() =>
              this.setState({ hasError: false, errorMsg: "" })
            }
            className={styles.reloadButton}
          >
            <FaArrowRotateRight /> Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;