"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CreditCard, User, Calendar, Lock, X } from "lucide-react";
import { C } from "@/lib/constants";
import { BtnPrimary } from "@/components/ui/Button";

export type Bandeira = "visa" | "mastercard" | "elo";

export type DadosCartao = {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  parcelas: number;
  bandeira: Bandeira;
};

/* ───────────── Utilitários ───────────── */

// Faixas de BIN da Elo (precisam ser checadas antes de Visa/Mastercard)
const ELO_FAIXAS: [number, number][] = [
  [401178, 401179], [431274, 431274], [438935, 438935], [451416, 451416],
  [457393, 457393], [457631, 457632], [504175, 504175], [506699, 506778],
  [509000, 509999], [627780, 627780], [636297, 636297], [636368, 636368],
  [650031, 650033], [650035, 650051], [650405, 650439], [650485, 650538],
  [650541, 650598], [650700, 650718], [650720, 650727], [650901, 650978],
  [651652, 651679], [655000, 655019], [655021, 655058],
];

export function detectarBandeira(digitos: string): Bandeira | null {
  if (digitos.length >= 6) {
    const bin = Number(digitos.slice(0, 6));
    if (ELO_FAIXAS.some(([a, b]) => bin >= a && bin <= b)) return "elo";
  }
  if (digitos.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digitos)) return "mastercard";
  if (digitos.length >= 4) {
    const p = Number(digitos.slice(0, 4));
    if (p >= 2221 && p <= 2720) return "mastercard";
  }
  return null;
}

// Algoritmo de Luhn: confere se o número do cartão é válido
function luhn(digitos: string) {
  let soma = 0;
  let dobrar = false;
  for (let i = digitos.length - 1; i >= 0; i--) {
    let n = Number(digitos[i]);
    if (dobrar) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    soma += n;
    dobrar = !dobrar;
  }
  return soma % 10 === 0;
}

const soDigitos = (v: string) => v.replace(/\D/g, "");
const formatarNumero = (v: string) => soDigitos(v).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const formatarValidade = (v: string) => {
  const d = soDigitos(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

function validadeOk(v: string) {
  if (!/^\d{2}\/\d{2}$/.test(v)) return false;
  const mes = Number(v.slice(0, 2));
  const ano = 2000 + Number(v.slice(3));
  if (mes < 1 || mes > 12) return false;
  // vale até o último dia do mês informado
  return new Date(ano, mes, 1).getTime() > Date.now();
}

/* ───────────── Casca do modal (reaproveitada no Pix) ───────────── */

export function ModalShell({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, background: "rgba(5,10,20,0.78)", backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%", maxWidth: 440, maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box",
          background: "#111B2E", border: `1px solid ${C.border}`, borderTop: `3px solid ${C.orange}`,
          borderRadius: 16, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>{titulo}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ───────────── Campo e selo de bandeira ───────────── */

function Campo({
  label, icon, value, onChange, placeholder, erro, inputMode, autoComplete, type = "text", direita,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  erro?: string;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
  type?: string;
  direita?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, display: "flex" }}>
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 70px 11px 36px", borderRadius: 8, outline: "none",
            background: "rgba(255,255,255,0.05)", border: `1px solid ${erro ? C.red : C.border}`,
            color: C.white, fontSize: 14,
          }}
        />
        {direita && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex" }}>{direita}</span>
        )}
      </div>
      {erro && <p style={{ color: C.red, fontSize: 11.5, margin: "4px 0 0" }}>{erro}</p>}
    </div>
  );
}

function SeloBandeira({ bandeira }: { bandeira: Bandeira | null }) {
  if (!bandeira) return null;
  if (bandeira === "mastercard") {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22" aria-label="Mastercard">
        <circle cx="12" cy="11" r="9" fill="#EB001B" />
        <circle cx="22" cy="11" r="9" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
    );
  }
  const estilo =
    bandeira === "visa"
      ? { label: "VISA", color: "#fff", bg: "#1A4FBF", italic: true }
      : { label: "elo", color: "#fff", bg: "#111", italic: false };
  return (
    <span
      style={{
        background: estilo.bg, color: estilo.color, fontWeight: 800, fontSize: 12, letterSpacing: 0.5,
        fontStyle: estilo.italic ? "italic" : "normal", padding: "3px 8px", borderRadius: 5, border: `1px solid ${C.border}`,
      }}
    >
      {estilo.label}
    </span>
  );
}

