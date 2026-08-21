import { Plus, FileText, ArrowUpDown, Bell, Wallet } from "lucide-react";
import { C } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/layout/Topbar";

const GUIAS = [
  {
    icon: <Plus size={22} />, titulo: "Como cadastrar produtos corretamente",
    passos: ["Acesse Estoque → Cadastrar Itens no menu lateral.", "Preencha nome, SKU e categoria com termos padronizados.", "Informe o NCM correto — obrigatório para NF-e sem erros.", "Defina preço de custo e venda, depois confirme o cadastro."],
  },
  {
    icon: <FileText size={22} />, titulo: "Como emitir uma nota com vários produtos",
    passos: ["Na Visualização do Estoque, marque o checkbox de cada peça (podem ser tipos diferentes).", "Clique em \"Emitir NF-e\" — o modal já vem com os itens selecionados.", "Preencha destinatário, endereço de entrega (se houver) e forma de pagamento.", "Revise o total e confirme — o estoque de cada item é atualizado automaticamente."],
  },
  {
    icon: <ArrowUpDown size={22} />, titulo: "Como dar baixa ou repor estoque sem nota fiscal",
    passos: ["Clique em \"Movimentar Estoque\" (ou no ícone de setas na linha do produto).", "Escolha \"Dar Baixa\" para perdas/uso interno, ou \"Registrar Entrada\" para reposições.", "Selecione o produto, a quantidade e o motivo.", "Confirme — o estoque é ajustado na hora, sem gerar NF-e."],
  },
  {
    icon: <Bell size={22} />, titulo: "Como usar a Central de Alertas",
    passos: ["Acesse Alertas no menu lateral para ver todas as notificações.", "Filtre por Estoque, Fiscal, MEI ou Sistema conforme a prioridade.", "Clique em uma notificação não lida para marcá-la como lida.", "Fique de olho nos alertas de MEI e DAS para não perder prazos."],
  },
  {
    icon: <Wallet size={22} />, titulo: "Como cadastrar contas/despesas fixas",
    passos: ["Acesse Contas Fixas no menu lateral.", "Clique em \"Nova Conta\" e preencha nome, valor e dia de vencimento.", "Marque como \"Fixa\" se ela se repete todo mês (aluguel, internet...) ou \"Eventual\" se é pontual.", "Contas \"Fixas\" entram automaticamente no cálculo do Lucro do Mês, no Dashboard."],
  },
];

export default function AjudaPage() {
  return (
    <div>
      <Topbar titulo="Como Utilizar o Site" sub="Central de ajuda" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {GUIAS.map((g, i) => (
          <Card key={i}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,rgba(87,57,196,0.3),rgba(72,55,232,0.1))", display: "flex", alignItems: "center", justifyContent: "center", color: C.purpleText }}>{g.icon}</div>
            <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: "14px 0 15px", lineHeight: 1.35 }}>{g.titulo}</h3>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {g.passos.map((p, j) => (
                <li key={j} style={{ display: "flex", gap: 10, fontSize: 15.5, color: "#A8B5D1", lineHeight: 1.5 }}>
                  <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: C.purpleText, marginTop: 1 }}>{j + 1}</span>
                  {p}
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
