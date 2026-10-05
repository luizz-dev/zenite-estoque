// Destino: src/app/api/notificacoes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const notificacoes = await prisma.notificacao.findMany({ where: { usuarioId }, orderBy: { criadoEm: "desc" } });
  return NextResponse.json(notificacoes);
}

// PATCH /api/notificacoes — marca as notificações DO USUÁRIO LOGADO como lidas
// (antes marcava TODAS as notificações do banco, de todo mundo — corrigido).
export async function PATCH() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  await prisma.notificacao.updateMany({ where: { usuarioId }, data: { lida: true } });
  return NextResponse.json({ ok: true });
}