/* ───────────── Modal do cartão ───────────── */

export default function ModelCredito({
  valor, maxParcelas, inicial, onClose, onConfirmar,
}: {
  valor: number;
  maxParcelas: number;
  inicial: DadosCartao | null;
  onClose: () => void;
  onConfirmar: (dados: DadosCartao) => void;
}) {
  const [numero, setNumero] = useState(inicial?.numero ?? "");
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [validade, setValidade] = useState(inicial?.validade ?? "");
  const [cvv, setCvv] = useState(inicial?.cvv ?? "");
  const [parcelas, setParcelas] = useState(inicial?.parcelas ?? 1);
  const [tentou, setTentou] = useState(false);

  const digitos = soDigitos(numero);
  const bandeira = detectarBandeira(digitos);

  const erros = {
    numero:
      digitos.length !== 16 ? "O cartão deve ter 16 dígitos."
      : !bandeira ? "Aceitamos apenas Visa, Mastercard e Elo."
      : !luhn(digitos) ? "Número de cartão inválido."
      : "",
    nome: nome.trim().split(/\s+/).filter(Boolean).length < 2 ? "Informe o nome como está no cartão." : "",
    validade: validadeOk(validade) ? "" : "Validade inválida ou vencida.",
    cvv: /^\d{3,4}$/.test(cvv) ? "" : "CVV com 3 ou 4 dígitos.",
  };
  const temErro = Object.values(erros).some(Boolean);

  const confirmar = () => {
    setTentou(true);
    if (temErro || !bandeira) return;
    onConfirmar({ numero: formatarNumero(numero), nome: nome.trim(), validade, cvv, parcelas, bandeira });
  };

  return (
    <ModalShell titulo="Pagamento com cartão" onClose={onClose}>
      <Campo
        label="Número do cartão"
        icon={<CreditCard size={15} />}
        value={formatarNumero(numero)}
        onChange={(v) => setNumero(v)}
        placeholder="0000 0000 0000 0000"
        inputMode="numeric"
        autoComplete="cc-number"
        erro={tentou ? erros.numero : ""}
        direita={<SeloBandeira bandeira={bandeira} />}
      />
      <Campo
        label="Nome impresso no cartão"
        icon={<User size={15} />}
        value={nome}
        onChange={(v) => setNome(v.replace(/[^a-zA-ZÀ-ÿ\s]/g, "").toUpperCase())}
        placeholder="Ex: AQUILES SILVA"
        autoComplete="cc-name"
        erro={tentou ? erros.nome : ""}
      />

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Campo
            label="Validade"
            icon={<Calendar size={15} />}
            value={validade}
            onChange={(v) => setValidade(formatarValidade(v))}
            placeholder="MM/AA"
            inputMode="numeric"
            autoComplete="cc-exp"
            erro={tentou ? erros.validade : ""}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Campo
            label="CVV"
            icon={<Lock size={15} />}
            value={cvv}
            onChange={(v) => setCvv(soDigitos(v).slice(0, 4))}
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
            type="password"
            erro={tentou ? erros.cvv : ""}
          />
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 13, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>Parcelas</label>
        <select
          value={parcelas}
          onChange={(e) => setParcelas(Number(e.target.value))}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 8, outline: "none",
            background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.white, fontSize: 14, cursor: "pointer",
          }}
        >
          {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} style={{ background: "#13213B", color: "#fff" }}>
              {n === 1 ? `1x de ${brl(valor)} (à vista)` : `${n}x de ${brl(valor / n)} sem juros`}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1, padding: 12, borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
            background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted,
          }}
        >
          Cancelar
        </button>
        <BtnPrimary onClick={confirmar} style={{ flex: 1, padding: 12 }}>
          Continuar
        </BtnPrimary>
      </div>
      <p style={{ color: C.textMuted, fontSize: 11, textAlign: "center", margin: "12px 0 0" }}>
        Ambiente de demonstração — nenhum dado de cartão é enviado ou armazenado.
      </p>
    </ModalShell>
  );
}