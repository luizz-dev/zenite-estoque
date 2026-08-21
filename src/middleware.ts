import { NextRequest, NextResponse } from "next/server";

const ROTAS_PUBLICAS = ["/login", "/cadastro", "/cadastro/checkout"];

// Roda antes de qualquer página. Não usa Prisma aqui (middleware roda no
// Edge Runtime) — só olha se o cookie de sessão existe ou não.
// A validação "de verdade" do usuário continua acontecendo no
// src/app/(app)/layout.tsx (que aí sim consulta o banco).
export function middleware(req: NextRequest) {
  const temSessao = req.cookies.has("zenite_session");
  const { pathname } = req.nextUrl;
  const isRotaPublica = ROTAS_PUBLICAS.includes(pathname);

  if (!temSessao && !isRotaPublica && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (temSessao && isRotaPublica) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
