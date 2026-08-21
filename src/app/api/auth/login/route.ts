import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verificarSenha, criarSessao } from "@/lib/auth";

// POST /api/auth/login
// Body: { email, senha }
export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();
  if (!email?.trim() || !senha?.trim()) {
    return NextResponse.json({ erro: "Informe e-mail e senha." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !(await verificarSenha(senha, usuario.senhaHash))) {
    return NextResponse.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await criarSessao(usuario.id);
  return NextResponse.json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
}
