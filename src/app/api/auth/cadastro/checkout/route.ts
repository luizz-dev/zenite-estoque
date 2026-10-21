// Destino: src/app/api/assinatura/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { PLANOS_ASSINATURA } from "@/lib/constants";

function calcularProximaCobranca(plano: string): Date {
  const d = new Date();
  if (plano === "anual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const assinatura = await prisma.assinatura.findUnique({ where: { usuarioId } });
  if (!assinatura) return NextResponse.json({ erro: "Assinatura não encontrada." }, { status: 404 });
  return NextResponse.json(assinatura);
}

export async function PATCH(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { acao, plano } = await req.json();
  const assinatura = await prisma.assinatura.findUnique({ where: { usuarioId } });
  if (!assinatura) return NextResponse.json({ erro: "Assinatura não encontrada." }, { status: 404 });

  if (acao === "cancelar") {
    const atualizada = await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: "cancelada" } });
    return NextResponse.json(atualizada);
  }

  if (acao === "reativar") {
    const atualizada = await prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: "ativa", proximaCobranca: calcularProximaCobranca(assinatura.plano) },
    });
    return NextResponse.json(atualizada);
  }

  if (acao === "trocar-plano") {
    const infoPlano = PLANOS_ASSINATURA.find((p) => p.v === plano);
    if (!infoPlano) return NextResponse.json({ erro: "Plano inválido." }, { status: 400 });
    const atualizada = await prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { plano, valor: infoPlano.valor, status: "ativa", proximaCobranca: calcularProximaCobranca(plano) },
    });
    return NextResponse.json(atualizada);
  }

  return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
}