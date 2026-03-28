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
// 🚀 Tambahkan FaEye dan FaEyeSlash
import { 
  FaUserAstronaut, FaLock, FaArrowRightToBracket, 
  FaEye, FaEyeSlash 
} from "react-icons/fa6";

// ============================================================================
// 2. SUB-COMPONENT: FORM LOGIN
// ============================================================================
function FormLoginArea() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- STATE MANAGEMENT ---
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [notifikasi, setNotifikasi] = useState({ teks: "", tipe: "" }); 
  const [loading, setLoading] = useState(false);
  
  // 🚀 STATE BARU: Untuk kontrol intip password
  const [showPassword, setShowPassword] = useState(false);

  // --- EFEK SAMPING ---
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
    if (notifikasi.teks) setNotifikasi({ teks: "", tipe: "" }); 
  };

  return (
    <form onSubmit={handleLogin} noValidate>
      
      {/* Input 1: Identifier */}
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
        <div className={styles.wadahInput} style={{ position: 'relative' }}>
          <div className={styles.ikonInput}>
            <FaLock />
          </div>
          <input
            id="password"
            name="password"
            // 🚀 LOGIKA: Tipe input berubah dinamis antara 'password' dan 'text'
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            className={styles.inputField}
            disabled={loading}
            style={{ paddingRight: '45px' }} // Kasih ruang buat ikon mata
          />
          
          {/* 🚀 TOMBOL INTIP (SHOW/HIDE) */}
          <button
            type="button"
            className={styles.tombolIntip}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1" // Agar tidak mengganggu alur tombol Tab keyboard
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`${styles.tombolMasuk} ${loading ? styles.tombolLoading : ""}`}
      >
        {loading ? "Membuka Gerbang..." : (
          <>Masuk <FaArrowRightToBracket /></>
        )}
      </button>

      {notifikasi.teks && (
        <p className={
          notifikasi.tipe === "error" ? styles.pesanError : styles.messageSuccess
        }>
          {notifikasi.teks}
        </p>
      )}

    </form>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.kartuLogin}>
        <div className={styles.hiasan1}></div>
        <div className={styles.hiasan2}></div>
        <div className={styles.kontenKartu}>
          <div className={styles.wadahLogo}>
            <Image src="/logo-qr-persegi.png" alt="Logo" width={240} height={120} style={{ objectFit: "contain" }} priority />
          </div>
          <div className={styles.headerTeks}>
            <h1 className={styles.judulUtama}>Selamat Datang</h1>
            <p className={styles.subJudul}>Silakan masuk ke portal Quantum Research</p>
          </div>
          <Suspense fallback={<p className={styles.messageSuccess}>Memuat form...</p>}>
            <FormLoginArea />
          </Suspense>
        </div>
      </div>
      <p className={styles.footerText}>© 2026 Bimbingan Belajar Quantum Research</p>
    </div>
  );
}