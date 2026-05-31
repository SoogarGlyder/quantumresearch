"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { prosesLogin } from "../../actions/authAction";
import { PESAN_SISTEM } from "../../utils/constants";
import styles from "./LoginPage.module.css";
import {
  FaUserAstronaut, FaLock, FaArrowRightToBracket,
  FaEye, FaEyeSlash,
} from "react-icons/fa6";

// ============================================================================
// SUB-KOMPONEN: FORM AREA
// ============================================================================
function FormLoginArea() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm]             = useState({ identifier: "", password: "" });
  const [notifikasi, setNotifikasi] = useState({ teks: "", tipe: "" });
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("clear") === "true") {
      setNotifikasi({ teks: PESAN_SISTEM.SESI_HABIS, tipe: "error" });
      router.replace("/login");
    }
  }, [searchParams, router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.identifier.trim() || !form.password.trim()) {
      setNotifikasi({ teks: "Mohon isi ID pengguna dan Kata Sandi.", tipe: "error" });
      return;
    }

    setLoading(true);
    setNotifikasi({ teks: "Memverifikasi identitas...", tipe: "info" });

    let loginBerhasil = false;

    try {
      const hasil = await prosesLogin(form);

      if (hasil.ok) {
        loginBerhasil = true;
        setNotifikasi({ teks: hasil.pesan, tipe: "sukses" });
        window.location.href = "/";
      } else {
        setNotifikasi({ teks: hasil.pesan, tipe: "error" });
      }
    } catch (error) {
      console.error("[ERROR handleLogin]:", error);
      setNotifikasi({ teks: "Gagal terhubung ke server.", tipe: "error" });
    } finally {
      if (!loginBerhasil) setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (notifikasi.teks) setNotifikasi({ teks: "", tipe: "" });
  };

  return (
    <form onSubmit={handleLogin} noValidate>
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

      <div className={styles.grupInput}>
        <label htmlFor="password" className={styles.labelInput}>
          Kata Sandi
        </label>
        <div className={`${styles.wadahInput} ${styles.wadahInputRelatif}`}>
          <div className={styles.ikonInput}>
            <FaLock />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            className={`${styles.inputField} ${styles.inputDenganToggle}`}
            disabled={loading}
          />
          <button
            type="button"
            className={styles.tombolIntip}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
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
        {loading ? (
          "Membuka Gerbang..."
        ) : (
          <>
            Masuk <FaArrowRightToBracket />
          </>
        )}
      </button>

      {notifikasi.teks && (
        <p
          className={
            notifikasi.tipe === "error"
              ? styles.pesanError
              : styles.messageSuccess
          }
        >
          {notifikasi.teks}
        </p>
      )}
    </form>
  );
}

// ============================================================================
// HALAMAN LOGIN
// ============================================================================
export default function LoginPage() {
  useEffect(() => {

    const tanganiPageshow = (event) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", tanganiPageshow);
    return () => window.removeEventListener("pageshow", tanganiPageshow);
  }, []);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.kartuLogin}>
        <div className={styles.hiasan1} />
        <div className={styles.hiasan2} />
        <div className={styles.kontenKartu}>
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
            <p className={styles.subJudul}>
              Silakan masuk ke portal Quantum Research
            </p>
          </div>
          <Suspense
            fallback={<p className={styles.messageSuccess}>Memuat form...</p>}
          >
            <FormLoginArea />
          </Suspense>
        </div>
      </div>
      <p className={styles.footerText}>
        © {new Date().getFullYear()} Bimbingan Belajar Quantum Research
      </p>
    </div>
  );
}