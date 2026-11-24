// ============================================================================
// VARIAÇÕES DE PRODUTO (tamanho + cor) — regras compartilhadas entre o
// front-end e as rotas de API. Destino: src/lib/variacoes.ts
// ============================================================================

export const TAMANHO_UNICO = "Único";
export const COR_UNICA = "Única";

/** Lista padrão de tamanhos (vestuário). "Único" serve para produto sem tamanho. */
export const TAMANHOS = [
  TAMANHO_UNICO, "PP", "P", "M", "G", "GG", "XG",
  "34", "36", "38", "40", "42", "44", "46", "48",
] as const;

export interface VariacaoBasica { tamanho: string; cor: string }

/** Limpa e padroniza a cor digitada ("  azul   marinho " → "Azul marinho"). */
export const normalizarCor = (cor: string): string => {
  const limpa = (cor ?? "").trim().replace(/\s+/g, " ");
  if (!limpa) return COR_UNICA;
  return limpa.charAt(0).toUpperCase() + limpa.slice(1).toLowerCase();
};

export const normalizarTamanho = (tamanho: string): string => (tamanho ?? "").trim().toUpperCase() === "ÚNICO" ? TAMANHO_UNICO : (tamanho ?? "").trim().toUpperCase();

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Chave para comparar variações (ignora acento e maiúsculas): "M|azul". */
export const chaveVariacao = (v: VariacaoBasica): string =>
  `${semAcento(normalizarTamanho(v.tamanho)).toLowerCase()}|${semAcento(normalizarCor(v.cor)).toLowerCase()}`;

/** "M / Azul" — ou "" quando é Único/Única (produto sem variação real). */
export const rotuloVariacao = (v: VariacaoBasica): string => {
  const partes: string[] = [];
  if (v.tamanho && v.tamanho !== TAMANHO_UNICO) partes.push(v.tamanho);
  if (v.cor && v.cor !== COR_UNICA) partes.push(v.cor);
  return partes.join(" / ");
};

/** "Vestido Midi — M / Azul" (ou só o nome se for Único/Única). */
export const nomeComVariacao = (nome: string, v: VariacaoBasica): string => {
  const rotulo = rotuloVariacao(v);
  return rotulo ? `${nome} — ${rotulo}` : nome;
};

/** SKU da variação: o do produto se for Único/Única; senão SKU-TAMANHO-COR. */
export const gerarSkuVariacao = (skuProduto: string, v: VariacaoBasica): string => {
  const sufixo = [v.tamanho !== TAMANHO_UNICO ? v.tamanho : "", v.cor !== COR_UNICA ? v.cor : ""]
    .filter(Boolean)
    .map((p) => semAcento(p).toUpperCase().replace(/[^A-Z0-9]+/g, ""))
    .join("-");
  return sufixo ? `${skuProduto}-${sufixo}` : skuProduto;
};

export interface EntradaVariacao { id?: string; tamanho: string; cor: string; quantidade: number }

/**
 * Valida e padroniza a lista de variações vinda do formulário.
 * Retorna { erro } ou { variacoes } já normalizadas (sem duplicatas).
 */
export const validarVariacoes = (
  entrada: unknown
): { erro: string } | { variacoes: EntradaVariacao[] } => {
  if (!Array.isArray(entrada) || entrada.length === 0) {
    return { erro: "Informe ao menos uma variação (tamanho e cor) com a quantidade em estoque." };
  }
  const vistas = new Set<string>();
  const saida: EntradaVariacao[] = [];
  for (const bruta of entrada) {
    const tamanho = normalizarTamanho(String(bruta?.tamanho ?? ""));
    if (!tamanho) return { erro: "Toda variação precisa de um tamanho (use \"Único\" se o produto não tem tamanho)." };
    const cor = normalizarCor(String(bruta?.cor ?? ""));
    const quantidade = Number(bruta?.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      return { erro: `Quantidade inválida na variação ${rotuloVariacao({ tamanho, cor }) || "Única"}.` };
    }
    const chave = chaveVariacao({ tamanho, cor });
    if (vistas.has(chave)) {
      return { erro: `Variação repetida: ${rotuloVariacao({ tamanho, cor }) || "Única"}.` };
    }
    vistas.add(chave);
    saida.push({ id: typeof bruta?.id === "string" ? bruta.id : undefined, tamanho, cor, quantidade });
  }
  return { variacoes: saida };
};

/** Ordena variações: tamanhos na ordem da lista padrão (PP, P, M, G...) e depois por cor. */
export const ordenarVariacoes = <T extends VariacaoBasica>(lista: T[]): T[] => {
  const pos = (t: string) => {
    const i = (TAMANHOS as readonly string[]).indexOf(t);
    return i === -1 ? 999 : i;
  };
  return [...lista].sort((a, b) => pos(a.tamanho) - pos(b.tamanho) || a.tamanho.localeCompare(b.tamanho, "pt-BR") || a.cor.localeCompare(b.cor, "pt-BR"));
};