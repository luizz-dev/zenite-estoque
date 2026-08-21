import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANOS_ASSINATURA } from "@/lib/constants";

function calcularProximaCobranca(plano: string): Date {
  const d = new Date();
  if (plano === "anual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

// GET /api/assinatura — retorna a assinatura (linha única, cria uma se não existir)
export async function GET() {
  let assinatura = await prisma.assinatura.findFirst();
  if (!assinatura) assinatura = await prisma.assinatura.create({ data: { proximaCobranca: calcularProximaCobranca("mensal") } });
  return NextResponse.json(assinatura);
}

// PATCH /api/assinatura
// Body: { acao: "trocar-plano", plano: "mensal" | "anual" } ou { acao: "cancelar" } ou { acao: "reativar" }
export async function PATCH(req: NextRequest) {
  const { acao, plano } = await req.json();

  let assinatura = await prisma.assinatura.findFirst();
  if (!assinatura) assinatura = await prisma.assinatura.create({ data: { proximaCobranca: calcularProximaCobranca("mensal") } });

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