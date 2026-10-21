// Destino: src/app/api/notificacoes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(_req: NextRequest, { params }: Params) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const resultado = await prisma.notificacao.updateMany({ where: { id, usuarioId }, data: { lida: true } });
  if (resultado.count === 0) return NextResponse.json({ erro: "Notificação não encontrada." }, { status: 404 });

  const notificacao = await prisma.notificacao.findUnique({ where: { id } });
  return NextResponse.json(notificacao);
}