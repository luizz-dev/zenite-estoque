import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/empresa
// Retorna a linha única de configuração fiscal (cria uma vazia se não existir).
export async function GET() {
  let empresa = await prisma.empresa.findFirst();
  if (!empresa) empresa = await prisma.empresa.create({ data: {} });
  return NextResponse.json(empresa);
}

// PATCH /api/empresa
// Body: { razaoSocial, cnpj, ie, uf, regime, cep, rua, numero, bairro, cidade, certificadoNome }
// Chamado pela página Perfil > Dados Fiscais (ou quando o usuário tenta
// emitir a primeira NF-e sem ter configurado a empresa ainda).
export async function PATCH(req: NextRequest) {
  const dados = await req.json();

  if (!dados.razaoSocial?.trim() || !dados.ie?.trim()) {
    return NextResponse.json({ erro: "Preencha Razão Social e Inscrição Estadual." }, { status: 400 });
  }

  let empresa = await prisma.empresa.findFirst();
  if (!empresa) empresa = await prisma.empresa.create({ data: {} });

  const atualizada = await prisma.empresa.update({
    where: { id: empresa.id },
    data: { ...dados, configurada: true },
  });

  return NextResponse.json(atualizada);
}
