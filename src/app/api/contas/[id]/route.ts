import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params { params: Promise<{ id: string }> }

// PUT /api/contas/:id — edita uma conta/despesa existente
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const dados = await req.json();

  const conta = await prisma.contaFixa.update({
    where: { id },
    data: {
      nome: dados.nome,
      valor: Number(dados.valor),
      categoria: dados.categoria,
      diaVencimento: Number(dados.diaVencimento),
      tipo: dados.tipo === "eventual" ? "eventual" : "fixa",
    },
  });

  return NextResponse.json(conta);
}

// DELETE /api/contas/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.contaFixa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
