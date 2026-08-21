import type { ReactNode } from "react";
import { TONE, type Tone } from "@/lib/constants";

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = TONE[tone] ?? TONE.green;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", background: t.bg, color: t.color,
      border: `1px solid ${t.border}`, borderRadius: 999, padding: "4px 11px", fontSize: 14, fontWeight: 500,
    }}>
      {children}
    </span>
  );
}
