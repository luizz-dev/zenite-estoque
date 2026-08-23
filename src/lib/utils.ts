import { EMPRESA, FORMAS_PAGAMENTO } from "./constants";
import type { Produto, StatusEstoque, NotaFiscal, ContaFixa } from "./types";

/** Formata um número como moeda brasileira (R$). */
export const brl = (v: number): string =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Margem bruta percentual entre custo e preço de venda. */
export const pctMargem = (custo: number, preco: number): string =>
  custo > 0 && preco > 0 ? (((preco - custo) / custo) * 100).toFixed(1) : "0.0";

/** Variação percentual entre dois valores (ex.: faturamento mês vs. mês anterior). */
export const pctVariacao = (atual: number, anterior: number): string =>
  anterior > 0 ? (((atual - anterior) / anterior) * 100).toFixed(1).replace(".", ",") : "0,0";

/** Classifica o status do estoque de um produto a partir da quantidade. */
export const getStatusEstoque = (qtd: number): StatusEstoque =>
  qtd === 0 ? "esgotado" : qtd <= 3 ? "critico" : qtd <= 8 ? "alerta" : "ativo";

/**
 * Define o CFOP (5102 = venda interna / 6102 = venda interestadual) a partir
 * da UF do destinatário comparada à UF da empresa emitente.
 */
export const getCfop = (ufDestino: string, ufEmpresa: string = EMPRESA.uf): string =>
  ufDestino === ufEmpresa ? "5102" : "6102";

/** Próximo número de NF-e, a partir do maior número já emitido. */
export const proximoNumeroNota = (numerosExistentes: number[]): number =>
  (numerosExistentes.length ? Math.max(...numerosExistentes) : 229) + 1;

/** Produtos com estoque baixo (mas não esgotado) — usados nos alertas do Dashboard. */
export const produtosComEstoqueBaixo = (produtos: Produto[]): Produto[] =>
  produtos.filter((p) => p.quantidade > 0 && p.quantidade <= p.quantidadeMinima);

/** Notas emitidas no mês/ano atual (usadas no Lucro do Mês e no gráfico de Ticket Médio). */
export const notasDoMesAtual = (notas: NotaFiscal[]): NotaFiscal[] => {
  const agora = new Date();
  return notas.filter((n) => {
    const d = new Date(n.emitidaEm);
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear() && n.statusFiscal !== "cancelada" && n.statusFiscal !== "rejeitada";
  });
};

/** Soma das contas do tipo "fixa" (as "eventuais" só entram se o usuário pedir explicitamente). */
export const somaContasFixas = (contas: ContaFixa[]): number =>
  contas.filter((c) => c.tipo === "fixa").reduce((a, c) => a + c.valor, 0);

/**
 * Lucro do mês = (preço de venda − preço de custo) de cada item vendido nas
 * notas do mês. Se `considerarContas` for true, subtrai também a soma das
 * contas/despesas fixas cadastradas para o mês.
 */
export const calcularLucroMes = (
  notas: NotaFiscal[],
  produtos: Produto[],
  contas: ContaFixa[],
  considerarContas: boolean
): { lucroBruto: number; totalContas: number; lucroLiquido: number } => {
  const mapaCusto = new Map(produtos.map((p) => [p.id, p.precoCusto]));
  let lucroBruto = 0;
  for (const nota of notasDoMesAtual(notas)) {
    for (const item of nota.itens) {
      const custo = mapaCusto.get(item.produtoId) ?? 0;
      lucroBruto += (item.valorUnitario - custo) * item.quantidade;
    }
  }
  const totalContas = somaContasFixas(contas);
  return { lucroBruto, totalContas, lucroLiquido: lucroBruto - totalContas };
};

/** Ticket médio e total por forma de pagamento — alimenta o gráfico do Dashboard. */
export const ticketPorFormaPagamento = (notas: NotaFiscal[]) => {
  const doMes = notasDoMesAtual(notas);
  return FORMAS_PAGAMENTO.map((f) => {
    const nts = doMes.filter((n) => n.formaPagamento === f.v);
    const total = nts.reduce((a, n) => a + n.valorTotal, 0);
    const ticketMedio = nts.length ? total / nts.length : 0;
    return { forma: f.l, total, ticketMedio, qtd: nts.length };
  }).filter((r) => r.qtd > 0);
};

/** Simula a análise da SEFAZ ao emitir uma NF-e (protótipo — não é integração real). */
export const simularStatusFiscal = (): { statusFiscal: "autorizada" | "rejeitada"; motivoRejeicao?: string } => {
  const falhou = Math.random() < 0.2; // ~1 em cada 5, como combinado
  if (!falhou) return { statusFiscal: "autorizada" };
  const motivos = [
    "Rejeição 539: duplicidade de NF-e (mesma chave de acesso já autorizada).",
    "Rejeição 226: CFOP incompatível com a natureza da operação.",
    "Rejeição 215: falha no schema do XML (campo obrigatório ausente).",
    "Rejeição 999: SEFAZ indisponível no momento do envio — reenvie em instantes.",
  ];
  return { statusFiscal: "rejeitada", motivoRejeicao: motivos[Math.floor(Math.random() * motivos.length)] };
};

// Opções de antecedência que o usuário pode escolher, por conta, para
// ser avisado do vencimento (usadas no cadastro de Contas Fixas).
export const OPCOES_ANTECEDENCIA = [
  { v: 1, l: "1 dia antes" },
  { v: 7, l: "1 semana antes" },
  { v: 14, l: "2 semanas antes" },
] as const;

export interface AlertaVencimento {
  id: string;
  contaId: string;
  titulo: string;
  descricao: string;
  diasRestantes: number;
}

/**
 * Verifica, para cada conta fixa, se a data de vencimento deste mês (ou do
 * próximo, se a deste mês já passou) cai dentro da janela de antecedência
 * escolhida pelo usuário — e monta um alerta pronto para exibir.
 */
export const alertasVencimentoContas = (contas: ContaFixa[]): AlertaVencimento[] => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alertas: AlertaVencimento[] = [];

  for (const conta of contas) {
    if (conta.tipo !== "fixa") continue; // só avisa de despesas recorrentes
    const antecedencia = conta.avisoAntecedenciaDias ?? 7;

    let vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), conta.diaVencimento);
    if (vencimento < hoje) {
      vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, conta.diaVencimento);
    }

    const diasRestantes = Math.round((vencimento.getTime() - hoje.getTime()) / 86400000);
    if (diasRestantes >= 0 && diasRestantes <= antecedencia) {
      alertas.push({
        id: `vencimento-${conta.id}`,
        contaId: conta.id,
        titulo: `Conta próxima do vencimento: ${conta.nome}`,
        descricao: diasRestantes === 0
          ? `Vence hoje (dia ${conta.diaVencimento}) — ${brl(conta.valor)}.`
          : `Vence em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""} (dia ${conta.diaVencimento}) — ${brl(conta.valor)}.`,
        diasRestantes,
      });
    }
  }

  return alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
};