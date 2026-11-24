// Destino: src/app/api/movimentacoes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { MOTIVO_VENDA } from "@/lib/utils";
import { nomeComVariacao } from "@/lib/variacoes";
import { descreverVariacao, obterVariacao, sincronizarQuantidadeProduto } from "@/lib/estoque-server";
import { avaliarInconsistenciaFiscal } from "@/lib/fiscal";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const movs = await prisma.movimentacao.findMany({ where: { usuarioId }, orderBy: { data: "desc" } });
  return NextResponse.json(movs);
}

export async function POST(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { produtoId, variacaoId, tipo, quantidade, motivo, observacao, valor } = await req.json();

  if (!produtoId || !tipo || !quantidade || quantidade <= 0) {
    return NextResponse.json({ erro: "Dados da movimentação incompletos." }, { status: 400 });
  }
  if (!motivo) {
    return NextResponse.json({ erro: "Selecione o motivo da movimentação." }, { status: 400 });
  }
  if (tipo !== "entrada" && tipo !== "saida") {
    return NextResponse.json({ erro: "Tipo de movimentação inválido." }, { status: 400 });
  }
  if (!Number.isInteger(quantidade)) {
    return NextResponse.json({ erro: "A quantidade deve ser um número inteiro." }, { status: 400 });
  }

  // "Venda" só existe como saída e exige um valor (o que entra no faturamento).
  const ehVenda = motivo === MOTIVO_VENDA;
  if (ehVenda && tipo !== "saida") {
    return NextResponse.json({ erro: "O motivo Venda só vale para saídas de estoque." }, { status: 400 });
  }
  if (ehVenda && valor !== undefined && valor !== null && (typeof valor !== "number" || !(valor > 0))) {
    return NextResponse.json({ erro: "Informe um valor de venda maior que zero." }, { status: 400 });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // findFirst com usuarioId — não dá mais pra mexer no produto de outro usuário.
      const produto = await tx.produto.findFirst({ where: { id: produtoId, usuarioId } });
      if (!produto) throw new Error("Produto não encontrado.");

      // O estoque é controlado por variação (tamanho/cor).
      const variacao = await obterVariacao(tx, usuarioId, produto.id, variacaoId);
      if (tipo === "saida" && variacao.quantidade < quantidade) {
        throw new Error(`Estoque insuficiente (${descreverVariacao(variacao)}). Disponível: ${variacao.quantidade} un.`);
      }

      await tx.variacaoProduto.update({
        where: { id: variacao.id },
        data: { quantidade: tipo === "entrada" ? { increment: quantidade } : { decrement: quantidade } },
      });
      await sincronizarQuantidadeProduto(tx, produto.id);

      // Venda sem valor informado → usa preço de venda × quantidade.
      const valorVenda = ehVenda ? Math.round((valor ?? produto.precoVenda * quantidade) * 100) / 100 : null;

      const mov = await tx.movimentacao.create({
        data: {
          usuarioId, tipo, item: nomeComVariacao(produto.nome, variacao), quantidade, motivo, observacao,
          produtoId: produto.id, variacaoId: variacao.id, valor: valorVenda, data: new Date(),
        },
      });

      // #20: venda pela baixa pode deixar as saídas do mês maiores que as NF-e.
      if (ehVenda) await avaliarInconsistenciaFiscal(tx, usuarioId);

      return mov;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro ao registrar a movimentação.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}