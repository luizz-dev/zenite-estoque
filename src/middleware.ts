import { NextRequest, NextResponse } from "next/server";

// Rotas totalmente públicas: sem sessão, tudo bem; com sessão, redireciona
// pro dashboard (não faz sentido quem já está logado ver login/criar conta
// de novo).
const ROTAS_PUBLICAS = ["/login", "/cadastro"];

// Rota de onboarding: PRECISA de sessão pra funcionar (ela usa a sessão pra
// saber de quem são os dados que está salvando), mas — diferente das rotas
// públicas acima — NÃO deve redirecionar pro dashboard só por ter sessão.
// É justamente onde o usuário logado, mas ainda sem assinatura, precisa
// ficar até terminar o cadastro.
const ROTA_CHECKOUT = "/cadastro/checkout";

// Roda antes de qualquer página. Não usa Prisma aqui (middleware roda no
// Edge Runtime) — só olha se o cookie de sessão existe ou não.
// A validação "de verdade" (usuário existe? assinatura está ativa?)
// continua acontecendo no src/app/(app)/layout.tsx (que aí sim consulta
// o banco) — é lá que entra a regra de "sem assinatura ativa, não entra".
export function middleware(req: NextRequest) {
  const temSessao = req.cookies.has("zenite_session");
  const { pathname } = req.nextUrl;
  const isRotaPublica = ROTAS_PUBLICAS.includes(pathname);
  const isCheckout = pathname === ROTA_CHECKOUT;

  // Checkout exige sessão (foi criada na Etapa 1) — sem ela, manda pro login.
  if (isCheckout && !temSessao) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!temSessao && !isRotaPublica && !isCheckout && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Só redireciona pro dashboard nas rotas públicas "de fato" — checkout
  // fica de fora dessa regra de propósito (ver comentário acima).
  if (temSessao && isRotaPublica) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};