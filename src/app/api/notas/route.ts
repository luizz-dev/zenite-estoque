// Destino: src/app/api/notas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { proximoNumeroNota, MOTIVO_VENDA } from "@/lib/utils";
import { descreverVariacao, obterVariacao, sincronizarQuantidadeProduto } from "@/lib/estoque-server";
import { avaliarInconsistenciaFiscal } from "@/lib/fiscal";
import { brl } from "@/lib/utils";
import type { NovaNotaPayload } from "@/lib/types";

export async function GET() {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const notas = await prisma.notaFiscal.findMany({
    where: { usuarioId },
    include: { itens: true },
    orderBy: { emitidaEm: "desc" },
  });
  return NextResponse.json(notas);
}

export async function POST(req: NextRequest) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const payload: NovaNotaPayload = await req.json();

  if (!payload.itens?.length) {
    return NextResponse.json({ erro: "A nota precisa de ao menos um produto." }, { status: 400 });
  }
  if (!payload.destinatario?.doc?.trim() || !payload.destinatario?.nome?.trim()) {
    return NextResponse.json({ erro: "Informe os dados do destinatário." }, { status: 400 });
  }
  if (!payload.formaPagamento) {
    return NextResponse.json({ erro: "Selecione a forma de pagamento." }, { status: 400 });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Nota emitida a partir de uma VENDA da baixa: o estoque já foi debitado
      // na baixa, então aqui não validamos nem debitamos de novo.
      let venda: { id: string; produtoId: string | null; variacaoId: string | null; quantidade: number } | null = null;
      if (payload.movimentacaoId) {
        venda = await tx.movimentacao.findFirst({
          where: { id: payload.movimentacaoId, usuarioId, tipo: "saida", motivo: MOTIVO_VENDA, notaId: null },
          select: { id: true, produtoId: true, variacaoId: true, quantidade: true },
        });
        if (!venda) throw new Error("Venda não encontrada ou já possui nota fiscal emitida.");
        if (payload.itens.length !== 1 || payload.itens[0].produtoId !== venda.produtoId || payload.itens[0].quantidade !== venda.quantidade) {
          throw new Error("Os itens da nota não correspondem à venda selecionada.");
        }
        // Vendas novas têm variação: a nota precisa ser da mesma variação vendida.
        if (venda.variacaoId && payload.itens[0].variacaoId && payload.itens[0].variacaoId !== venda.variacaoId) {
          throw new Error("A variação da nota não corresponde à venda selecionada.");
        }
      }

      // Valida produto E variação (tamanho/cor) — que precisam ser do usuário
      // logado — e o estoque de cada variação (somando linhas repetidas).
      let total = 0;
      const itensResolvidos: { item: (typeof payload.itens)[number]; variacaoId: string }[] = [];
      const demandaPorVariacao = new Map<string, { qtd: number; variacao: { quantidade: number; tamanho: string; cor: string }; nome: string }>();

      for (const item of payload.itens) {
        const produto = await tx.produto.findFirst({ where: { id: item.produtoId, usuarioId } });
        if (!produto) throw new Error(`Produto ${item.nome} não encontrado.`);
        const variacao = await obterVariacao(tx, usuarioId, produto.id, item.variacaoId ?? venda?.variacaoId);
        itensResolvidos.push({ item, variacaoId: variacao.id });

        const acumulado = demandaPorVariacao.get(variacao.id);
        demandaPorVariacao.set(variacao.id, { qtd: (acumulado?.qtd ?? 0) + item.quantidade, variacao, nome: item.nome });
        total += item.quantidade * item.valorUnitario;
      }

      if (!venda) {
        for (const { qtd, variacao, nome } of demandaPorVariacao.values()) {
          if (variacao.quantidade < qtd) {
            throw new Error(`Estoque insuficiente para ${nome} (${descreverVariacao(variacao)}). Disponível: ${variacao.quantidade}.`);
          }
        }
      }

      const empresa = await tx.empresa.findUnique({ where: { usuarioId } });
      const usuario = await tx.usuario.findUnique({ where: { id: usuarioId } });

      if (!empresa?.configurada) {
        throw new Error("Configure os dados fiscais da empresa antes de emitir uma NF-e.");
      }

      const cnpjEmitente = (empresa.cnpj || usuario?.cpfCnpj || "").replace(/\D/g, "");
      if (cnpjEmitente.length !== 14) { 
        throw new Error("Informe um CNPJ válido nos dados fiscais da empresa.");
      }
      if (!empresa.cMunicipio || !empresa.cidade || !empresa.uf) {
        throw new Error("Consulte o CEP fiscal para obter o endereço e o código municipal IBGE.");
      }

      const ultimasNotas = await tx.notaFiscal.findMany({ where: { usuarioId }, select: { numero: true } });
      const numero = proximoNumeroNota(ultimasNotas.map((n) => n.numero));

      const doc = payload.destinatario.doc.replace(/\D/g, "");
      const enderecoCliente = payload.endereco && payload.endereco.cMunicipio
        ? {
            xLgr: payload.endereco.logradouro,
            nro: payload.endereco.numero,
            xBairro: payload.endereco.bairro,
            cMun: payload.endereco.cMunicipio || "",
            xMun: payload.endereco.cidade,
            UF: payload.endereco.uf,
            CEP: payload.endereco.cep,
          }
        : undefined;

      const dadosNFe = {
        numero,
        serie: 900,
        ambienteEsperado: process.env.NFE_MODE === "real" ? "homologacao" : "simulado",
        emitente: {
          CNPJ: cnpjEmitente,
          xNome: empresa.razaoSocial,
          IE: empresa.ie,
          CRT: /MEI|Simples/i.test(empresa.regime) ? "1" : "3",
          endereco: {
            xLgr: empresa.rua,
            nro: empresa.numero,
            xBairro: empresa.bairro,
            cMun: empresa.cMunicipio,
            xMun: empresa.cidade,
            UF: empresa.uf,
            CEP: empresa.cep,
          },
        },
        cliente: {
          ...(payload.destinatario.tipo === "PJ" ? { CNPJ: doc } : { CPF: doc }),
          xNome: payload.destinatario.nome,
          ...(enderecoCliente ? { endereco: enderecoCliente } : {}),
        },
        itens: payload.itens.map((item) => ({
          cProd: item.sku,
          xProd: item.nome,
          NCM: item.ncm,
          CFOP: item.cfop,
          uCom: "UN",
          qCom: String(item.quantidade),
          vUnCom: item.valorUnitario.toFixed(2),
        })),
        csosn: payload.csosn,
        formaPagamento: payload.formaPagamento,
      };

      const serviceUrl = process.env.NFE_SERVICE_URL;
      const serviceToken = process.env.NFE_SERVICE_TOKEN;
      if (!serviceUrl || !serviceToken || serviceToken.length < 16) {
        throw new Error("Serviço NF-e não configurado. Confira NFE_SERVICE_URL e NFE_SERVICE_TOKEN.");
      }

      let respostaService: Response;
      try {
        respostaService = await fetch(`${serviceUrl.replace(/\/$/, "")}/emitir`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Service-Token": serviceToken },
          body: JSON.stringify(dadosNFe),
          signal: AbortSignal.timeout(30000),
        });
      } catch {
        throw new Error("O serviço NF-e local não está disponível na porta 8081. Inicie o emissor antes de emitir a nota.");
      }

      const fiscal = await respostaService.json();
      if (!respostaService.ok) {
        throw new Error(fiscal.motivo || fiscal.erro || "Falha ao emitir NF-e.");
      }

      const statusFiscal = fiscal.status === "autorizada"
        ? "autorizada"
        : fiscal.status === "pendente"
          ? "pendente"
          : "rejeitada";

      const nota = await tx.notaFiscal.create({
        data: {
          usuarioId,
          numero,
          destinatarioTipo: payload.destinatario.tipo,
          destinatarioDoc: payload.destinatario.doc,
          destinatarioNome: payload.destinatario.nome,
          destinatarioIe: payload.destinatario.ie || null,
          destinatarioUf: payload.destinatario.uf,
          enderecoEntrega: payload.endereco ?? undefined,
          csosn: payload.csosn,
          formaPagamento: payload.formaPagamento,
          valorTotal: Math.round(total * 100) / 100,
          statusFiscal,
          motivoRejeicao: statusFiscal !== "autorizada" ? (fiscal.motivo || "NF-e não autorizada") : null,
          chaveAcesso: fiscal.chaveAcesso || null,
          protocolo: fiscal.protocolo || null,
          xmlAutorizado: fiscal.xmlAutorizado || null,
          itens: {
            create: itensResolvidos.map(({ item, variacaoId }) => ({
              produtoId: item.produtoId,
              variacaoId,
              nome: item.nome,
              sku: item.sku,
              ncm: item.ncm,
              cfop: item.cfop,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
            })),
          },
        },
        include: { itens: true },
      });

      // Venda da baixa: só vincula quando a nota foi AUTORIZADA. Se for rejeitada,
      // a venda continua "sem nota" e pode ser emitida de novo.
      if (venda && statusFiscal === "autorizada") {
        await tx.movimentacao.update({ where: { id: venda.id }, data: { notaId: nota.id } });
      }

      if (!venda && statusFiscal === "autorizada") {
        for (const { item, variacaoId } of itensResolvidos) {
          await tx.variacaoProduto.update({ where: { id: variacaoId }, data: { quantidade: { decrement: item.quantidade } } });
          await sincronizarQuantidadeProduto(tx, item.produtoId);
        }
      }

      if (statusFiscal === "autorizada") {
        await tx.notificacao.create({
          data: {
            usuarioId,
            tipo: "fiscal",
            titulo: `NF-e #${String(numero).padStart(5, "0")} emitida com sucesso`,
            descricao: `Nota fiscal com ${payload.itens.length} item(ns) e total de ${brl(total)} autorizada pelo emissor fiscal.`,
            prioridade: "baixa",
          },
        });
      } else {
        await tx.notificacao.create({
          data: {
            usuarioId,
            tipo: "fiscal",
            titulo: `NF-e #${String(numero).padStart(5, "0")} não autorizada`,
            descricao: fiscal.motivo || "A nota não foi autorizada pelo emissor fiscal.",
            prioridade: "alta",
          },
        });
      }

      // #20: nota autorizada pode equalizar (e liberar novo aviso) as saídas × NF-e do mês.
      await avaliarInconsistenciaFiscal(tx, usuarioId);

      return nota;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro ao emitir a nota fiscal.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}