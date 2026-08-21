import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

// GET /api/auth/me
// Usado pelo AppProvider (client) para checar, ao carregar a página, se já
// existe uma sessão válida — e então decidir se mostra o app ou o login.
export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ usuario: null }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, email: true, celular: true, cpfCnpj: true, cep: true, endereco: true, formaPagamento: true },
  });
  if (!usuario) return NextResponse.json({ usuario: null }, { status: 401 });

  return NextResponse.json({ usuario });
}
