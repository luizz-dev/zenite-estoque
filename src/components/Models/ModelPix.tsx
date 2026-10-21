"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, Clock, RefreshCw, X } from "lucide-react";
import { C } from "@/lib/constants";
import { BtnPrimary } from "@/components/ui/Button";
import { ModalShell } from "./ModelCredito";

const DURACAO_SEGUNDOS = 15 * 60;
const TEMPO_VERIFICACAO_MS = 5000; // quanto tempo o botão fica travado verificando
const TEMPO_APROVADO_MS = 1400; // quanto o "confirmado" fica visível antes de fechar

// Só para a demonstração: troque para "recusado" para mostrar o fluxo de pagamento recusado.
const RESULTADO_DEMO: "aprovado" | "recusado" = "aprovado";

type Fase = "aguardando" | "processando" | "aprovado" | "recusado";

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

/* QR Code genérico (apenas visual, para demonstração) */
function QrDemo({ seed, tamanho = 190 }: { seed: string; tamanho?: number }) {
  const N = 25;
  const quiet = 2;

  const celulas = useMemo(() => {
    let h = 1779033703;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    let s = h >>> 0;
    const rand = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const finder = (ox: number, oy: number, x: number, y: number) => {
      const dx = x - ox, dy = y - oy;
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
      const borda = dx === 0 || dx === 6 || dy === 0 || dy === 6;
      const centro = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
      return borda || centro;
    };

    const lista: { x: number; y: number }[] = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const f = finder(0, 0, x, y) ?? finder(N - 7, 0, x, y) ?? finder(0, N - 7, x, y);
        if (f !== null) {
          if (f) lista.push({ x, y });
          continue;
        }
        const zonaReservada = (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
        if (!zonaReservada && rand() > 0.5) lista.push({ x, y });
      }
    }
    return lista;
  }, [seed]);

  const total = N + quiet * 2;
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${total} ${total}`} shapeRendering="crispEdges" aria-label="QR Code de demonstração">
      <rect width={total} height={total} fill="#fff" />
      {celulas.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x + quiet} y={c.y + quiet} width="1" height="1" fill="#0B1220" />
      ))}
    </svg>
  );
}

export default function ModelPix({
  valor, onClose, onConfirmar,
}: {
  valor: number;
  onClose: () => void;
  onConfirmar: () => void;
}) {
  const [fase, setFase] = useState<Fase>("aguardando");
  const [codigoId, setCodigoId] = useState(1);
  const [expiraEm, setExpiraEm] = useState(() => Date.now() + DURACAO_SEGUNDOS * 1000);
  const [agora, setAgora] = useState(() => Date.now());
  const [copiado, setCopiado] = useState(false);

  const onConfirmarRef = useRef(onConfirmar);
  onConfirmarRef.current = onConfirmar;

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Verificando (5s) → resultado → se aprovado, fecha o popup e volta pro cadastro
  useEffect(() => {
    if (fase !== "processando" && fase !== "aprovado") return;
    const t = setTimeout(
      () => (fase === "processando" ? setFase(RESULTADO_DEMO) : onConfirmarRef.current()),
      fase === "processando" ? TEMPO_VERIFICACAO_MS : TEMPO_APROVADO_MS
    );
    return () => clearTimeout(t);
  }, [fase]);

  const bloqueado = fase === "processando" || fase === "aprovado";
  const restante = Math.max(0, Math.ceil((expiraEm - agora) / 1000));
  const expirou = restante === 0 && !bloqueado;
  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");

  const copiaECola = `00020126580014BR.GOV.BCB.PIX0136zenite-demo-${codigoId}@pix.com.br5204000053039865406${valor
    .toFixed(2)}5802BR5907ZENITE6009SAO PAULO62070503***6304DEMO`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* navegador sem permissão de clipboard */
    }
  };

  const gerarNovo = () => {
    setCodigoId((n) => n + 1);
    setExpiraEm(Date.now() + DURACAO_SEGUNDOS * 1000);
    setAgora(Date.now());
    setFase("aguardando");
  };

  const corTimer = expirou || restante <= 60 ? C.red : C.orange;

  const botaoSecundario = {
    flex: 1, padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600,
    background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted,
    cursor: bloqueado ? "not-allowed" : "pointer", opacity: bloqueado ? 0.5 : 1,
  } as const;

  return (
    <ModalShell titulo="Pagamento via Pix" onClose={bloqueado ? () => {} : onClose}>
      <style>{`
        @keyframes zenite-spin { to { transform: rotate(360deg); } }
        @keyframes zenite-pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", margin: "0 0 14px" }}>
        Abra o app do seu banco e escaneie o código para pagar.
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, opacity: expirou ? 0.25 : 1 }}>
          <QrDemo seed={`zenite-pix-${codigoId}`} />

          {/* Validação em cima do QR Code */}
          {fase !== "aguardando" && (
            <div
              style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 10, padding: 12, textAlign: "center", background: "rgba(11,18,32,0.92)",
              }}
            >
              {fase === "processando" && (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid rgba(245,124,0,0.2)", borderTopColor: C.orange, animation: "zenite-spin 0.9s linear infinite" }} />
                  <span style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>Verificando pagamento...</span>
                </>
              )}
              {fase === "aprovado" && (
                <>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(52,211,153,0.12)", border: "2px solid #34D399", animation: "zenite-pop 0.4s ease-out" }}>
                    <Check size={26} color="#34D399" />
                  </div>
                  <span style={{ color: "#34D399", fontSize: 13, fontWeight: 700 }}>Pagamento confirmado!</span>
                </>
              )}
              {fase === "recusado" && (
                <>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(248,113,113,0.12)", border: `2px solid ${C.red}`, animation: "zenite-pop 0.4s ease-out" }}>
                    <X size={26} color={C.red} />
                  </div>
                  <span style={{ color: C.red, fontSize: 13, fontWeight: 700 }}>Pagamento não identificado</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ color: C.white, fontSize: 20, fontWeight: 700 }}>{brl(valor)}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, marginTop: 4, color: fase === "aprovado" ? "#34D399" : fase === "recusado" ? C.red : corTimer }}>
          <Clock size={14} />
          {fase === "processando"
            ? "Processando pagamento, aguarde..."
            : fase === "aprovado"
            ? "Pagamento confirmado"
            : fase === "recusado"
            ? "Pagamento recusado — tente novamente"
            : expirou
            ? "Código expirado"
            : `Expira em ${mm}:${ss}`}
        </div>
      </div>

      <label style={{ display: "block", fontSize: 13, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>Pix copia e cola</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input
          readOnly
          value={copiaECola}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 8, outline: "none", boxSizing: "border-box",
            background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12,
            textOverflow: "ellipsis",
          }}
        />
        <button
          type="button"
          onClick={copiar}
          disabled={expirou || bloqueado}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "0 14px", borderRadius: 8,
            cursor: expirou || bloqueado ? "not-allowed" : "pointer",
            border: `1px solid ${copiado ? "#34D399" : C.orange}`, background: "rgba(245,124,0,0.12)",
            color: copiado ? "#34D399" : C.orange, fontSize: 13, fontWeight: 600, opacity: expirou || bloqueado ? 0.5 : 1,
          }}
        >
          {copiado ? <Check size={15} /> : <Copy size={15} />}
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>

      {expirou ? (
        <BtnPrimary onClick={gerarNovo} style={{ width: "100%", padding: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={15} /> Gerar novo código
          </span>
        </BtnPrimary>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} disabled={bloqueado} style={botaoSecundario}>
            Cancelar
          </button>
          {fase === "recusado" ? (
            <BtnPrimary onClick={() => setFase("aguardando")} style={{ flex: 1, padding: 12 }}>
              Tentar novamente
            </BtnPrimary>
          ) : (
            <BtnPrimary onClick={() => setFase("processando")} disabled={bloqueado} style={{ flex: 1, padding: 12 }}>
              {fase === "processando" ? "Verificando..." : fase === "aprovado" ? "Confirmado ✓" : "Confirmar pagamento"}
            </BtnPrimary>
          )}
        </div>
      )}
      <p style={{ color: C.textMuted, fontSize: 11, textAlign: "center", margin: "12px 0 0" }}>
        Ambiente de demonstração — QR Code e chave ilustrativos.
      </p>
    </ModalShell>
  );
}