// ============================================================================
// SEED — popula o banco com dados de exemplo (equivalentes aos mocks do
// protótipo). Rode com: npx prisma db seed
// (isso funciona depois de configurar o "prisma.seed" no package.json —
// veja instruções no README_INTEGRACAO.md)
// ============================================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.itemNotaFiscal.deleteMany();
  await prisma.notaFiscal.deleteMany();
  await prisma.movimentacao.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.contaFixa.deleteMany();
  await prisma.assinatura.deleteMany();

  // Empresa começa "não configurada" — o usuário preenche depois de logado,
  // em Perfil > Dados Fiscais (ver src/app/perfil/dados-fiscais/page.tsx).
  await prisma.empresa.create({ data: { configurada: false } });

  // Assinatura de exemplo — plano mensal ativo.
  const proximaCobranca = new Date();
  proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);
  await prisma.assinatura.create({ data: { plano: "mensal", status: "ativa", valor: 49.9, formaPagamento: "Cartão de Débito", proximaCobranca } });

  // Contas/despesas fixas de exemplo — usadas no cálculo do Lucro do Mês.
  await prisma.contaFixa.createMany({
    data: [
      { nome: "Aluguel do ponto", valor: 900, categoria: "Estrutura", diaVencimento: 5, tipo: "fixa" },
      { nome: "Internet + telefone", valor: 120, categoria: "Estrutura", diaVencimento: 10, tipo: "fixa" },
      { nome: "Contador (MEI)", valor: 150, categoria: "Serviços", diaVencimento: 15, tipo: "fixa" },
      { nome: "Embalagens extras", valor: 80, categoria: "Materiais", diaVencimento: 20, tipo: "eventual" },
    ],
  });

  const produtos = await Promise.all([
    prisma.produto.create({ data: { nome:"Vestido Midi Estampado", sku:"VST-0021", categoria:"Vestidos", quantidade:42, precoVenda:129.9, precoCusto:70.0, fornecedor:"Textil Bom Tecido", ncm:"6104.4200" } }),
    prisma.produto.create({ data: { nome:"Calça Wide Leg Jeans", sku:"CLW-0114", categoria:"Calças", quantidade:8, precoVenda:159.0, precoCusto:85.0, fornecedor:"Jeans Brasil", ncm:"6103.4100" } }),
    prisma.produto.create({ data: { nome:"Blusa Tricot Gola Alta", sku:"BLT-0309", categoria:"Blusas", quantidade:65, precoVenda:89.9, precoCusto:42.0, fornecedor:"Malhas SP", ncm:"6110.2000" } }),
    prisma.produto.create({ data: { nome:"Jaqueta Jeans Oversized", sku:"JJO-0042", categoria:"Jaquetas", quantidade:3, precoVenda:219.9, precoCusto:120.0, fornecedor:"Jeans Brasil", ncm:"6201.9300" } }),
    prisma.produto.create({ data: { nome:"Camisa Social Linho", sku:"CSL-0203", categoria:"Camisas", quantidade:5, precoVenda:139.9, precoCusto:72.0, fornecedor:"Linho & Fibra", ncm:"6205.2000" } }),
  ]);

  await prisma.notificacao.createMany({
    data: [
      { tipo:"mei", titulo:"Limite anual do MEI em 67%", descricao:"Faturamento acumulado de R$ 54.320,00 sobre o teto de R$ 81.000,00 permitido para o MEI em 2026.", prioridade:"alta", lida:false },
      { tipo:"fiscal", titulo:"DAS de junho vence em 3 dias", descricao:"Guia do Simples Nacional (DAS) no valor de R$ 76,90 vence em 19/06/2026.", prioridade:"alta", lida:false },
      { tipo:"estoque", titulo:"Estoque baixo: Jaqueta Jeans Oversized", descricao:"Restam apenas 3 unidades em estoque.", prioridade:"alta", lida:false },
      { tipo:"sistema", titulo:"Backup automático concluído", descricao:"O backup dos dados de estoque foi concluído com sucesso.", prioridade:"baixa", lida:true },
    ],
  });

  // Algumas notas fiscais de exemplo (mês atual), para o gráfico de Ticket
  // Médio / Comparativo por Forma de Pagamento e o cálculo de Lucro do Mês
  // já aparecerem preenchidos no Dashboard.
  const hoje = new Date();
  const notasExemplo = [
    { produto: produtos[0], qtd: 2, forma: "17", dia: 3 },  // PIX
    { produto: produtos[2], qtd: 3, forma: "03", dia: 6 },  // Cartão Crédito
    { produto: produtos[1], qtd: 1, forma: "17", dia: 9 },  // PIX
    { produto: produtos[4], qtd: 1, forma: "01", dia: 12 }, // Dinheiro
    { produto: produtos[0], qtd: 1, forma: "04", dia: 14 }, // Cartão Débito
  ];
  let numeroNota = 230;
  for (const ex of notasExemplo) {
    numeroNota++;
    await prisma.notaFiscal.create({
      data: {
        numero: numeroNota,
        destinatarioTipo: "PF",
        destinatarioDoc: "111.222.333-44",
        destinatarioNome: "Cliente Exemplo",
        destinatarioUf: "SP",
        csosn: "102",
        formaPagamento: ex.forma,
        valorTotal: ex.produto.precoVenda * ex.qtd,
        statusFiscal: "autorizada",
        emitidaEm: new Date(hoje.getFullYear(), hoje.getMonth(), ex.dia),
        itens: {
          create: [{
            produtoId: ex.produto.id, nome: ex.produto.nome, sku: ex.produto.sku,
            ncm: ex.produto.ncm, cfop: "5102", quantidade: ex.qtd, valorUnitario: ex.produto.precoVenda,
          }],
        },
      },
    });
  }

  console.log(`Seed concluído: ${produtos.length} produtos e ${notasExemplo.length} notas fiscais criados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });