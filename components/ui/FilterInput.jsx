"use client";

import { useState, useEffect } from "react";
import styles from "./FilterInput.module.css";

export default function FilterInput({ 
  placeholder = "Ketik di sini...", 
  value: propValue, // Nilai dari parent
  onChange, 
  type = "text",
  className = "",
  delay = 500, // Jeda default 500ms
  ...props
}) {
  // 1. State lokal untuk menangani input yang "instan" (tanpa lag)
  const [localValue, setLocalValue] = useState(propValue);

  // 2. Sinkronisasi jika propValue diubah dari luar (misal: tombol Reset diklik)
  useEffect(() => {
    setLocalValue(propValue);
  }, [propValue]);

  // 3. Logika Debounce
  useEffect(() => {
    // Jika tipenya bukan text atau search, tidak perlu debounce (langsung saja)
    if (type !== "text" && type !== "search") return;

    // Jangan jalankan debounce jika nilai lokal masih sama dengan nilai di parent
    if (localValue === propValue) return;

    const timer = setTimeout(() => {
      // Kirim event buatan ke parent agar tidak merusak logic (e.target.value)
      onChange({ target: { value: localValue } });
    }, delay);

    // Bersihkan timer jika user mengetik lagi sebelum waktu habis
    return () => clearTimeout(timer);
  }, [localValue, delay, onChange, propValue, type]);

  // 4. Handler untuk input non-debounce (date, month, select, dll)
  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);

    // Jika bukan tipe text, langsung kirim ke parent tanpa nunggu jeda
    if (type !== "text" && type !== "search") {
      onChange(e);
    }
  };

  return (
    <input 
      type={type} 
      placeholder={placeholder} 
      value={localValue} 
      onChange={handleChange} 
      className={`${styles.inputBrutal} ${className}`}
      {...props} 
    />
  );
}