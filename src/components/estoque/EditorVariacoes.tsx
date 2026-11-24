"use client";

// Destino: src/components/estoque/EditorVariacoes.tsx
// Tabela de variações (tamanho + cor + quantidade) usada no cadastro e na
// edição de produto. Todo produto precisa de ao menos uma variação.
import { Plus, Trash2 } from "lucide-react";
import { C } from "@/lib/constants";
import { Input, Select } from "@/components/ui/Input";
import { BtnGhost, BtnIcon } from "@/components/ui/Button";
import { COR_UNICA, TAMANHOS, TAMANHO_UNICO } from "@/lib/variacoes";
import type { VariacaoEntrada } from "@/lib/types";

// Quantidade fica como texto enquanto o usuário digita (permite campo vazio).
export interface LinhaVariacao { id?: string; tamanho: string; cor: string; quantidade: string }

export const linhaVazia = (): LinhaVariacao => ({ tamanho: TAMANHO_UNICO, cor: COR_UNICA, quantidade: "" });

export const linhasParaEntrada = (linhas: LinhaVariacao[]): VariacaoEntrada[] =>
  linhas.map((l) => ({ id: l.id, tamanho: l.tamanho, cor: l.cor, quantidade: l.quantidade === "" ? NaN : Number(l.quantidade) }));

/** Mensagem de erro (ou null) para a lista de linhas — checagem rápida antes de enviar. */
export const validarLinhas = (linhas: LinhaVariacao[]): string | null => {
  if (linhas.length === 0) return "Adicione ao menos uma variação (tamanho e cor).";
  const vistas = new Set<string>();
  for (const l of linhas) {
    if (!l.tamanho.trim()) return "Escolha o tamanho de todas as variações (use \"Único\" se não houver tamanho).";
    if (l.quantidade === "" || !Number.isInteger(Number(l.quantidade)) || Number(l.quantidade) < 0) return "Informe a quantidade (número inteiro, 0 ou mais) de todas as variações.";
    const chave = `${l.tamanho.trim().toLowerCase()}|${(l.cor.trim() || COR_UNICA).toLowerCase()}`;
    if (vistas.has(chave)) return "Há variações repetidas (mesmo tamanho e mesma cor).";
    vistas.add(chave);
  }
  return null;
};

export function EditorVariacoes({ linhas, onChange, coresSugeridas = [] }: { linhas: LinhaVariacao[]; onChange: (l: LinhaVariacao[]) => void; coresSugeridas?: string[] }) {
  const atualizar = (i: number, parcial: Partial<LinhaVariacao>) => onChange(linhas.map((l, idx) => (idx === i ? { ...l, ...parcial } : l)));
  const remover = (i: number) => onChange(linhas.filter((_, idx) => idx !== i));
  const total = linhas.reduce((a, l) => a + (Number(l.quantidade) || 0), 0);

  return (
    <div>
      <datalist id="zn-cores-sugeridas">
        {coresSugeridas.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div style={{ display: "grid", gridTemplateColumns: "110px 1.4fr 100px 34px", gap: 8, marginBottom: 6 }}>
        {["Tamanho", "Cor", "Quantidade", ""].map((h) => (
          <span key={h} style={{ color: C.textMuted, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1.4fr 100px 34px", gap: 8, alignItems: "center" }}>
            <Select value={l.tamanho} onChange={(e) => atualizar(i, { tamanho: e.target.value })}>
              {/* se já houver um tamanho fora da lista padrão (cadastro antigo), ele continua selecionável */}
              {!(TAMANHOS as readonly string[]).includes(l.tamanho) && <option value={l.tamanho}>{l.tamanho}</option>}
              {TAMANHOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input list="zn-cores-sugeridas" value={l.cor} onChange={(e) => atualizar(i, { cor: e.target.value })} placeholder="Ex: Azul marinho" autoComplete="off" />
            <Input type="number" min={0} value={l.quantidade} onChange={(e) => atualizar(i, { quantidade: e.target.value })} placeholder="0" />
            {linhas.length > 1 ? <BtnIcon tone="danger" onClick={() => remover(i)}><Trash2 size={14} /></BtnIcon> : <span />}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
        <BtnGhost icon={<Plus size={14} />} onClick={() => onChange([...linhas, linhaVazia()])}>Adicionar variação</BtnGhost>
        <span style={{ color: C.textSec, fontSize: 14 }}>Total em estoque: <strong style={{ color: C.white }}>{total} un.</strong></span>
      </div>
      <p style={{ color: C.textMuted, fontSize: 13, margin: "8px 0 0" }}>
        Produto sem tamanho ou cor? Deixe o tamanho como <strong>Único</strong> e a cor como <strong>Única</strong>.
      </p>
    </div>
  );
}