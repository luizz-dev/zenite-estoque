// Destino: src/app/api/assinatura/route.ts
//
// OBS: a tabela Assinatura ainda não tem a coluna usuarioId no seu banco
// atual, então por enquanto esta rota volta a funcionar com uma única
// linha "global" (igual era antes). Deixei pronta e comentada a versão
// com usuarioId — quando você rodar a migration que adiciona essa coluna
// (schema remodelado que te passei), é só descomentar as linhas marcadas
// com "usuarioId" e apagar a linha equivalente sem ela.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
// import { obterUsuarioIdDaSessao } from "@/lib/auth"; // TODO: descomentar quando Assinatura tiver usuarioId
import { PLANOS_ASSINATURA } from "@/lib/constants";

function calcularProximaCobranca(plano: string): Date {
  const d = new Date();
  if (plano === "anual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

async function obterOuCriarAssinatura(/* usuarioId: string */) {
  // TODO: quando a coluna existir, troque a linha abaixo por:
  // let assinatura = await prisma.assinatura.findUnique({ where: { usuarioId } });
  let assinatura = await prisma.assinatura.findFirst();

  if (!assinatura) {
    assinatura = await prisma.assinatura.create({
      data: {
        // usuarioId, // TODO: descomentar junto com a linha do findUnique acima
        proximaCobranca: calcularProximaCobranca("mensal"),
      },
    });
  }
  return assinatura;
}

// GET /api/assinatura — retorna a assinatura (cria uma se não existir)
export async function GET() {
  // TODO: descomentar quando Assinatura tiver usuarioId
  // const usuarioId = await obterUsuarioIdDaSessao();
  // if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const assinatura = await obterOuCriarAssinatura(/* usuarioId */);
  return NextResponse.json(assinatura);
}

// PATCH /api/assinatura
// Body: { acao: "trocar-plano", plano: "mensal" | "anual" } ou { acao: "cancelar" } ou { acao: "reativar" }
export async function PATCH(req: NextRequest) {
  // TODO: descomentar quando Assinatura tiver usuarioId
  // const usuarioId = await obterUsuarioIdDaSessao();
  // if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { acao, plano } = await req.json();
  const assinatura = await obterOuCriarAssinatura(/* usuarioId */);

  if (acao === "cancelar") {
    const atualizada = await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: "cancelada" } });
    return NextResponse.json(atualizada);
  }

  if (acao === "reativar") {
    const atualizada = await prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: "ativa", proximaCobranca: calcularProximaCobranca(assinatura.plano) },
    });
    return NextResponse.json(atualizada);
  }

  if (acao === "trocar-plano") {
    const infoPlano = PLANOS_ASSINATURA.find((p) => p.v === plano);
    if (!infoPlano) return NextResponse.json({ erro: "Plano inválido." }, { status: 400 });

    // PRÓXIMOS PASSOS — integração com gateway de pagamento (ex: Asaas):
    // antes de confirmar a troca abaixo, criar/atualizar a cobrança
    // recorrente no gateway e só seguir se ele aprovar.
    //
    // const cobranca = await fetch("https://api.asaas.com/v3/subscriptions", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", access_token: process.env.ASAAS_API_KEY! },
    //   body: JSON.stringify({ plano, valor: infoPlano.valor /*, usuarioId */ }),
    // });
    // if (!cobranca.ok) return NextResponse.json({ erro: "Falha ao processar pagamento." }, { status: 402 });

    const atualizada = await prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { plano, valor: infoPlano.valor, status: "ativa", proximaCobranca: calcularProximaCobranca(plano) },
    });
    return NextResponse.json(atualizada);
  }

  return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
}