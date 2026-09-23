// Destino: src/app/api/auth/cadastro/route.ts
// SUBSTITUI o arquivo inteiro — agora só existe POST (sem PATCH).
//
// POST /api/auth/cadastro
// Body: { nome, email, senha, celular, cpfCnpj, cep, endereco, formaPagamento, plano }
// Cria o usuário JÁ com os dados de cobrança e a assinatura escolhida,
// tudo numa única transação. A sessão só é criada depois de tudo dar
// certo — assim nunca existe usuário sem assinatura no banco.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashSenha, criarSessao } from "@/lib/auth";
import { PLANOS_ASSINATURA } from "@/lib/constants";

function calcularProximaCobranca(plano: string): Date {
  const d = new Date();
  if (plano === "anual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(req: NextRequest) {
  const { nome, email, senha, celular, cpfCnpj, cep, endereco, formaPagamento, plano } = await req.json();

  if (!nome?.trim() || !email?.trim() || !senha?.trim() || !celular?.trim()) {
    return NextResponse.json({ erro: "Preencha todos os campos da Etapa 1." }, { status: 400 });
  }
  if (!cpfCnpj?.trim() || !cep?.trim() || !endereco?.trim()) {
    return NextResponse.json({ erro: "Preencha CPF/CNPJ, CEP e endereço." }, { status: 400 });
  }
  const infoPlano = PLANOS_ASSINATURA.find((p) => p.v === plano);
  if (!infoPlano) {
    return NextResponse.json({ erro: "Plano inválido." }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe uma conta com esse e-mail." }, { status: 409 });
  }

  const senhaHash = await hashSenha(senha);

  const usuario = await prisma.$transaction(async (tx) => {
    const novoUsuario = await tx.usuario.create({
      data: { nome, email, celular, senhaHash, cpfCnpj, cep, endereco, formaPagamento },
    });

    // OBS: Assinatura ainda não tem usuarioId no banco (ver comentários em
    // /api/assinatura/route.ts) — por enquanto é uma linha única global.
    // Quando a coluna existir, troque o create abaixo por
    // tx.assinatura.create({ data: { usuarioId: novoUsuario.id, ... } })
    // e remova o findFirst/update (não precisa mais, cada usuário terá a sua).
    const assinaturaExistente = await tx.assinatura.findFirst();
    if (assinaturaExistente) {
      await tx.assinatura.update({
        where: { id: assinaturaExistente.id },
        data: { plano, valor: infoPlano.valor, status: "ativa", proximaCobranca: calcularProximaCobranca(plano) },
      });
    } else {
      await tx.assinatura.create({
        data: { plano, valor: infoPlano.valor, proximaCobranca: calcularProximaCobranca(plano) },
      });
    }

    return novoUsuario;
  });

  await criarSessao(usuario.id);

  return NextResponse.json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
}