import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

// PATCH /api/auth/cadastro
// Body: { cpfCnpj, cep, endereco, formaPagamento }
// Atualiza os dados de cobrança do usuário logado (Etapa 2 — Checkout).
// Aqui é só onde o Asaas (ou outro gateway) entraria: depois de confirmar
// o pagamento/assinatura, você chama esse PATCH para salvar os dados.
export async function PATCH(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { cpfCnpj, cep, endereco, formaPagamento } = await req.json();
  if (!cpfCnpj?.trim() || !cep?.trim() || !endereco?.trim()) {
    return NextResponse.json({ erro: "Preencha CPF/CNPJ, CEP e endereço." }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { cpfCnpj, cep, endereco, formaPagamento },
  });

  return NextResponse.json({ id: usuario.id });
}
