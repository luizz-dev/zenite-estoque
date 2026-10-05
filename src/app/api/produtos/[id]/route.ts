// Destino: src/app/api/produtos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const dados = await req.json();

  // updateMany com usuarioId no where garante que só dá certo se o
  // produto for do usuário logado — não existe mais "editar pelo ID de
  // qualquer um".
  const resultado = await prisma.produto.updateMany({
    where: { id, usuarioId },
    data: {
      nome: dados.nome,
      sku: dados.sku,
      categoria: dados.categoria,
      quantidade: Number(dados.quantidade),
      precoCusto: Number(dados.precoCusto),
      precoVenda: Number(dados.precoVenda),
      ncm: dados.ncm,
    },
  });
  if (resultado.count === 0) {
    return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  }

  const produto = await prisma.produto.findUnique({ where: { id } });
  return NextResponse.json(produto);
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