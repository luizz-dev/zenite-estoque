import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params { params: Promise<{ id: string }> }

// PUT /api/produtos/:id — usado pelo modal "Editar Produto"
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const dados = await req.json();

  const produto = await prisma.produto.update({
    where: { id },
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

  return NextResponse.json(produto);
}

// DELETE /api/produtos/:id — usado pelo modal "Excluir Produto"
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.produto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
