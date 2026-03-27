"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { prosesLogin } from "../../actions/authAction";
import { PESAN_SISTEM } from "../../utils/constants";

import styles from "./LoginPage.module.css";
import { FaUserAstronaut, FaLock, FaArrowRightToBracket } from "react-icons/fa6";

// ============================================================================
// 2. SUB-COMPONENT: FORM LOGIN (Mencegah Error Suspense Next.js)
// ============================================================================
function FormLoginArea() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- STATE MANAGEMENT ---
  const [form, setForm] = useState({ identifier: "", password: "" });
  // Gunakan object agar tidak menebak dari isi teks (menghindari hardcode text check)
  const [notifikasi, setNotifikasi] = useState({ teks: "", tipe: "" }); 
  const [loading, setLoading] = useState(false);

  // --- EFEK SAMPING: Tangkap URL Param (clear=true) dari Root Switcher ---
  useEffect(() => {
    if (searchParams.get("clear") === "true") {
      setNotifikasi({ teks: PESAN_SISTEM.SESI_HABIS, tipe: "error" });
    }
  }, [searchParams]);

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password.trim()) {
      setNotifikasi({ teks: "⚠️ Mohon isi ID pengguna dan Kata Sandi.", tipe: "error" });
      return;
    }

    setLoading(true);
    setNotifikasi({ teks: "Memverifikasi identitas...", tipe: "info" });

    try {
      const hasil = await prosesLogin(form);
      
      if (hasil.sukses) {
        setNotifikasi({ teks: hasil.pesan, tipe: "sukses" });
        // Root Switcher ("/") akan otomatis mengarahkan ke halaman yang sesuai perannya
        router.push("/");
      } else {
        setNotifikasi({ teks: hasil.pesan, tipe: "error" });
        setLoading(false);
      }
    } catch (error) {
      console.error("[ERROR handleLogin]:", error);
      setNotifikasi({ teks: "Gagal terhubung ke server. Periksa koneksi Anda.", tipe: "error" });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Bersihkan notifikasi saat user mulai mengetik ulang
    if (notifikasi.teks) setNotifikasi({ teks: "", tipe: "" }); 
  };

  return (
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

      {/* Area Pesan Sistem (Warna bergantung pada 'tipe' bukan teksnya) */}
      {notifikasi.teks && (
        <p className={
          notifikasi.tipe === "error" ? styles.pesanError : styles.pesanSukses
        }>
          {notifikasi.teks}
        </p>
      )}

    </form>
  );
}

// ============================================================================
// 3. MAIN COMPONENT (PAGE LAYOUT)
// ============================================================================
export default function LoginPage() {
  return (
    <div className={styles.mainContainer}>
      
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
            <p className={styles.subJudul}>Silakan masuk ke portal Quantum Research</p>
          </div>

          {/* Menggunakan Suspense karena komponen dalamnya memakai useSearchParams */}
          <Suspense fallback={<p className={styles.pesanSukses}>Memuat form...</p>}>
            <FormLoginArea />
          </Suspense>

        </div>
      </div>
      
      <p className={styles.footerText}>
        © 2026 Bimbingan Belajar Quantum Research
      </p>
    </div>
  );
}