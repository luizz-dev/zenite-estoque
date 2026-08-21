"use client";

import { useState, type InputHTMLAttributes, type SelectHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { C } from "@/lib/constants";

export const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 500, color: C.textSec, display: "block", marginBottom: 6 };

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label style={labelStyle}>{children}</label>;
}

export function Input({ style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFoc(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFoc(false); props.onBlur?.(e); }}
      style={{
        width: "100%", background: C.cardInner, border: `1px solid ${foc ? "rgba(72,55,232,0.6)" : C.border}`,
        borderRadius: 10, padding: "11px 14px", fontSize: 13.5, color: C.white, outline: "none",
        boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.15s", ...style,
      }}
    />
  );
}

export function Select({ style, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const [foc, setFoc] = useState(false);
  return (
    <select
      {...props}
      onFocus={(e) => { setFoc(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFoc(false); props.onBlur?.(e); }}
      style={{
        width: "100%", background: C.cardInner, border: `1px solid ${foc ? "rgba(72,55,232,0.6)" : C.border}`,
        borderRadius: 10, padding: "11px 14px", fontSize: 13.5, color: C.white, outline: "none",
        boxSizing: "border-box", appearance: "none", cursor: "pointer", fontFamily: "inherit", ...style,
      }}
    >
      {children}
    </select>
  );
}
