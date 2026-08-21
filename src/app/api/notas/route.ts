import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proximoNumeroNota, simularStatusFiscal } from "@/lib/utils";
import { brl } from "@/lib/utils";
import type { NovaNotaPayload } from "@/lib/types";

// GET /api/notas — lista as notas fiscais já emitidas, com os itens de cada uma
// (é o que alimenta o Histórico — cada nota vira 1 card expansível).
export async function GET() {
  const notas = await prisma.notaFiscal.findMany({
    include: { itens: true },
    orderBy: { emitidaEm: "desc" },
  });
  return NextResponse.json(notas);
}

// POST /api/notas — emite uma NF-e com 1 ou vários produtos (de categorias
// diferentes, sem problema). Tudo roda em uma transação: se alguma etapa
// falhar (ex.: estoque insuficiente), nada é salvo.
//
// Body esperado (NovaNotaPayload, ver src/lib/types.ts):
//   { destinatario, endereco, csosn, formaPagamento, itens: [...] }
export async function POST(req: NextRequest) {
  const payload: NovaNotaPayload = await req.json();

  if (!payload.itens?.length) {
    return NextResponse.json({ erro: "A nota precisa de ao menos um produto." }, { status: 400 });
  }
  if (!payload.destinatario?.doc?.trim() || !payload.destinatario?.nome?.trim()) {
    return NextResponse.json({ erro: "Informe os dados do destinatário." }, { status: 400 });
  }
  if (!payload.formaPagamento) {
    return NextResponse.json({ erro: "Selecione a forma de pagamento." }, { status: 400 });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1) valida estoque de cada item e calcula o total
      let total = 0;
      for (const item of payload.itens) {
        const produto = await tx.produto.findUnique({ where: { id: item.produtoId } });
        if (!produto) throw new Error(`Produto ${item.nome} não encontrado.`);
        if (produto.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${item.nome} (disponível: ${produto.quantidade}).`);
        }
        total += item.quantidade * item.valorUnitario;
      }

      // 2) gera o próximo número de nota
      const ultimasNotas = await tx.notaFiscal.findMany({ select: { numero: true } });
      const numero = proximoNumeroNota(ultimasNotas.map((n) => n.numero));

      // 2.1) simula o retorno da SEFAZ (protótipo — não é integração real)
      const simulacao = simularStatusFiscal();

      // 3) cria a nota + os itens (1 para N)
      const nota = await tx.notaFiscal.create({
        data: {
          numero,
          destinatarioTipo: payload.destinatario.tipo,
          destinatarioDoc: payload.destinatario.doc,
          destinatarioNome: payload.destinatario.nome,
          destinatarioIe: payload.destinatario.ie || null,
          destinatarioUf: payload.destinatario.uf,
          enderecoEntrega: payload.endereco ?? undefined,
          csosn: payload.csosn,
          formaPagamento: payload.formaPagamento,
          valorTotal: total,
          statusFiscal: simulacao.statusFiscal,
          motivoRejeicao: simulacao.motivoRejeicao ?? null,
          itens: {
            create: payload.itens.map((item) => ({
              produtoId: item.produtoId,
              nome: item.nome,
              sku: item.sku,
              ncm: item.ncm,
              cfop: item.cfop,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
            })),
          },
        },
        include: { itens: true },
      });

      // 4) baixa o estoque de cada produto envolvido — só quando a nota foi
      // autorizada (se a SEFAZ rejeitou, a venda não se concretizou).
      if (simulacao.statusFiscal === "autorizada") {
        for (const item of payload.itens) {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { quantidade: { decrement: item.quantidade } },
          });
        }
      }

      // 5) cria a notificação — de sucesso ou de rejeição
      if (simulacao.statusFiscal === "autorizada") {
        await tx.notificacao.create({
          data: {
            tipo: "fiscal",
            titulo: `NF-e #${String(numero).padStart(5, "0")} emitida com sucesso`,
            descricao: `Nota fiscal com ${payload.itens.length} item(ns) e total de ${brl(total)} autorizada pela SEFAZ.`,
            prioridade: "baixa",
          },
        });
      } else {
        await tx.notificacao.create({
          data: {
            tipo: "fiscal",
            titulo: `NF-e #${String(numero).padStart(5, "0")} rejeitada pela SEFAZ`,
            descricao: simulacao.motivoRejeicao || "A nota foi rejeitada. Corrija os dados e emita novamente.",
            prioridade: "alta",
          },
        });
      }

      return nota;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro ao emitir a nota fiscal.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
