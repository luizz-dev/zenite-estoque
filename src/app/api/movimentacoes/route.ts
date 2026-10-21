// Destino: src/app/api/movimentacoes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const movs = await prisma.movimentacao.findMany({ where: { usuarioId }, orderBy: { data: "desc" } });
  return NextResponse.json(movs);
}

export async function POST(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { produtoId, tipo, quantidade, motivo, observacao } = await req.json();

  if (!produtoId || !tipo || !quantidade || quantidade <= 0) {
    return NextResponse.json({ erro: "Dados da movimentação incompletos." }, { status: 400 });
  }
  if (!motivo) {
    return NextResponse.json({ erro: "Selecione o motivo da movimentação." }, { status: 400 });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // findFirst com usuarioId — não dá mais pra mexer no produto de outro usuário.
      const produto = await tx.produto.findFirst({ where: { id: produtoId, usuarioId } });
      if (!produto) throw new Error("Produto não encontrado.");
      if (tipo === "saida" && produto.quantidade < quantidade) {
        throw new Error(`Estoque insuficiente. Disponível: ${produto.quantidade} un.`);
      }

      await tx.produto.update({
        where: { id: produtoId },
        data: { quantidade: tipo === "entrada" ? { increment: quantidade } : { decrement: quantidade } },
      });

      return tx.movimentacao.create({
        data: { usuarioId, tipo, item: produto.nome, quantidade, motivo, observacao, data: new Date() },
      });
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro ao registrar a movimentação.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}