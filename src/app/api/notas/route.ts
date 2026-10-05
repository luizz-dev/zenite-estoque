// Destino: src/app/api/notas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { proximoNumeroNota, simularStatusFiscal } from "@/lib/utils";
import { brl } from "@/lib/utils";
import type { NovaNotaPayload } from "@/lib/types";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const notas = await prisma.notaFiscal.findMany({
    where: { usuarioId },
    include: { itens: true },
    orderBy: { emitidaEm: "desc" },
  });
  return NextResponse.json(notas);
}

export async function POST(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

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
      // valida estoque — e, principalmente, que o produto é do usuário logado
      // (sem isso, dava pra emitir nota debitando estoque de outra empresa).
      let total = 0;
      for (const item of payload.itens) {
        const produto = await tx.produto.findFirst({ where: { id: item.produtoId, usuarioId } });
        if (!produto) throw new Error(`Produto ${item.nome} não encontrado.`);
        if (produto.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${item.nome} (disponível: ${produto.quantidade}).`);
        }
        total += item.quantidade * item.valorUnitario;
      }

      // numeração de NF-e é por usuário agora (@@unique([usuarioId, numero]))
      const ultimasNotas = await tx.notaFiscal.findMany({ where: { usuarioId }, select: { numero: true } });
      const numero = proximoNumeroNota(ultimasNotas.map((n) => n.numero));

      const simulacao = simularStatusFiscal();

      const nota = await tx.notaFiscal.create({
        data: {
          usuarioId,
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

      if (simulacao.statusFiscal === "autorizada") {
        for (const item of payload.itens) {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { quantidade: { decrement: item.quantidade } },
          });
        }
      }

      if (simulacao.statusFiscal === "autorizada") {
        await tx.notificacao.create({
          data: {
            usuarioId,
            tipo: "fiscal",
            titulo: `NF-e #${String(numero).padStart(5, "0")} emitida com sucesso`,
            descricao: `Nota fiscal com ${payload.itens.length} item(ns) e total de ${brl(total)} autorizada pela SEFAZ.`,
            prioridade: "baixa",
          },
        });
      } else {
        await tx.notificacao.create({
          data: {
            usuarioId,
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