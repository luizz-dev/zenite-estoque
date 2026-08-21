import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params { params: Promise<{ id: string }> }

// PATCH /api/notificacoes/:id — marca uma notificação como lida
export async function PATCH(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const notificacao = await prisma.notificacao.update({ where: { id }, data: { lida: true } });
  return NextResponse.json(notificacao);
}
