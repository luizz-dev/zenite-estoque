import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/movimentacoes — histórico de ajustes manuais de estoque (sem nota)
export async function GET() {
  const movs = await prisma.movimentacao.findMany({ orderBy: { data: "desc" } });
  return NextResponse.json(movs);
}

// POST /api/movimentacoes
// Body: { produtoId, nome, tipo: "entrada"|"saida", quantidade, motivo, observacao? }
// Usado pelo botão "Movimentar Estoque" — dar baixa (perda, uso interno,
// doação...) ou repor estoque (fornecedor, devolução...) SEM gerar NF-e.
export async function POST(req: NextRequest) {
  const { produtoId, tipo, quantidade, motivo, observacao } = await req.json();

  if (!produtoId || !tipo || !quantidade || quantidade <= 0) {
    return NextResponse.json({ erro: "Dados da movimentação incompletos." }, { status: 400 });
  }
  if (!motivo) {
    return NextResponse.json({ erro: "Selecione o motivo da movimentação." }, { status: 400 });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({ where: { id: produtoId } });
      if (!produto) throw new Error("Produto não encontrado.");
      if (tipo === "saida" && produto.quantidade < quantidade) {
        throw new Error(`Estoque insuficiente. Disponível: ${produto.quantidade} un.`);
      }

      await tx.produto.update({
        where: { id: produtoId },
        data: { quantidade: tipo === "entrada" ? { increment: quantidade } : { decrement: quantidade } },
      });

      return tx.movimentacao.create({
        data: { tipo, item: produto.nome, quantidade, motivo, observacao, data: new Date() },
      });
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro ao registrar a movimentação.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
