// Destino: src/app/api/produtos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { gerarSkuVariacao, validarVariacoes } from "@/lib/variacoes";
import { comVariacoesOrdenadas, garantirVariacoes } from "@/lib/estoque-server";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  // Produtos antigos (de antes das variações) ganham uma variação "Único / Única".
  await prisma.$transaction((tx) => garantirVariacoes(tx, usuarioId));

  const produtos = await prisma.produto.findMany({
    where: { usuarioId },
    include: { variacoes: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(produtos.map(comVariacoesOrdenadas));
}

export async function POST(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const dados = await req.json();
  if (!dados.nome?.trim() || !dados.sku?.trim() || !dados.ncm?.trim()) {
    return NextResponse.json({ erro: "Nome, SKU e NCM são obrigatórios." }, { status: 400 });
  }

  // Variações são obrigatórias: o estoque de cada tamanho/cor é controlado separadamente.
  const validacao = validarVariacoes(dados.variacoes);
  if ("erro" in validacao) return NextResponse.json({ erro: validacao.erro }, { status: 400 });
  const { variacoes } = validacao;
  const total = variacoes.reduce((a, v) => a + v.quantidade, 0);

  // SKU único POR USUÁRIO (ver @@unique([usuarioId, sku]) no schema)
  const existente = await prisma.produto.findUnique({ where: { usuarioId_sku: { usuarioId, sku: dados.sku } } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe um produto com esse SKU." }, { status: 409 });
  }

  try {
    const produto = await prisma.produto.create({
      data: {
        usuarioId,
        nome: dados.nome,
        sku: dados.sku,
        categoria: dados.categoria || "Outros",
        unidade: dados.unidade || "UN",
        quantidade: total,
        quantidadeMinima: Number(dados.quantidadeMinima) || 8,
        precoCusto: Number(dados.precoCusto) || 0,
        precoVenda: Number(dados.precoVenda) || 0,
        fornecedor: dados.fornecedor || null,
        ncm: dados.ncm,
        descricao: dados.descricao || null,
        variacoes: {
          create: variacoes.map((v) => ({
            usuarioId,
            tamanho: v.tamanho,
            cor: v.cor,
            quantidade: v.quantidade,
            sku: gerarSkuVariacao(dados.sku, v),
          })),
        },
      },
      include: { variacoes: true },
    });
    return NextResponse.json(comVariacoesOrdenadas(produto), { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Não foi possível cadastrar: já existe um produto ou variação com esse SKU." }, { status: 409 });
  }
}