// Destino: src/app/api/notas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { proximoNumeroNota } from "@/lib/utils";
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
      let total = 0;
      for (const item of payload.itens) {
        const produto = await tx.produto.findFirst({ where: { id: item.produtoId, usuarioId } });
        if (!produto) throw new Error(`Produto ${item.nome} não encontrado.`);
        if (produto.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${item.nome} (disponível: ${produto.quantidade}).`);
        }
        total += item.quantidade * item.valorUnitario;
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

      const respostaService = await fetch(`${serviceUrl.replace(/\/$/, "")}/emitir`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Service-Token": serviceToken },
        body: JSON.stringify(dadosNFe),
        signal: AbortSignal.timeout(30000),
      });

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
          valorTotal: total,
          statusFiscal,
          motivoRejeicao: statusFiscal !== "autorizada" ? (fiscal.motivo || "NF-e não autorizada") : null,
          chaveAcesso: fiscal.chaveAcesso || null,
          protocolo: fiscal.protocolo || null,
          xmlAutorizado: fiscal.xmlAutorizado || null,
          itens: {
            create: payload.itens.map((item) => ({
              produtoId: item.produtoId,
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

      if (statusFiscal === "autorizada") {
        for (const item of payload.itens) {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { quantidade: { decrement: item.quantidade } },
          });
        }
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

      return nota;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro ao emitir a nota fiscal.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}