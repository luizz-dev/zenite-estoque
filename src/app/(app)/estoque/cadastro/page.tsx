"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Info, AlertTriangle, Check, Eye } from "lucide-react";
import { C } from "@/lib/constants";
import { UNIDADES } from "@/lib/constants";
import { brl, pctMargem } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";

const FORM_VAZIO = { nome: "", sku: "", categoria: "", unidade: "UN", quantidade: "", quantidadeMinima: "8", precoCusto: "", precoVenda: "", fornecedor: "", ncm: "", descricao: "" };
const STEPS = ["Identificação", "Precificação", "Detalhes", "Revisão"];
const STEP_TITULOS = ["Identificação do Produto", "Precificação", "Detalhes e Informações Técnicas", "Revisão Final"];
const STEP_SUBS = ["Nome, SKU, categoria e unidade de medida", "Preços, quantidade e cálculo de margem", "Fornecedor, NCM e descrição técnica do produto", "Confira todos os dados antes de cadastrar"];
const STEP_DICAS = [
  "Use nomes descritivos e padronizados — facilita a busca no estoque e a identificação na NF-e.",
  "Margens abaixo de 25% podem comprometer a saúde financeira do negócio.",
  "O NCM incorreto é a principal causa de rejeição de notas fiscais pela SEFAZ.",
  "Após cadastrar, o produto já estará disponível para emissão de NF-e imediatamente.",
];

const inputStyle = { fontSize: 16 };

