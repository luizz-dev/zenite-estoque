import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/produtos — lista todos os produtos (usado no Estoque e no Dashboard)
export async function GET() {
  const produtos = await prisma.produto.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(produtos);
}

// POST /api/produtos — cria um novo produto (tela Estoque > Cadastrar Itens)
// É AQUI que o NCM entra: no cadastro do produto, não na hora de emitir a nota.
export async function POST(req: NextRequest) {
  const dados = await req.json();

  if (!dados.nome?.trim() || !dados.sku?.trim() || !dados.ncm?.trim()) {
    return NextResponse.json({ erro: "Nome, SKU e NCM são obrigatórios." }, { status: 400 });
  }

  const existente = await prisma.produto.findUnique({ where: { sku: dados.sku } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe um produto com esse SKU." }, { status: 409 });
  }

  const produto = await prisma.produto.create({
    data: {
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
