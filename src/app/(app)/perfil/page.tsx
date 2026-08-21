"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, ShieldCheck, AlertTriangle, CreditCard, Pencil, LogOut } from "lucide-react";
import { C } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BtnGhost } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";
import { ModalAssinatura } from "@/components/perfil/ModalAssinatura";

function LinhaAssinatura({ label, valor, corValor }: { label: string; valor: string; corValor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: C.cyanText, fontSize: 14.5, fontWeight: 500 }}>{label}</span>
      <span style={{ color: corValor || C.white, fontSize: 15.5, fontWeight: 700 }}>{valor}</span>
    </div>
  );
}

export default function PerfilPage() {
  const { usuario, empresa, assinatura } = useApp();
  const router = useRouter();
  const [modalAssinatura, setModalAssinatura] = useState<false | "plano" | "cancelar">(false);
  const [saindo, setSaindo] = useState(false);

  const sair = async () => {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const iniciais = (usuario?.nome || "U").slice(0, 2).toUpperCase();
  const proximaCobranca = assinatura?.proximaCobranca
    ? new Date(assinatura.proximaCobranca).toLocaleDateString("pt-BR")
    : "—";

  return (
    <div className="zn-page-enter">
      <Topbar titulo="Perfil & Configurações" />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14, alignItems: "start" }}>
        {/* Coluna esquerda — perfil do usuário e dados fiscais resumidos */}
        <Card style={{
          textAlign: "center",
          background: `radial-gradient(circle at 50% 0%, rgba(72,55,232,0.16), transparent 60%), ${C.card}`,
        }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
              width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg,${C.purple2},${C.purple1})`,
              display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 26, fontWeight: 700,
              boxShadow: "0 0 28px rgba(72,55,232,0.4)", margin: "6px auto 0",
            }}>
              {iniciais}
            </div>
            <button style={{
              position: "absolute", bottom: 2, right: -2, width: 26, height: 26, borderRadius: "50%",
              background: C.orange, border: `2px solid ${C.card}`, color: C.white, display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
            }} title="Alterar foto">
              <Pencil size={16} />
            </button>
          </div>

          <p style={{ color: C.white, fontSize: 20, fontWeight: 700, margin: "14px 0 0" }}>{usuario?.nome || "Usuário"}</p>

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 18, paddingTop: 18, display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: C.textMuted, display: "flex" }}><Building2 size={22} /></span>
              <div>
                <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>Razão Social</p>
                <p style={{ color: C.white, fontSize: 15, margin: "2px 0 0" }}>{empresa?.razaoSocial || "—"}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: C.textMuted, display: "flex" }}><FileText size={22} /></span>
              <div>
                <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>CNPJ</p>
                <p style={{ color: C.white, fontSize: 15, margin: "2px 0 0" }}>{empresa?.cnpj || "—"}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: C.textMuted, display: "flex" }}><ShieldCheck size={22} /></span>
              <div>
                <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>Inscrição Estadual</p>
                <p style={{ color: C.white, fontSize: 15, margin: "2px 0 0" }}>{empresa?.ie || "—"}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Coluna direita — configurações fiscais + assinatura */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
              <h3 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: 0 }}>Configurações Fiscais</h3>
              {empresa?.configurada ? <Badge tone="green">Configurado</Badge> : <Badge tone="amber">Pendente</Badge>}
            </div>

            <p style={{ color: C.textMuted, fontSize: 15.5, lineHeight: 1.6, margin: "0 0 16px" }}>
              Certificado A1, regime tributário e endereço fiscal — necessários para emitir NF-e.
              Você ainda pode navegar e cadastrar produtos normalmente; esses dados só são pedidos quando for emitir a primeira nota fiscal.
            </p>

            {!empresa?.configurada && (
              <div style={{ borderRadius: 10, border: "1px solid rgba(255,169,77,0.3)", background: "rgba(255,169,77,0.06)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} style={{ color: C.amber, flexShrink: 0 }} />
                <p style={{ color: C.amber, fontSize: 13.5, margin: 0 }}>Nenhum dado fiscal cadastrado ainda.</p>
              </div>
            )}

            <BtnGhost icon={<FileText size={18} />} onClick={() => router.push("/perfil/dados-fiscais")}>
              {empresa?.configurada ? "Editar Dados Fiscais" : "Configurar Agora"}
            </BtnGhost>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(72,55,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.purpleText }}>
                  <CreditCard size={22} />
                </div>
                <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: "0.04em" }}>ASSINATURA</h3>
              </div>
              {assinatura?.status === "cancelada" ? <Badge tone="red">Cancelada</Badge> : <Badge tone="green">Ativo</Badge>}
            </div>

            <div style={{ marginTop: 10 }}>
              <LinhaAssinatura label="Plano" valor={assinatura?.plano === "anual" ? "Anual" : "Mensal"} corValor={C.orange} />
              <LinhaAssinatura label="Próxima Cobrança" valor={proximaCobranca} />
              <LinhaAssinatura label="Forma de pagamento" valor={assinatura?.formaPagamento || "—"} />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setModalAssinatura("plano")} style={{
                flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.orange}`, background: "rgba(245,124,0,0.08)",
                color: C.orange, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer", textTransform: "uppercase",
              }}>Mudar de Assinatura</button>
              <button onClick={() => setModalAssinatura("cancelar")} disabled={assinatura?.status === "cancelada"} style={{
                flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.red}`, background: "rgba(248,113,113,0.08)",
                color: C.red, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.03em", cursor: assinatura?.status === "cancelada" ? "not-allowed" : "pointer",
                textTransform: "uppercase", opacity: assinatura?.status === "cancelada" ? 0.45 : 1,
              }}>Cancelar Assinatura</button>
            </div>
          </Card>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
        <button onClick={sair} disabled={saindo} style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12,
          border: `1px solid ${C.red}`, background: "rgba(248,113,113,0.06)", color: C.red, fontSize: 15,
          fontWeight: 700, letterSpacing: "0.03em", cursor: saindo ? "not-allowed" : "pointer", opacity: saindo ? 0.6 : 1,
          textTransform: "uppercase",
        }}>
          <LogOut size={18} /> {saindo ? "Saindo..." : "Sair da Conta"}
        </button>
      </div>

      {modalAssinatura && <ModalAssinatura modoInicial={modalAssinatura} onClose={() => setModalAssinatura(false)} />}
    </div>
  );
}