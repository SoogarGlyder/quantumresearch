"use client";

import styles from "./FilterInput.module.css";

export default function FilterInput({ 
  placeholder = "Ketik di sini...", 
  value, 
  onChange, 
  type = "text",
  className = "",
  ...props
}) {
  return (
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      className={`${styles.inputBrutal} ${className}`}
      {...props} 
    />
  );
}