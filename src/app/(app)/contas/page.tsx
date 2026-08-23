"use client";

import { useState } from "react";
import { Plus, Wallet, Pencil, Trash2, Calendar, X, Check, AlertTriangle } from "lucide-react";
import { C, CATEGORIAS_CONTA } from "@/lib/constants";
import { brl, somaContasFixas } from "@/lib/utils";
import { OPCOES_ANTECEDENCIA } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost, BtnIcon } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";
import { PageLoading } from "@/components/ui/Loading";
import type { ContaFixa, TipoConta } from "@/lib/types";

const FORM_VAZIO = { nome: "", valor: "", categoria: CATEGORIAS_CONTA[0], diaVencimento: "10", tipo: "fixa" as TipoConta, avisoAntecedenciaDias: "7" };

function ModalConta({ contaEditando, onClose }: { contaEditando: ContaFixa | null; onClose: () => void }) {
  const { criarConta, editarConta } = useApp();
  const [form, setForm] = useState(contaEditando ? {
    nome: contaEditando.nome, valor: String(contaEditando.valor), categoria: contaEditando.categoria,
    diaVencimento: String(contaEditando.diaVencimento), tipo: contaEditando.tipo,
    avisoAntecedenciaDias: String(contaEditando.avisoAntecedenciaDias ?? 7),
  } : FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.nome.trim() || !form.valor) return setErro("Nome e valor são obrigatórios.");
    setErro(""); setSalvando(true);
    try {
      const dados = { nome: form.nome, valor: Number(form.valor), categoria: form.categoria, diaVencimento: Number(form.diaVencimento) || 10, tipo: form.tipo, avisoAntecedenciaDias: Number(form.avisoAntecedenciaDias) || 7 };
      if (contaEditando) await editarConta(contaEditando.id, dados);
      else await criarConta(dados);
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar a conta.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="zn-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(5,10,20,0.65)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={onClose}>
      <div className="zn-modal-enter" style={{ width: "100%", maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0 }}>{contaEditando ? "Editar Conta" : "Nova Conta / Despesa"}</h3>
            <BtnIcon onClick={onClose}><X size={16} /></BtnIcon>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><FieldLabel>Nome da Conta *</FieldLabel><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Aluguel do ponto" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><FieldLabel>Valor (R$) *</FieldLabel><Input type="number" value={form.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0,00" /></div>
              <div><FieldLabel>Dia do Vencimento</FieldLabel><Input type="number" min={1} max={31} value={form.diaVencimento} onChange={(e) => set("diaVencimento", e.target.value)} placeholder="10" /></div>
            </div>
            <div>
              <FieldLabel>Categoria</FieldLabel>
              <Select value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                {CATEGORIAS_CONTA.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Tipo</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {([["fixa", "Fixa (todo mês)"], ["eventual", "Eventual"]] as const).map(([v, l]) => {
                  const active = form.tipo === v;
                  return (
                    <button key={v} onClick={() => set("tipo", v)} style={{
                      flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${active ? C.purple1 : C.border}`, cursor: "pointer",
                      fontSize: 14.5, fontWeight: 500, background: active ? "rgba(72,55,232,0.2)" : "rgba(255,255,255,0.02)", color: active ? C.purpleText : C.textSec,
                    }}>{l}</button>
                  );
                })}
              </div>
              <p style={{ color: C.textMuted, fontSize: 14, margin: "6px 0 0" }}>Contas &quot;Fixas&quot; entram automaticamente no cálculo do Lucro do Mês no Dashboard. Contas &quot;Eventuais&quot; ficam registradas, mas não entram sozinhas nesse cálculo.</p>
            </div>

            <div>
              <FieldLabel>Avisar do vencimento com quanto tempo de antecedência?</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {OPCOES_ANTECEDENCIA.map((op) => {
                  const active = Number(form.avisoAntecedenciaDias) === op.v;
                  return (
                    <button key={op.v} onClick={() => set("avisoAntecedenciaDias", String(op.v))} style={{
                      flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${active ? C.purple1 : C.border}`, cursor: "pointer",
                      fontSize: 14.5, fontWeight: 500, background: active ? "rgba(72,55,232,0.2)" : "rgba(255,255,255,0.02)", color: active ? C.purpleText : C.textSec,
                    }}>{op.l}</button>
                  );
                })}
              </div>
              <p style={{ color: C.textMuted, fontSize: 14, margin: "6px 0 0" }}>Só vale para contas &quot;Fixas&quot; — é quando o alerta de vencimento vai aparecer na Central de Alertas.</p>
            </div>

            {erro && (
              <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "10px 12px", color: C.red, fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} /> {erro}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
              <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
              <BtnPrimary icon={<Check size={17} />} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar Conta"}</BtnPrimary>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ModalExcluirConta({ conta, onClose }: { conta: ContaFixa; onClose: () => void }) {
  const { excluirConta } = useApp();
  const [excluindo, setExcluindo] = useState(false);
  const confirmar = async () => { setExcluindo(true); await excluirConta(conta.id); onClose(); };
  return (
    <div className="zn-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(5,10,20,0.65)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={onClose}>
      <div className="zn-modal-enter" style={{ width: "100%", maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <Card>
          <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Excluir conta?</h3>
          <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
            Tem certeza que deseja excluir <strong style={{ color: C.white }}>{conta.nome}</strong>? Essa ação não pode ser desfeita.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
            <BtnPrimary style={{ background: C.red }} onClick={confirmar} disabled={excluindo}>{excluindo ? "Excluindo..." : "Excluir"}</BtnPrimary>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function ContasFixasPage() {
  const { contasFixas, carregando } = useApp();
  const [modal, setModal] = useState<"nova" | "editar" | "excluir" | null>(null);
  const [contaAtiva, setContaAtiva] = useState<ContaFixa | null>(null);

  if (carregando) return <PageLoading titulo="Contas Fixas" sub="Despesas mensais do negócio" />;

  const totalFixas = somaContasFixas(contasFixas);
  const totalEventuais = contasFixas.filter((c) => c.tipo === "eventual").reduce((a, c) => a + c.valor, 0);

  return (
    <div className="zn-page-enter">
      <Topbar titulo="Contas Fixas" sub="Despesas mensais do negócio" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        <Card>
          <p style={{ color: C.textSec, fontSize: 14, margin: 0 }}>Total em Contas Fixas</p>
          <p style={{ color: C.white, fontSize: 26, fontWeight: 700, margin: "8px 0 0" }}>{brl(totalFixas)}</p>
          <p style={{ color: C.textMuted, fontSize: 14, margin: "6px 0 0" }}>Usado no cálculo do Lucro do Mês</p>
        </Card>
        <Card>
          <p style={{ color: C.textSec, fontSize: 14, margin: 0 }}>Total em Contas Eventuais</p>
          <p style={{ color: C.white, fontSize: 26, fontWeight: 700, margin: "8px 0 0" }}>{brl(totalEventuais)}</p>
          <p style={{ color: C.textMuted, fontSize: 14 , margin: "6px 0 0" }}>Não entram sozinhas no cálculo</p>
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
          <BtnPrimary icon={<Plus size={16} />} style={{ width: "100%" }} onClick={() => { setContaAtiva(null); setModal("nova"); }}>Nova Conta</BtnPrimary>
        </Card>
      </div>

      <Card>
        <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Contas Cadastradas</h3>
        {contasFixas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.textMuted, fontSize: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Wallet size={32} style={{ opacity: 0.4 }} />
            Nenhuma conta cadastrada ainda.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contasFixas.map((c, i) => (
              <div key={c.id} className="zn-list-item-enter" style={{ animationDelay: `${i * 0.03}s`, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.015)", borderRadius: 12, padding: "12px 16px", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(72,55,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.purpleText, flexShrink: 0 }}><Wallet size={18} /></div>
                  <div>
                    <p style={{ color: C.white, fontSize: 16.5, fontWeight: 500, margin: 0 }}>{c.nome}</p>
                    <p style={{ color: C.textMuted, fontSize: 15 , margin: "2px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                      {c.categoria} <Calendar size={14} /> Vence dia {c.diaVencimento}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Badge tone={c.tipo === "fixa" ? "purple" : "cyan"}>{c.tipo === "fixa" ? "Fixa" : "Eventual"}</Badge>
                  <span style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>{brl(c.valor)}</span>
                  <div style={{ display: "flex" }}>
                    <BtnIcon onClick={() => { setContaAtiva(c); setModal("editar"); }}><Pencil size={18} /></BtnIcon>
                    <BtnIcon tone="danger" onClick={() => { setContaAtiva(c); setModal("excluir"); }}><Trash2 size={18} /></BtnIcon>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {(modal === "nova" || modal === "editar") && <ModalConta contaEditando={modal === "editar" ? contaAtiva : null} onClose={() => setModal(null)} />}
      {modal === "excluir" && contaAtiva && <ModalExcluirConta conta={contaAtiva} onClose={() => setModal(null)} />}
    </div>
  );
}