"use client";

import { useState, useEffect } from "react";
import styles from "./FilterInput.module.css";
import { KONFIGURASI_SISTEM, LABEL_SISTEM } from "@/utils/constants";

/**
 * @param {{
 *   placeholder?: string,
 *   value?: string,
 *   onChange: (value: string) => void,
 *   type?: string,
 *   className?: string,
 *   delay?: number,
 * }} props
 */
export default function FilterInput({
  placeholder = LABEL_SISTEM.PENCARIAN_DEFAULT,
  value: propValue = "",
  onChange,
  type      = "text",
  className = "",
  delay     = KONFIGURASI_SISTEM.DEBOUNCE_DELAY_MS,
  ...props
}) {
  const [localValue, setLocalValue] = useState(propValue);

  useEffect(() => {
    setLocalValue(propValue);
  }, [propValue]);

  useEffect(() => {
    if (type !== "text" && type !== "search") return;

    if (localValue === propValue) return;

    const timer = setTimeout(() => {
      onChange(localValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, delay, onChange, type, propValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (type !== "text" && type !== "search") {
      onChange(val);
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