import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/notificacoes — usado na página Alertas e no badge do sininho
export async function GET() {
  const notificacoes = await prisma.notificacao.findMany({ orderBy: { criadoEm: "desc" } });
  return NextResponse.json(notificacoes);
}

// PATCH /api/notificacoes — marca TODAS as notificações como lidas
// (botão "Marcar todas como lidas" na página Alertas)
export async function PATCH() {
  await prisma.notificacao.updateMany({ data: { lida: true } });
  return NextResponse.json({ ok: true });
}
