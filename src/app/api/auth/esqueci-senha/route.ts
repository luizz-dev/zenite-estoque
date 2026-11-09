import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto"; 
import { prisma } from "@/lib/db";
import { enviarEmailRedefinicao } from "@/lib/email";

//mensagem de sucesso
const MENSAGEM = "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ erro: "Informe o e-mail." }, { status: 400 });

  const usuario = await prisma.usuario.findUnique({ where: { email } }); //procurando o email

  if (usuario) {
    //no máximo 1 pedido por minuto por usuário
    const recente = await prisma.tokenRedefinicao.findFirst({
      where: { usuarioId: usuario.id, criadoEm: { gt: new Date(Date.now() - 60_000) } }, // procura um token desse usuário criado há menos de 60 segundos, se não existir, não manda nada
    });

    if (!recente) {
      const token = randomBytes(32).toString("base64url"); //tratamento do hash e senha. nunca manda o token original, só o hash
      const tokenHash = createHash("sha256").update(token).digest("hex");

      await prisma.tokenRedefinicao.deleteMany({ where: { usuarioId: usuario.id } }); //deleta os  tokens antigos, ficando só o mais recente
      await prisma.tokenRedefinicao.create({
        data: { usuarioId: usuario.id, tokenHash, expiraEm: new Date(Date.now() + 60 * 60 * 1000) }, //grava o novo no banco com validade de 1 hr
      });

      const link = `${process.env.APP_URL}/redefinir-senha?token=${token}`;
      const contaGoogle = !!usuario.googleId && !usuario.senhaHash;
      await enviarEmailRedefinicao(usuario.email, link, contaGoogle); //await pq a resposta do resend demora um pouco, então faz a rota esperar para seguir p próxima linha
    }
  }

  // resposta igual exista ou não a conta
  return NextResponse.json({ mensagem: MENSAGEM });
}