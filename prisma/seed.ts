// Destino: prisma/seed.ts
// Script destrutivo: limpa os dados e recria o usuário administrativo de desenvolvimento.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLANOS_ASSINATURA } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  await prisma.itemNotaFiscal.deleteMany();
  await prisma.notaFiscal.deleteMany();
  await prisma.movimentacao.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.contaFixa.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.assinatura.deleteMany();
  await prisma.usuario.deleteMany();

  const seedEmail = process.env.SEED_ADMIN_EMAIL;
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedEmail || !seedPassword || seedPassword.length < 12) {
    throw new Error("Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (mínimo 12 caracteres) antes do seed.");
  }

  const admin = await prisma.usuario.create({
    data: {
      nome: process.env.SEED_ADMIN_NAME || "Administrador",
      email: seedEmail,
      senhaHash: await bcrypt.hash(seedPassword, 12),
    },
  });

  // Plano vindo de src/lib/constants.ts (PLANOS_ASSINATURA — "mensal")
  const planoMensal = PLANOS_ASSINATURA.find((p) => p.v === "mensal")!;
  const proximaCobranca = new Date();
  proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);
  await prisma.assinatura.create({
    data: { usuarioId: admin.id, plano: planoMensal.v, status: "ativa", valor: planoMensal.valor, proximaCobranca },
  });

  await prisma.contaFixa.createMany({
    data: [
      { usuarioId: admin.id, nome: "Aluguel do ponto", valor: 900, categoria: "Estrutura", diaVencimento: 5, tipo: "fixa" },
      { usuarioId: admin.id, nome: "Internet + telefone", valor: 120, categoria: "Estrutura", diaVencimento: 10, tipo: "fixa" },
      { usuarioId: admin.id, nome: "Contador (MEI)", valor: 150, categoria: "Serviços", diaVencimento: 15, tipo: "fixa" },
    ],
  });

  const produtos = await Promise.all([
    prisma.produto.create({ data: { usuarioId: admin.id, nome: "Vestido Midi Estampado", sku: "VST-0021", categoria: "Vestidos", quantidade: 42, precoVenda: 129.9, precoCusto: 70.0, fornecedor: "Textil Bom Tecido", ncm: "6104.4200" } }),
    prisma.produto.create({ data: { usuarioId: admin.id, nome: "Calça Wide Leg Jeans", sku: "CLW-0114", categoria: "Calças", quantidade: 8, precoVenda: 159.0, precoCusto: 85.0, fornecedor: "Jeans Brasil", ncm: "6103.4100" } }),
    prisma.produto.create({ data: { usuarioId: admin.id, nome: "Blusa Tricot Gola Alta", sku: "BLT-0309", categoria: "Blusas", quantidade: 65, precoVenda: 89.9, precoCusto: 42.0, fornecedor: "Malhas SP", ncm: "6110.2000" } }),
    prisma.produto.create({ data: { usuarioId: admin.id, nome: "Jaqueta Jeans Oversized", sku: "JJO-0042", categoria: "Jaquetas", quantidade: 3, precoVenda: 219.9, precoCusto: 120.0, fornecedor: "Jeans Brasil", ncm: "6201.9300" } }),
  ]);

  await prisma.notificacao.createMany({
    data: [
      { usuarioId: admin.id, tipo: "estoque", titulo: `Estoque baixo: ${produtos[3].nome}`, descricao: "Restam apenas 3 unidades em estoque.", prioridade: "alta", lida: false },
      { usuarioId: admin.id, tipo: "sistema", titulo: "Bem-vindo ao Zênite", descricao: "Sua conta de administrador foi criada com dados de exemplo.", prioridade: "baixa", lida: false },
    ],
  });

  console.log("Seed concluído. Login: admin@gmail.com / admin");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });