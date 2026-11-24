"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { brl } from "@/lib/utils";
import { FORMAS_PAGAMENTO, STATUS_FISCAL_INFO } from "@/lib/constants";

export default function ImprimirNotaPage() {
  const { id } = useParams<{ id: string }>();
  const { notas, empresa, carregando } = useApp();
  const nota = notas.find((n) => n.id === id);

  // abre a janela de impressão sozinha quando a nota carrega
  useEffect(() => {
    if (!nota) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [nota]);

  if (carregando) return <p style={{ padding: 32 }}>Carregando...</p>;
  if (!nota) return <p style={{ padding: 32 }}>Nota não encontrada.</p>;

  const itens = nota.itens ?? [];
  const status = (STATUS_FISCAL_INFO[nota.statusFiscal] ?? STATUS_FISCAL_INFO.autorizada).label;
  const pagamento = FORMAS_PAGAMENTO.find((f) => f.v === nota.formaPagamento)?.l ?? "—";
  const celula = { border: "1px solid #000", padding: 6 } as const;

  return (
    <div style={{ background: "#fff", color: "#000", minHeight: "100vh", padding: 32, fontFamily: "Arial, sans-serif", fontSize: 13 }}>
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: 20 }}>
        <button onClick={() => window.print()} style={{ padding: "8px 16px", cursor: "pointer" }}>Imprimir</button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Nota Fiscal nº {String(nota.numero).padStart(5, "0")}</h1>
        <p style={{ margin: "0 0 16px", color: "#555" }}>
          Emitida em {new Date(nota.emitidaEm).toLocaleString("pt-BR")} · Status: {status}
        </p>

        <section style={{ border: "1px solid #000", padding: 12, marginBottom: 12 }}>
          <strong>Emitente</strong>
          <div>{empresa?.razaoSocial}</div>
          <div>CNPJ: {empresa?.cnpj} · IE: {empresa?.ie}</div>
          <div>{empresa?.rua}, {empresa?.numero} - {empresa?.bairro} - {empresa?.cidade}/{empresa?.uf} - CEP {empresa?.cep}</div>
        </section>

        <section style={{ border: "1px solid #000", padding: 12, marginBottom: 12 }}>
          <strong>Destinatário</strong>
          <div>{nota.destinatarioNome}</div>
          <div>
            {nota.destinatarioTipo === "PJ" ? "CNPJ" : "CPF"}: {nota.destinatarioDoc}
            {nota.destinatarioIe ? ` · IE: ${nota.destinatarioIe}` : ""}
          </div>
          <div>UF: {nota.destinatarioUf} · Pagamento: {pagamento}</div>
        </section>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
          <thead>
            <tr>
              {["Produto", "SKU", "NCM", "CFOP", "Qtd", "Unitário", "Total"].map((h) => (
                <th key={h} style={{ ...celula, textAlign: "left", background: "#eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((i, idx) => (
              <tr key={idx}>
                <td style={celula}>{i.nome}</td>
                <td style={celula}>{i.sku}</td>
                <td style={celula}>{i.ncm}</td>
                <td style={celula}>{i.cfop}</td>
                <td style={celula}>{i.quantidade}</td>
                <td style={celula}>{brl(i.valorUnitario)}</td>
                <td style={celula}>{brl(i.quantidade * i.valorUnitario)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ textAlign: "right", fontSize: 16 }}>
          <strong>Valor total: {brl(nota.valorTotal)}</strong>
        </p>

        <p style={{ marginTop: 24, fontSize: 11, color: "#555" }}>
          Documento auxiliar para conferência, sem valor fiscal.
        </p>
      </div>
    </div>
  );
}