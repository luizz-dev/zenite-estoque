import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { criarSessao } from "@/lib/auth";

const APP_URL = process.env.APP_URL!;

export async function GET(req: NextRequest) {
  const erro = NextResponse.redirect(new URL("/login?erro=google", APP_URL));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const store = await cookies();
  const stateSalvo = store.get("google_oauth_state")?.value;
  store.delete("google_oauth_state");

  if (!code || !state || state !== stateSalvo) return erro;

  // 1. troca o code por um access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return erro;
  const { access_token } = await tokenRes.json();

  // 2. busca o perfil
  const perfilRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!perfilRes.ok) return erro;
  const perfil = await perfilRes.json(); // { sub, email, email_verified, name, picture }
  if (!perfil.email || !perfil.email_verified) return erro;

  // 3. acha ou cria o usuário
  let usuario = await prisma.usuario.findUnique({ where: { email: perfil.email } });

  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: { nome: perfil.name ?? perfil.email, email: perfil.email, googleId: perfil.sub },
    });
  } else if (!usuario.googleId) {
    // já tinha conta por senha: vincula ao Google
    usuario = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { googleId: perfil.sub },
    });
  }

  await criarSessao(usuario.id);

  // quem ainda não completou a Etapa 2 (CPF/CNPJ, endereço) vai pro checkout
  const destino = usuario.cpfCnpj ? "/dashboard" : "/cadastro/checkout";
  return NextResponse.redirect(new URL(destino, APP_URL));
}