// Destino: src/app/api/empresa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  // findUnique por usuarioId — antes era findFirst() global (todo mundo via
  // os dados fiscais da mesma empresa). @@unique(usuarioId) no schema.
  let empresa = await prisma.empresa.findUnique({ where: { usuarioId } });
  if (!empresa) empresa = await prisma.empresa.create({ data: { usuarioId } });
  return NextResponse.json(empresa);
}

export async function PATCH(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const dados = await req.json();
  if (!dados.razaoSocial?.trim() || !dados.ie?.trim()) {
    return NextResponse.json({ erro: "Preencha Razão Social e Inscrição Estadual." }, { status: 400 });
  }

  let empresa = await prisma.empresa.findUnique({ where: { usuarioId } });
  if (!empresa) empresa = await prisma.empresa.create({ data: { usuarioId } });

  const atualizada = await prisma.empresa.update({
    where: { id: empresa.id },
    data: { ...dados, configurada: true },
  });

  return NextResponse.json(atualizada);
}