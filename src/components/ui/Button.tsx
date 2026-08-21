"use client";

import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { C } from "@/lib/constants";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  style?: CSSProperties;
}

export function BtnPrimary({ children, icon, style, disabled, ...props }: BtnProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      {...props}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
        background: hov && !disabled ? C.orangeHov : C.orange, color: "#fff", border: "none", borderRadius: 12,
        padding: "10px 20px", fontSize: 13.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        boxShadow: hov && !disabled ? "0 6px 22px rgba(245,124,0,0.42)" : "0 4px 16px rgba(245,124,0,0.28)",
        transform: hov && !disabled ? "translateY(-1px)" : "none", transition: "all 0.15s", ...style,
      }}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
}

export function BtnGhost({ children, icon, style, disabled, ...props }: BtnProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      {...props}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
        background: hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", color: C.textSec,
        border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, transition: "background 0.15s", ...style,
      }}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
}

export function BtnIcon({ children, onClick, tone = "default" }: { children: ReactNode; onClick?: () => void; tone?: "default" | "danger" | "cyan" }) {
  const [hov, setHov] = useState(false);
  const hoverBg = tone === "danger" ? "rgba(248,113,113,0.1)" : tone === "cyan" ? "rgba(0,180,216,0.1)" : "rgba(255,255,255,0.06)";
  const hoverColor = tone === "danger" ? C.red : tone === "cyan" ? C.cyan : C.textSec;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30, borderRadius: 8, border: "none", background: hov ? hoverBg : "transparent",
        color: hov ? hoverColor : C.textMuted, cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
