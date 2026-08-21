// ============================================================================
// AUTENTICAÇÃO — versão mínima para este protótipo.
// ----------------------------------------------------------------------------
// IMPORTANTE: isto é o suficiente para estudar/demonstrar o fluxo de
// cadastro e login, mas NÃO é uma solução de autenticação pronta para
// produção. O cookie de sessão aqui é apenas o id do usuário, sem
// assinatura/criptografia. Antes de colocar em produção, troque por uma
// biblioteca de autenticação de verdade, por exemplo:
//   - NextAuth.js / Auth.js (https://authjs.dev)
//   - Lucia Auth
//   - Clerk ou Supabase Auth (login gerenciado)
// ============================================================================
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "zenite_session";

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(usuarioId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, usuarioId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
}

export async function obterUsuarioIdDaSessao(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function destruirSessao() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
