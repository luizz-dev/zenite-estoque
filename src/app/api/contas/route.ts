import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/contas — lista as contas/despesas fixas cadastradas
export async function GET() {
  const contas = await prisma.contaFixa.findMany({ orderBy: { diaVencimento: "asc" } });
  return NextResponse.json(contas);
}

// POST /api/contas — cadastra uma nova conta/despesa
// Body: { nome, valor, categoria, diaVencimento, tipo: "fixa" | "eventual", avisoAntecedenciaDias }
export async function POST(req: NextRequest) {
  const dados = await req.json();

  if (!dados.nome?.trim() || !dados.valor) {
    return NextResponse.json({ erro: "Nome e valor são obrigatórios." }, { status: 400 });
  }

  const conta = await prisma.contaFixa.create({
    data: {
      nome: dados.nome,
      valor: Number(dados.valor) || 0,
      categoria: dados.categoria || "Outros",
      diaVencimento: Number(dados.diaVencimento) || 10,
      tipo: dados.tipo === "eventual" ? "eventual" : "fixa",
      avisoAntecedenciaDias: [1, 7, 14].includes(Number(dados.avisoAntecedenciaDias)) ? Number(dados.avisoAntecedenciaDias) : 7,
    },
  });

  return NextResponse.json(conta, { status: 201 });
}