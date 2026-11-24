// Destino: src/app/api/produtos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { gerarSkuVariacao, validarVariacoes } from "@/lib/variacoes";
import { comVariacoesOrdenadas, garantirVariacoes, sincronizarQuantidadeProduto } from "@/lib/estoque-server";

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const dados = await req.json();

  // Se o formulário mandou as variações, elas são validadas antes de tocar no banco.
  let variacoesEntrada: ReturnType<typeof validarVariacoes> | null = null;
  if (dados.variacoes !== undefined) {
    variacoesEntrada = validarVariacoes(dados.variacoes);
    if ("erro" in variacoesEntrada) return NextResponse.json({ erro: variacoesEntrada.erro }, { status: 400 });
  }

  try {
    const produto = await prisma.$transaction(async (tx) => {
      // findFirst com usuarioId: só edita produto do usuário logado.
      const atual = await tx.produto.findFirst({ where: { id, usuarioId } });
      if (!atual) throw new Error("NAO_ENCONTRADO");

      const sku: string = dados.sku ?? atual.sku;

      await tx.produto.update({
        where: { id },
        data: {
          nome: dados.nome,
          sku: dados.sku,
          categoria: dados.categoria,
          precoCusto: dados.precoCusto !== undefined ? Number(dados.precoCusto) : undefined,
          precoVenda: dados.precoVenda !== undefined ? Number(dados.precoVenda) : undefined,
          quantidadeMinima: dados.quantidadeMinima !== undefined ? Number(dados.quantidadeMinima) : undefined,
          ncm: dados.ncm,
        },
      });

      await garantirVariacoes(tx, usuarioId, [id]);

      if (variacoesEntrada && "variacoes" in variacoesEntrada) {
        const existentes = await tx.variacaoProduto.findMany({ where: { produtoId: id, usuarioId } });
        const idsMantidos = new Set(variacoesEntrada.variacoes.map((v) => v.id).filter(Boolean));

        // remove as variações que o usuário tirou da lista
        const remover = existentes.filter((e) => !idsMantidos.has(e.id)).map((e) => e.id);
        if (remover.length) await tx.variacaoProduto.deleteMany({ where: { id: { in: remover }, usuarioId } });

        for (const v of variacoesEntrada.variacoes) {
          const skuVar = gerarSkuVariacao(sku, v);
          const dono = v.id ? existentes.find((e) => e.id === v.id) : undefined;
          if (dono) {
            await tx.variacaoProduto.update({ where: { id: dono.id }, data: { tamanho: v.tamanho, cor: v.cor, quantidade: v.quantidade, sku: skuVar } });
          } else {
            await tx.variacaoProduto.create({ data: { produtoId: id, usuarioId, tamanho: v.tamanho, cor: v.cor, quantidade: v.quantidade, sku: skuVar } });
          }
        }
      } else if (dados.sku && dados.sku !== atual.sku) {
        // SKU do produto mudou: regera o SKU de cada variação
        const existentes = await tx.variacaoProduto.findMany({ where: { produtoId: id, usuarioId } });
        for (const e of existentes) {
          await tx.variacaoProduto.update({ where: { id: e.id }, data: { sku: gerarSkuVariacao(sku, e) } });
        }
      }

      await sincronizarQuantidadeProduto(tx, id);
      return tx.produto.findUniqueOrThrow({ where: { id }, include: { variacoes: true } });
    });

    return NextResponse.json(comVariacoesOrdenadas(produto));
  } catch (e) {
    if (e instanceof Error && e.message === "NAO_ENCONTRADO") {
      return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ erro: "Não foi possível salvar: SKU ou variação duplicada." }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const resultado = await prisma.produto.deleteMany({ where: { id, usuarioId } });
  if (resultado.count === 0) {
    return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}