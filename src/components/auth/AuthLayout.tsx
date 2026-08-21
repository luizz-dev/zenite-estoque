"use client";

import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { C } from "@/lib/constants";

const LogoMark = ({ size = 92 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white" style={{ opacity: 0.96 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse 120% 70% at 50% -10%, #241b52 0%, #140f38 45%, #0a0620 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1.5px)",
        backgroundSize: "44px 44px", opacity: 0.45, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", display: "flex",
        flexDirection: "column", alignItems: "center", pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
      }}>
        <Globe size={24} style={{ color: "rgba(255,255,255,0.16)", marginBottom: 10 }} />
        <span style={{ fontSize: "clamp(48px,9vw,104px)", fontWeight: 800, letterSpacing: 12, color: "rgba(255,255,255,0.055)" }}>ZÊNITE</span>
      </div>
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export function AuthSplitCard({ orangeSide = "right", children }: { orangeSide?: "left" | "right"; children: ReactNode }) {
  const orange = (
    <div style={{ flex: "0 0 260px", background: `linear-gradient(135deg,${C.orange},${C.orangeHov})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <LogoMark />
    </div>
  );
  const form = (
    <div style={{ flex: 1, minWidth: 300, background: "rgba(13,18,38,0.88)", backdropFilter: "blur(12px)", padding: "38px 42px" }}>
      {children}
    </div>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: "100%", maxWidth: 720, borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,0.55)", border: `1px solid ${C.border}` }}>
      {orangeSide === "right" ? <>{form}{orange}</> : <>{orange}{form}</>}
    </div>
  );
}

export function AuthField({ label, icon, ...props }: { label: string; icon: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "#C7D2E8", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, display: "flex" }}>{icon}</span>
        <input {...props} style={{
          width: "100%", background: C.cardInner, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px 11px 36px",
          fontSize: 13.5, color: C.white, outline: "none", boxSizing: "border-box",
        }} />
      </div>
    </div>
  );
}

export function OnboardingStepper({ atual, total = 2 }: { atual: number; total?: number }) {
  const steps = total === 2 ? ["Cadastro", "Pagamento"] : ["Cadastro", "Assinatura", "Config. NF-e"];
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 500, marginBottom: 22 }}>
      {steps.map((s, i) => {
        const n = i + 1, done = n < atual, active = n === atual;
        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {i > 0 && <div style={{ flex: 1, height: 2, background: done || active ? "linear-gradient(90deg,#4837E8,rgba(72,55,232,0.3))" : "rgba(255,255,255,0.12)" }} />}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0, background: done || active ? C.purple1 : "rgba(255,255,255,0.1)",
                color: done || active ? C.white : "#8C9CC1", border: `2px solid ${done || active ? C.purple1 : "rgba(255,255,255,0.15)"}`,
              }}>{done ? "✓" : n}</div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "rgba(72,55,232,0.5)" : "rgba(255,255,255,0.12)" }} />}
            </div>
            <p style={{ color: active ? C.purpleText : done ? C.cyanText : "#8C9CC1", fontSize: 11, fontWeight: 500, margin: "6px 0 0" }}>{s}</p>
          </div>
        );
      })}
    </div>
  );
}
