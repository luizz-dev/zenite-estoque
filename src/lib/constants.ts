// ============================================================================
// CONSTANTES — cores do design system, dados fixos da empresa e tabelas
// de domínio (formas de pagamento, CSOSN, UFs). Nada aqui vem do banco:
// são "regras de negócio"/visual fixas do app.
// ============================================================================

export const C = {
  bg: "#0A1628",
  sidebar: "#0E1B30",
  card: "#1B263B",
  cardInner: "#131F35",
  border: "rgba(255,255,255,0.07)",
  purple1: "#4837E8",
  purple2: "#5739C4",
  cyan: "#00B4D8",
  orange: "#F57C00",
  orangeHov: "#FF8C1A",
  white: "#FFFFFF",
  textSec: "#A8B5D1",
  textMuted: "#5C6D90",
  green: "#4ADE80",
  amber: "#FFA94D",
  red: "#F87171",
  purpleText: "#A99AF5",
  cyanText: "#5FD3EC",
} as const;

export type Tone = "green" | "amber" | "cyan" | "purple" | "red" | "muted";

export const TONE: Record<Tone, { bg: string; color: string; border: string }> = {
  green:  { bg: "rgba(74,222,128,0.12)",  color: C.green,      border: "rgba(74,222,128,0.25)" },
  amber:  { bg: "rgba(255,169,77,0.12)",  color: C.amber,      border: "rgba(255,169,77,0.25)" },
  cyan:   { bg: "rgba(0,180,216,0.12)",   color: C.cyanText,   border: "rgba(0,180,216,0.25)" },
  purple: { bg: "rgba(72,55,232,0.15)",   color: C.purpleText, border: "rgba(72,55,232,0.25)" },
  red:    { bg: "rgba(248,113,113,0.12)", color: C.red,        border: "rgba(248,113,113,0.25)" },
  muted:  { bg: "rgba(92,109,144,0.12)",  color: C.textMuted,  border: "rgba(92,109,144,0.25)" },
};

// Dados fixos da sua empresa — troque pelos seus dados reais.
// Em produção o ideal é mover isso para uma tabela "Empresa" no banco
// (ver seção "Próximos passos" no README_INTEGRACAO.md).
export const EMPRESA = {
  razaoSocial: "Bom Tecido Confecções ME",
  cnpj: "12.345.678/0001-90",
  ie: "114.857.230.117",
  uf: "SP",
  regime: "MEI — Simples Nacional",
  certValidade: "03/2027",
};

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export const FORMAS_PAGAMENTO = [
  { v: "01", l: "Dinheiro" },
  { v: "03", l: "Cartão de Crédito" },
  { v: "04", l: "Cartão de Débito" },
  { v: "17", l: "PIX" },
  { v: "15", l: "Boleto Bancário" },
];

export const CSOSN_OPTS = [
  { v: "102", l: "102 — Simples Nacional, sem permissão de crédito", nota: "Alíquota de ICMS não destacada na nota (regra geral do MEI/Simples)." },
  { v: "101", l: "101 — Simples Nacional, com permissão de crédito",  nota: "Permite ao destinatário aproveitar crédito de ICMS, se aplicável." },
  { v: "500", l: "500 — ICMS cobrado anteriormente (Subst. Tributária)", nota: "Use quando o imposto já foi recolhido antes, na cadeia." },
];

export const UNIDADES: [string, string][] = [["UN","Unidade"],["PC","Peça"],["CX","Caixa"],["KG","Quilograma"]];

export const STATUS_FISCAL_INFO: Record<string, { label: string; tone: Tone }> = {
  autorizada: { label: "Autorizada", tone: "green" },
  pendente:   { label: "Pendente",   tone: "amber" },
  rejeitada:  { label: "Rejeitada",  tone: "red" },
  cancelada:  { label: "Cancelada",  tone: "muted" },
};

export const CATEGORIAS_CONTA = ["Estrutura", "Serviços", "Materiais", "Impostos", "Marketing", "Outros"];

export const PLANOS_ASSINATURA = [
  { v: "mensal", l: "Mensal", valor: 49.9, sub: "Cobrado todo mês" },
  { v: "anual", l: "Anual", valor: 479.0, sub: "Equivale a R$ 39,92/mês — 2 meses grátis" },
] as const;

// Indicadores do MEI mostrados no Dashboard.
// Hoje são fixos; a seção "Próximos passos" explica como calculá-los a
// partir das notas fiscais reais do banco.
export const MEI = {
  faturamentoMes: 18450,
  faturamentoMesAnterior: 16420,
  ticketMedio: 154.3,
  ticketMedioAnterior: 148.7,
  faturamentoAnualAcumulado: 54320,
  limiteAnualMEI: 81000,
  dasValor: 76.9,
  dasVencimento: "19/06/2026",
  dasDiasRestantes: 3,
};
