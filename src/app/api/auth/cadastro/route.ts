import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashSenha, criarSessao } from "@/lib/auth";

// POST /api/auth/cadastro
// Body: { nome, email, senha, celular }
// Cria o usuário (Etapa 1 do cadastro) e já autentica a sessão.
export async function POST(req: NextRequest) {
  const { nome, email, senha, celular } = await req.json();

  if (!nome?.trim() || !email?.trim() || !senha?.trim() || !celular?.trim()) {
    return NextResponse.json({ erro: "Preencha todos os campos." }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe uma conta com esse e-mail." }, { status: 409 });
  }

  const usuario = await prisma.usuario.create({
    data: { nome, email, celular, senhaHash: await hashSenha(senha) },
  });

  await criarSessao(usuario.id);

  return NextResponse.json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
}
