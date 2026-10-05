import { NextRequest, NextResponse } from "next/server";

function isRotaPublica(pathname: string) {
  return pathname === "/login" || pathname === "/cadastro" || pathname.startsWith("/cadastro/");
}

export function middleware(req: NextRequest) {
  const temSessao = req.cookies.has("zenite_session");
  const { pathname } = req.nextUrl;
  const publica = isRotaPublica(pathname);

  if (!temSessao && !publica && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (temSessao && publica) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Repassa o caminho atual via header — usado pelo (app)/layout.tsx pra
  // saber, no servidor, se a rota é a própria "/assinatura" (que precisa
  // ficar acessível mesmo sem assinatura ativa, pra dar pra reativar).
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};