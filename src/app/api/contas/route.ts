// Destino: src/app/api/contas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const contas = await prisma.contaFixa.findMany({ where: { usuarioId }, orderBy: { diaVencimento: "asc" } });
  return NextResponse.json(contas);
}

export async function POST(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const dados = await req.json();
  if (!dados.nome?.trim() || !dados.valor) {
    return NextResponse.json({ erro: "Nome e valor são obrigatórios." }, { status: 400 });
  }

  const conta = await prisma.contaFixa.create({
    data: {
      usuarioId,
      nome: dados.nome,
      valor: Number(dados.valor) || 0,
      categoria: dados.categoria || "Outros",
      diaVencimento: Number(dados.diaVencimento) || 10,
      tipo: dados.tipo === "eventual" ? "eventual" : "fixa",
      avisoAntecedenciaDias: [1, 7, 14].includes(Number(dados.avisoAntecedenciaDias)) ? Number(dados.avisoAntecedenciaDias) : 7,
    },
  });

  return NextResponse.json(conta, { status: 201 });
}