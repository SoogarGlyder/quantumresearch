"use client";

import React from "react";
import { FaTriangleExclamation, FaArrowRotateRight } from "react-icons/fa6";
import styles from "./ErrorBoundary.module.css"; // 👈 Import CSS Module

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary menangkap error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <FaTriangleExclamation size={48} />
          </div>
          
          <h2 className={styles.errorTitle}>
            Waduh, Tab Ini Mengalami Kendala!
          </h2>
          
          <p className={styles.errorMessage}>
            Tenang, tab lain masih aman. Error:{" "}
            <span className={styles.errorDetail}>{this.state.errorMsg}</span>
          </p>
          
          <button 
            onClick={() => this.setState({ hasError: false })}
            className={styles.reloadButton}
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