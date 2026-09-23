import { NextRequest, NextResponse } from "next/server";

// Login e todo o fluxo de /cadastro (etapa 1 e etapa 2/assinatura) são
// públicos: durante o cadastro não existe sessão ainda (ela só é criada
// no fim da Etapa 2, junto com o usuário e a assinatura).
function isRotaPublica(pathname: string) {
  return pathname === "/login" || pathname === "/cadastro" || pathname.startsWith("/cadastro/");
}

// Roda antes de qualquer página. Não usa Prisma aqui (middleware roda no
// Edge Runtime) — só olha se o cookie de sessão existe ou não.
// A validação "de verdade" (usuário existe? assinatura está ativa?)
// continua acontecendo no src/app/(app)/layout.tsx (que aí sim consulta
// o banco).
export function middleware(req: NextRequest) {
  const temSessao = req.cookies.has("zenite_session");
  const { pathname } = req.nextUrl;
  const publica = isRotaPublica(pathname);

  if (!temSessao && !publica && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // Quem já tem sessão (cadastro completo) não deveria ver login/cadastro de novo.
  if (temSessao && publica) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};