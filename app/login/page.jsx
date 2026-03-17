"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { prosesLogin } from "../../actions/authAction";

import styles from "./LoginPage.module.css";
import { FaUserAstronaut, FaLock, FaArrowRightToBracket } from "react-icons/fa6";

// ============================================================================
// 2. MAIN COMPONENT (LOGIN PAGE)
// ============================================================================
export default function LoginPage() {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password.trim()) {
      setPesan("⚠️ Mohon isi kedua kolom di atas.");
      return;
    }

    setLoading(true);
    setPesan("Memverifikasi data...");

    try {
      const hasil = await prosesLogin(form);
      setPesan(hasil.pesan);
      if (hasil.sukses) {
        router.push("/");
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("[ERROR handleLogin]:", error);
      setPesan("Gagal menghubungi server. Periksa koneksi internet Anda.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (pesan) setPesan(""); 
  };

  // ============================================================================
  // 3. RENDER UI
  // ============================================================================
  return (
    <div className={styles.wadahUtama}>
      
      <div className={styles.kartuLogin}>
        
        <div className={styles.hiasan1}></div>
        <div className={styles.hiasan2}></div>

        <div className={styles.kontenKartu}>
          
          {/* HEADER LOGO */}
          <div className={styles.wadahLogo}>
            <Image
              src="/logo-qr-persegi.png"
              alt="Logo Quantum Research"
              width={240}
              height={120}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          <div className={styles.headerTeks}>
            <h1 className={styles.judulUtama}>Selamat Datang</h1>
            <p className={styles.subJudul}>Silakan masuk ke akun belajarmu</p>
          </div>

          {/* FORM LOGIN */}
          <form onSubmit={handleLogin} noValidate>
            
            {/* Input 1: Identifier (Username/No Peserta/WA) */}
            <div className={styles.grupInput}>
              <label htmlFor="identifier" className={styles.labelInput}>
                ID Pengguna
              </label>
              <div className={styles.wadahInput}>
                <div className={styles.ikonInput}>
                  <FaUserAstronaut />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  autoFocus
                  placeholder="Username / No. Peserta / No. WA"
                  value={form.identifier}
                  onChange={handleChange}
                  className={styles.inputField}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div className={styles.grupInput}>
              <label htmlFor="password" className={styles.labelInput}>
                Kata Sandi
              </label>
              <div className={styles.wadahInput}>
                <div className={styles.ikonInput}>
                  <FaLock />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={styles.inputField}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={loading}
              className={`${styles.tombolMasuk} ${loading ? styles.tombolLoading : ""}`}
            >
              {loading ? "Membuka Gerbang..." : (
                <>Masuk <FaArrowRightToBracket /></>
              )}
            </button>

            {/* Area Pesan Sistem */}
            {pesan && (
              <p className={pesan.includes("Berhasil") || pesan.includes("Memverifikasi") 
                ? styles.pesanSukses 
                : styles.pesanError}
              >
                {pesan}
              </p>
            )}

          </form>
        </div>
      </div>
      
      <p className={styles.footerText}>
        © 2026 Bimbingan Belajar Quantum Research
      </p>
    </div>
  );
}