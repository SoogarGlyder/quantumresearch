"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./FilterInput.module.css";

export default function FilterInput({ 
  placeholder = "Ketik di sini...", 
  value: propValue = "", // Beri default string kosong agar tidak undefined
  onChange, 
  type = "text",
  className = "",
  delay = 500,
  ...props
}) {
  const [localValue, setLocalValue] = useState(propValue);
  const isTyping = useRef(false); // 🛡️ PENAWAR: Penanda apakah user sedang mengetik

  // 1. Sinkronisasi dari Parent HANYA JIKA user tidak sedang mengetik
  useEffect(() => {
    if (!isTyping.current) {
      setLocalValue(propValue);
    }
  }, [propValue]);

  // 2. Logika Debounce yang lebih aman
  useEffect(() => {
    if (type !== "text" && type !== "search") return;

    const timer = setTimeout(() => {
      // Setelah delay habis, anggap user selesai mengetik sementara
      isTyping.current = false; 
      
      // Kirim data ke parent jika berbeda
      if (localValue !== propValue) {
        onChange({ target: { name: props.name, value: localValue } }); // Tambahkan name agar parent tahu field mana yang berubah
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, delay, onChange, type, propValue, props.name]);

  // 3. Handler Input
  const handleChange = (e) => {
    isTyping.current = true; // Tandai user sedang ngetik
    setLocalValue(e.target.value);

    // Langsung kirim untuk tipe non-teks
    if (type !== "text" && type !== "search") {
      onChange(e);
      isTyping.current = false;
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