// Destino: src/app/api/produtos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const produtos = await prisma.produto.findMany({ where: { usuarioId }, orderBy: { nome: "asc" } });
  return NextResponse.json(produtos);
}

export async function POST(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const dados = await req.json();
  if (!dados.nome?.trim() || !dados.sku?.trim() || !dados.ncm?.trim()) {
    return NextResponse.json({ erro: "Nome, SKU e NCM são obrigatórios." }, { status: 400 });
  }

  // SKU único POR USUÁRIO (ver @@unique([usuarioId, sku]) no schema)
  const existente = await prisma.produto.findUnique({ where: { usuarioId_sku: { usuarioId, sku: dados.sku } } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe um produto com esse SKU." }, { status: 409 });
  }

  const produto = await prisma.produto.create({
    data: {
      usuarioId,
      nome: dados.nome,
      sku: dados.sku,
      categoria: dados.categoria || "Outros",
      unidade: dados.unidade || "UN",
      quantidade: Number(dados.quantidade) || 0,
      quantidadeMinima: Number(dados.quantidadeMinima) || 8,
      precoCusto: Number(dados.precoCusto) || 0,
      precoVenda: Number(dados.precoVenda) || 0,
      fornecedor: dados.fornecedor || null,
      ncm: dados.ncm,
      descricao: dados.descricao || null,
    },
  });

  return NextResponse.json(produto, { status: 201 });
}