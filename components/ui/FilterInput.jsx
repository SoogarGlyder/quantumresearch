"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./FilterInput.module.css";
import { KONFIGURASI_SISTEM, LABEL_SISTEM } from "@/utils/constants"; // 👈 Import Konstanta

export default function FilterInput({ 
  placeholder = LABEL_SISTEM.PENCARIAN_DEFAULT, // 👈 Zero Hardcode
  value: propValue = "", 
  onChange, 
  type = "text",
  className = "",
  delay = KONFIGURASI_SISTEM.DEBOUNCE_DELAY_MS, // 👈 Zero Hardcode
  ...props
}) {
  const [localValue, setLocalValue] = useState(propValue);
  const isTyping = useRef(false);

  useEffect(() => {
    if (!isTyping.current) {
      setLocalValue(propValue);
    }
  }, [propValue]);

  useEffect(() => {
    if (type !== "text" && type !== "search") return;

    const timer = setTimeout(() => {
      isTyping.current = false; 
      if (localValue !== propValue) {
        onChange({ target: { name: props.name, value: localValue } });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, delay, onChange, type, propValue, props.name]);

  const handleChange = (e) => {
    isTyping.current = true;
    setLocalValue(e.target.value);

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