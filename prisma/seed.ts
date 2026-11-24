// Destino: prisma/seed.ts
// Script destrutivo: limpa os dados e recria o usuário administrativo de desenvolvimento.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLANOS_ASSINATURA } from "../src/lib/constants";
import { gerarSkuVariacao } from "../src/lib/variacoes";

const prisma = new PrismaClient();

async function main() {
  await prisma.avisoFiscal.deleteMany();
  await prisma.itemNotaFiscal.deleteMany();
  await prisma.notaFiscal.deleteMany();
  await prisma.movimentacao.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.variacaoProduto.deleteMany();
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

  // Cada produto tem variações (tamanho + cor) com estoque próprio.
  // Produto.quantidade = soma das variações.
  const catalogo: {
    nome: string; sku: string; categoria: string; precoVenda: number; precoCusto: number; fornecedor: string; ncm: string;
    variacoes: [string, string, number][];
  }[] = [
    { nome: "Vestido Midi Estampado", sku: "VST-0021", categoria: "Vestidos", precoVenda: 129.9, precoCusto: 70.0, fornecedor: "Textil Bom Tecido", ncm: "6104.4200",
      variacoes: [["P", "Floral", 10], ["M", "Floral", 14], ["G", "Floral", 12], ["M", "Azul", 6]] },
    { nome: "Calça Wide Leg Jeans", sku: "CLW-0114", categoria: "Calças", precoVenda: 159.0, precoCusto: 85.0, fornecedor: "Jeans Brasil", ncm: "6103.4100",
      variacoes: [["38", "Azul", 3], ["40", "Azul", 3], ["42", "Preto", 2]] },
    { nome: "Blusa Tricot Gola Alta", sku: "BLT-0309", categoria: "Blusas", precoVenda: 89.9, precoCusto: 42.0, fornecedor: "Malhas SP", ncm: "6110.2000",
      variacoes: [["P", "Off white", 20], ["M", "Off white", 25], ["G", "Off white", 20]] },
    { nome: "Jaqueta Jeans Oversized", sku: "JJO-0042", categoria: "Jaquetas", precoVenda: 219.9, precoCusto: 120.0, fornecedor: "Jeans Brasil", ncm: "6201.9300",
      variacoes: [["Único", "Azul", 3]] },
  ];

  const produtos = [];
  for (const c of catalogo) {
    const total = c.variacoes.reduce((a, v) => a + v[2], 0);
    produtos.push(
      await prisma.produto.create({
        data: {
          usuarioId: admin.id, nome: c.nome, sku: c.sku, categoria: c.categoria, quantidade: total,
          precoVenda: c.precoVenda, precoCusto: c.precoCusto, fornecedor: c.fornecedor, ncm: c.ncm,
          variacoes: {
            create: c.variacoes.map(([tamanho, cor, quantidade]) => ({
              usuarioId: admin.id, tamanho, cor, quantidade,
              sku: gerarSkuVariacao(c.sku, { tamanho, cor }),
            })),
          },
        },
      })
    );
  }

  await prisma.notificacao.createMany({
    data: [
      { usuarioId: admin.id, tipo: "estoque", titulo: `Estoque baixo: ${produtos[3].nome}`, descricao: "Restam apenas 3 unidades em estoque (Azul, tamanho único).", prioridade: "alta", lida: false },
      { usuarioId: admin.id, tipo: "sistema", titulo: "Bem-vindo ao Zênite", descricao: "Sua conta de administrador foi criada com dados de exemplo.", prioridade: "baixa", lida: false },
    ],
  });

  console.log("Seed concluído. Login: admin@gmail.com / admin");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });