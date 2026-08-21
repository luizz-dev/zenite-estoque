import { C } from "@/lib/constants";

export function ProgressBar({ pct, tone = "purple" }: { pct: number; tone?: "purple" | "amber" | "red" }) {
  const cor = tone === "red" ? C.red : tone === "amber" ? C.amber : `linear-gradient(90deg, ${C.purple2}, ${C.purple1})`;
  return (
    <div style={{ width: "100%", height: 10, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 999, background: cor, transition: "width 0.4s ease" }} />
    </div>
  );
}