export default function CadastrarItemPage() {
  const { criarProduto } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const margem = form.precoCusto && form.precoVenda ? pctMargem(+form.precoCusto, +form.precoVenda) : null;
  const lucroUn = form.precoCusto && form.precoVenda ? brl(+form.precoVenda - +form.precoCusto) : null;
  const valorEstoque = form.precoVenda && form.quantidade ? brl(+form.precoVenda * +form.quantidade) : null;

  const validarEtapa = (s: number): string | null => {
    if (s === 1) {
      if (!form.nome.trim()) return "Informe o nome do produto.";
      if (!form.sku.trim()) return "Informe o código SKU.";
      if (!form.categoria.trim()) return "Informe a categoria.";
    }
    if (s === 2) {
      if (!form.quantidade) return "Informe a quantidade inicial.";
      if (!form.precoCusto) return "Informe o preço de custo.";
      if (!form.precoVenda) return "Informe o preço de venda.";
    }
    if (s === 3) {
      if (!form.fornecedor.trim()) return "Informe o fornecedor.";
      if (!form.ncm.trim()) return "Informe o código NCM.";
    }
    return null;
  };

  const avancar = () => {
    const msg = validarEtapa(step);
    if (msg) { setErro(msg); return; }
    setErro("");
    setStep((s) => Math.min(4, s + 1));
  };

  const salvar = async () => {
    setErro(""); setSalvando(true);
    try {
      await criarProduto({
        nome: form.nome, sku: form.sku, categoria: form.categoria || "Outros", unidade: form.unidade,
        quantidade: Number(form.quantidade) || 0, quantidadeMinima: Number(form.quantidadeMinima) || 8,
        precoCusto: Number(form.precoCusto) || 0, precoVenda: Number(form.precoVenda) || 0,
        fornecedor: form.fornecedor, ncm: form.ncm, descricao: form.descricao,
      });
      setSucesso(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao cadastrar o produto.");
    } finally {
      setSalvando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="zn-page-enter">
        <Topbar titulo="Cadastrar Itens" sub="Estoque › Cadastrar Itens" />
        <div style={{ maxWidth: 580, margin: "0 auto" }} className="zn-modal-enter">
          <Card style={{ textAlign: "center", padding: "52px 32px" }}>
            <div style={{ width: 68, height: 68, borderRadius: 18, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: C.green, margin: "0 auto 20px" }}>
              <Check size={28} />
            </div>
            <h3 style={{ color: C.white, fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>Produto cadastrado com sucesso!</h3>
            <p style={{ color: C.textSec, fontSize: 14.5, lineHeight: 1.7, margin: "0 0 28px" }}>
              <strong style={{ color: C.white }}>{form.nome}</strong> foi adicionado ao estoque com o SKU <strong style={{ color: C.white }}>{form.sku}</strong> e já está disponível para emissão de NF-e.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <BtnGhost onClick={() => { setForm(FORM_VAZIO); setStep(1); setSucesso(false); }}>Cadastrar outro produto</BtnGhost>
              <BtnPrimary icon={<Eye size={15} />} onClick={() => router.push("/estoque")}>Ver no Estoque</BtnPrimary>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="zn-page-enter">
      <Topbar titulo="Cadastrar Itens" sub="Estoque › Cadastrar Itens" />

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        {STEPS.map((s, i) => {
          const done = i + 1 < step, active = i + 1 === step;
          return (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: i === 0 ? "flex-start" : i === STEPS.length - 1 ? "flex-end" : "center" }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: done || active ? "linear-gradient(90deg,#4837E8,rgba(72,55,232,0.3))" : "rgba(255,255,255,0.07)" }} />}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0,
                  background: done || active ? C.purple1 : "rgba(255,255,255,0.07)", color: done || active ? C.white : C.textMuted,
                  border: `2px solid ${done || active ? C.purple1 : "rgba(255,255,255,0.1)"}`, transition: "all 0.25s",
                }}>{done ? <Check size={14} /> : i + 1}</div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "rgba(72,55,232,0.5)" : "rgba(255,255,255,0.07)" }} />}
              </div>
              <p style={{ color: active ? C.purpleText : done ? C.cyanText : C.textMuted, fontSize: 14, fontWeight: 500, margin: "6px 0 0", textAlign: "center" }}>{s}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
        <Card>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{STEP_TITULOS[step - 1]}</h3>
            <p style={{ color: C.textMuted, fontSize: 14.5, margin: 0 }}>{STEP_SUBS[step - 1]}</p>
          </div>

          <div key={step} className="zn-fade-step">
            {step === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <FieldLabel>Nome do Produto <span style={{ color: C.red }}>*</span></FieldLabel>
                  <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Vestido Midi Estampado" style={inputStyle} />
                </div>
                <div>
                  <FieldLabel>Código SKU <span style={{ color: C.red }}>*</span></FieldLabel>
                  <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Ex: VST-0021" />
                  <p style={{ color: C.textMuted, fontSize: 14.5, margin: "5px 0 0" }}>Identificador único do produto</p>
                </div>
                <div>
                  <FieldLabel>Categoria <span style={{ color: C.red }}>*</span></FieldLabel>
                  <Input value={form.categoria} onChange={(e) => set("categoria", e.target.value)} placeholder="Ex: Vestidos" />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <FieldLabel>Unidade de Medida</FieldLabel>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {UNIDADES.map(([v, l]) => {
                      const active = form.unidade === v;
                      return (
                        <button key={v} onClick={() => set("unidade", v)} style={{
                          padding: "8px 14px", borderRadius: 9, border: `1px solid ${active ? C.purple1 : C.border}`, cursor: "pointer",
                          fontSize: 14, fontWeight: 500, background: active ? "rgba(72,55,232,0.2)" : "rgba(255,255,255,0.02)", color: active ? C.purpleText : C.textSec,
                        }}><strong>{v}</strong> <span style={{ opacity: 0.7 }}>— {l}</span></button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <FieldLabel>Quantidade Inicial <span style={{ color: C.red }}>*</span></FieldLabel>
                  <Input type="number" value={form.quantidade} onChange={(e) => set("quantidade", e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <FieldLabel>Qtd. Mínima (Alerta)</FieldLabel>
                  <Input type="number" value={form.quantidadeMinima} onChange={(e) => set("quantidadeMinima", e.target.value)} placeholder="8" />
                  <p style={{ color: C.textMuted, fontSize: 11, margin: "5px 0 0" }}>Alerta quando atingir este nível</p>
                </div>
                <div>
                  <FieldLabel>Preço de Custo (R$) <span style={{ color: C.red }}>*</span></FieldLabel>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 13 }}>R$</span>
                    <Input type="number" value={form.precoCusto} onChange={(e) => set("precoCusto", e.target.value)} placeholder="0,00" style={{ paddingLeft: 36 }} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Preço de Venda (R$) <span style={{ color: C.red }}>*</span></FieldLabel>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 13 }}>R$</span>
                    <Input type="number" value={form.precoVenda} onChange={(e) => set("precoVenda", e.target.value)} placeholder="0,00" style={{ paddingLeft: 36 }} />
                  </div>
                </div>
                {(form.precoCusto || form.precoVenda || form.quantidade) && (
                  <div style={{ gridColumn: "1/-1", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                    {[
                      ["Margem Bruta", margem ? `${margem}%` : "—", margem ? (+margem >= 40 ? C.green : +margem >= 25 ? C.amber : C.red) : C.textMuted],
                      ["Lucro por Un.", lucroUn || "—", C.white],
                      ["Valor Inicial do Est.", valorEstoque || "—", C.white],
                    ].map(([l, v, color]) => (
                      <div key={l as string} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                        <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 4px" }}>{l}</p>
                        <p style={{ color: color as string, fontSize: 16, fontWeight: 700, margin: 0 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <FieldLabel>Fornecedor <span style={{ color: C.red }}>*</span></FieldLabel>
                    <Input value={form.fornecedor} onChange={(e) => set("fornecedor", e.target.value)} placeholder="Ex: Textil Bom Tecido Ltda." />
                  </div>
                  <div>
                    <FieldLabel>Código NCM <span style={{ color: C.red }}>*</span> <span style={{ color: C.cyan, fontSize: 14 }}>← obrigatório para NF-e</span></FieldLabel>
                    <Input value={form.ncm} onChange={(e) => set("ncm", e.target.value)} placeholder="Ex: 6104.4200" />
                    <p style={{ color: C.textMuted, fontSize: 14.5, margin: "5px 0 0" }}>Nomenclatura Comum do Mercosul — cada tipo de peça pode ter um NCM diferente</p>
                  </div>
                </div>
                <div style={{ borderRadius: 12, border: "1px solid rgba(245,124,0,0.22)", background: "rgba(245,124,0,0.06)", padding: "12px 14px", display: "flex", gap: 10 }}>
                  <span style={{ color: C.amber, display: "flex", flexShrink: 0, marginTop: 1 }}><AlertTriangle size={15} /></span>
                  <div>
                    <p style={{ color: C.amber, fontSize: 14, fontWeight: 600, margin: "0 0 3px" }}>NCM incorreto causa rejeição da NF-e pela SEFAZ</p>
                    <p style={{ color: C.textMuted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>Verifique o código na tabela NCM disponível no portal da Receita Federal antes de cadastrar. Definir aqui evita retrabalho na hora de emitir a nota.</p>
                  </div>
                </div>
                <div>
                  <FieldLabel>Descrição Técnica</FieldLabel>
                  <textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)}
                    placeholder="Descreva o produto: materiais, tamanhos disponíveis, características..."
                    style={{
                      width: "100%", background: C.cardInner, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px",
                      fontSize: 14.5, color: C.white, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                      height: 90, resize: "vertical", lineHeight: 1.6,
                    }} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ borderRadius: 12, border: "1px solid rgba(72,55,232,0.25)", background: "rgba(72,55,232,0.06)", padding: 18 }}>
                  <p style={{ color: C.purpleText, fontSize: 14, fontWeight: 600, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Resumo do Cadastro</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      ["Nome", form.nome || "—"], ["SKU", form.sku || "—"], ["Categoria", form.categoria || "—"], ["Unidade", form.unidade || "UN"],
                      ["Qtd. Inicial", (form.quantidade || "0") + " un."], ["Qtd. Mínima", (form.quantidadeMinima || "8") + " un."],
                      ["Fornecedor", form.fornecedor || "—"], ["NCM", form.ncm || "—"],
                      ["Preço Custo", form.precoCusto ? brl(+form.precoCusto) : "—"], ["Preço Venda", form.precoVenda ? brl(+form.precoVenda) : "—"],
                      margem ? ["Margem", `${margem}%`] : null, lucroUn ? ["Lucro/Un.", lucroUn] : null,
                    ].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                      <div key={k}><p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>{k}</p><p style={{ color: C.white, fontSize: 14, fontWeight: 500, margin: "2px 0 0" }}>{v}</p></div>
                    ))}
                  </div>
                </div>
                {form.descricao && (
                  <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", padding: "12px 14px" }}>
                    <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 4px" }}>Descrição Técnica</p>
                    <p style={{ color: C.textSec, fontSize: 14.5, margin: 0, lineHeight: 1.6 }}>{form.descricao}</p>
                  </div>
                )}
                <div style={{ borderRadius: 12, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.05)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.green, display: "flex" }}><Check size={16} /></span>
                  <p style={{ color: C.green, fontSize: 14, fontWeight: 600, margin: 0 }}>Pronto para cadastrar — todos os campos preenchidos</p>
                </div>
              </div>
            )}
          </div>

          {erro && (
            <div style={{ borderRadius: 12, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "11px 14px", marginTop: 14, color: C.red, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={15} /> {erro}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
            <BtnGhost onClick={() => { setErro(""); setStep((s) => Math.max(1, s - 1)); }} disabled={step === 1}>← Voltar</BtnGhost>
            <div style={{ display: "flex", gap: 5 }}>
              {STEPS.map((_, i) => (
                <span key={i} style={{ height: 6, width: i + 1 === step ? 20 : 6, borderRadius: 99, background: i + 1 <= step ? C.purple1 : "rgba(255,255,255,0.1)", transition: "all 0.3s" }} />
              ))}
            </div>
            {step < 4
              ? <BtnPrimary onClick={avancar}>Próximo →</BtnPrimary>
              : <BtnPrimary icon={<Plus size={15} />} onClick={salvar} disabled={salvando}>{salvando ? "Cadastrando..." : "Cadastrar Produto"}</BtnPrimary>}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <p style={{ color: C.purpleText, fontSize: 14.5, fontWeight: 600, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Prévia do Produto</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(72,55,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.purpleText }}><Tag size={18} /></div>
              <div>
                <p style={{ color: form.nome ? C.white : C.textMuted, fontSize: 14, fontWeight: 600, margin: 0 }}>{form.nome || "Nome do produto"}</p>
                <p style={{ color: C.textMuted, fontSize: 13.5, margin: "2px 0 0" }}>{form.sku || "SKU"} · {form.categoria || "Categoria"}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.textMuted, fontSize: 14 }}>Preço de Venda</span><span style={{ color: C.white, fontSize: 14.5, fontWeight: 500 }}>{form.precoVenda ? brl(+form.precoVenda) : "—"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.textMuted, fontSize: 14 }}>Qtd. Inicial</span><span style={{ color: C.textSec, fontSize: 14.5, fontWeight: 500 }}>{form.quantidade || "0"} un.</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.textMuted, fontSize: 14 }}>Fornecedor</span><span style={{ color: C.textSec, fontSize: 14.5, fontWeight: 500 }}>{form.fornecedor || "—"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.textMuted, fontSize: 14 }}>NCM</span><span style={{ color: C.textSec, fontSize: 14.5, fontWeight: 500 }}>{form.ncm || "—"}</span></div>
              {margem && (
                <>
                  <div style={{ height: 1, background: C.border, margin: "2px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: C.textMuted, fontSize: 14 }}>Margem Bruta</span>
                    <span style={{ color: +margem >= 40 ? C.green : +margem >= 25 ? C.amber : C.red, fontSize: 14.5, fontWeight: 700 }}>{margem}%</span>
                  </div>
                </>
              )}
            </div>
          </Card>
          <Card style={{ background: C.cardInner }}>
            <p style={{ color: C.cyanText, fontSize: 11.5, fontWeight: 600, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}><Info size={14} /> Dica desta etapa</p>
            <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{STEP_DICAS[step - 1]}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
