// Destino: src/app/api/contas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const dados = await req.json();

  const resultado = await prisma.contaFixa.updateMany({
    where: { id, usuarioId },
    data: {
      nome: dados.nome,
      valor: Number(dados.valor),
      categoria: dados.categoria,
      diaVencimento: Number(dados.diaVencimento),
      tipo: dados.tipo === "eventual" ? "eventual" : "fixa",
      avisoAntecedenciaDias: [1, 7, 14].includes(Number(dados.avisoAntecedenciaDias)) ? Number(dados.avisoAntecedenciaDias) : 7,
    },
  });
  if (resultado.count === 0) return NextResponse.json({ erro: "Conta não encontrada." }, { status: 404 });

  const conta = await prisma.contaFixa.findUnique({ where: { id } });
  return NextResponse.json(conta);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const resultado = await prisma.contaFixa.deleteMany({ where: { id, usuarioId } });
  if (resultado.count === 0) return NextResponse.json({ erro: "Conta não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}