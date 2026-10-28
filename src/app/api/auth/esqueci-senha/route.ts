import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { enviarEmailRedefinicao } from "@/lib/email";

const MENSAGEM = "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ erro: "Informe o e-mail." }, { status: 400 });

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (usuario) {
    // limite simples: no máximo 1 pedido por minuto por usuário
    const recente = await prisma.tokenRedefinicao.findFirst({
      where: { usuarioId: usuario.id, criadoEm: { gt: new Date(Date.now() - 60_000) } },
    });

    if (!recente) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");

      await prisma.tokenRedefinicao.deleteMany({ where: { usuarioId: usuario.id } });
      await prisma.tokenRedefinicao.create({
        data: { usuarioId: usuario.id, tokenHash, expiraEm: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const link = `${process.env.APP_URL}/redefinir-senha?token=${token}`;
      const contaGoogle = !!usuario.googleId && !usuario.senhaHash;
      await enviarEmailRedefinicao(usuario.email, link, contaGoogle);
    }
  }

  // resposta igual exista ou não a conta
  return NextResponse.json({ mensagem: MENSAGEM });
}