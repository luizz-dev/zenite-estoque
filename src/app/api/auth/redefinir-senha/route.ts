import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { hashSenha } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  const senha = body?.senha;

  if (typeof token !== "string" || typeof senha !== "string" || !token || !senha) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ erro: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const registro = await prisma.tokenRedefinicao.findUnique({ where: { tokenHash } });

  if (!registro || registro.expiraEm < new Date()) {
    return NextResponse.json({ erro: "Link inválido ou expirado. Solicite um novo." }, { status: 400 });
  }

  const senhaHash = await hashSenha(senha);

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: registro.usuarioId }, data: { senhaHash } }),
    // apaga todos os tokens do usuário: o link vale uma vez só
    prisma.tokenRedefinicao.deleteMany({ where: { usuarioId: registro.usuarioId } }),
  ]);

  return NextResponse.json({ ok: true });
}