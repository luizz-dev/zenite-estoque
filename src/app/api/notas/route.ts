import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proximoNumeroNota, brl } from "@/lib/utils";
import type { NovaNotaPayload } from "@/lib/types";

const execFileAsync = promisify(execFile);

function getCodigoMunicipio(uf: string, cidade?: string): number {
  const normalizado = (cidade ?? "").toLowerCase();

  if (uf === "SP" && /s[aã]o paulo|sao paulo/.test(normalizado)) return 3550308;
  if (uf === "RJ" && /rio de janeiro|rio/.test(normalizado)) return 3304557;
  if (uf === "MG" && /belo horizonte|belo/.test(normalizado)) return 3106200;
  if (uf === "PR" && /curitiba|curit/.test(normalizado)) return 4106902;
  return 3550308;
}

async function emitirNFeViaPhp(payload: {
  numero: number;
  serie: number;
  emitente: Record<string, any>;
  cliente: Record<string, any>;
  itens: Array<{ cProd: string; xProd: string; NCM: string; CFOP: string; uCom: string; qCom: number; vUnCom: number }>;
}) {
  const scriptPath = path.join(process.cwd(), "emitir_nfe.php");

  try {
    const { stdout } = await execFileAsync("php", [scriptPath, JSON.stringify(payload)], {
      timeout: 120000,
      env: process.env,
    });

    const raw = stdout.toString().trim();
    const trechoJson = raw.split(/\r?\n/).find((linha) => linha.trim().startsWith("{")) ?? raw;
    const resultado = JSON.parse(trechoJson);

    return {
      sucesso: Boolean(resultado?.sucesso),
      status: resultado?.status ?? "erro",
      mensagem: resultado?.mensagem ?? "Erro ao emitir a NF-e.",
      motivoRejeicao: resultado?.motivoRejeicao ?? resultado?.mensagem ?? null,
      protocoloNFe: resultado?.protocoloNFe ?? null,
      detalhes: resultado?.detalhes ?? null,
    };
  } catch (erro: any) {
    const mensagem = erro?.stderr?.toString?.() || erro?.message || "Falha ao se comunicar com o serviço de NFe.";
    return {
      sucesso: false,
      status: "erro",
      mensagem: mensagem.replace(/\s+/g, " ").trim() || "Falha ao se comunicar com o serviço de NFe.",
      motivoRejeicao: mensagem.replace(/\s+/g, " ").trim() || "Falha ao se comunicar com o serviço de NFe.",
      protocoloNFe: null,
      detalhes: null,
    };
  }
}

// GET /api/notas — lista as notas fiscais já emitidas, com os itens de cada uma
// (é o que alimenta o Histórico — cada nota vira 1 card expansível).
export async function GET() {
  const notas = await prisma.notaFiscal.findMany({
    include: { itens: true },
    orderBy: { emitidaEm: "desc" },
  });
  return NextResponse.json(notas);
}

// POST /api/notas — emite uma NF-e com 1 ou vários produtos.
export async function POST(req: NextRequest) {
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
      const itensProcessados: Array<{ produtoId: string; nome: string; sku: string; ncm: string; cfop: string; quantidade: number; valorUnitario: number }> = [];

      for (const item of payload.itens) {
        const produto = await tx.produto.findUnique({ where: { id: item.produtoId } });
        if (!produto) throw new Error(`Produto ${item.nome} não encontrado.`);
        if (produto.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${item.nome} (disponível: ${produto.quantidade}).`);
        }
        total += item.quantidade * item.valorUnitario;
        itensProcessados.push({ ...item, cfop: item.cfop || "5102" });
      }

      const empresa = await tx.empresa.findFirst();
      if (!empresa || !empresa.configurada || !empresa.razaoSocial || !empresa.cnpj || !empresa.ie) {
        throw new Error("Empresa não configurada. Preencha os dados fiscais antes de emitir a NF-e.");
      }

      const numero = proximoNumeroNota((await tx.notaFiscal.findMany({ select: { numero: true } })).map((n) => n.numero));
      const emitente = {
        CNPJ: empresa.cnpj.replace(/\D/g, ""),
        xNome: empresa.razaoSocial,
        IE: empresa.ie.replace(/\D/g, "") || "ISENTO",
        CRT: "1",
        endereco: {
          xLgr: empresa.rua || "Rua",
          nro: empresa.numero || "S/N",
          xBairro: empresa.bairro || "Centro",
          cMun: getCodigoMunicipio(empresa.uf || "SP", empresa.cidade || "São Paulo"),
          xMun: empresa.cidade || "São Paulo",
          UF: empresa.uf || "SP",
          CEP: (empresa.cep || "01000000").replace(/\D/g, ""),
        },
      };

      const cliente = {
        CNPJ: payload.destinatario.tipo === "PJ" ? payload.destinatario.doc.replace(/\D/g, "") : undefined,
        CPF: payload.destinatario.tipo === "PF" ? payload.destinatario.doc.replace(/\D/g, "") : undefined,
        xNome: payload.destinatario.nome,
        endereco: {
          xLgr: payload.endereco?.logradouro || "Rua",
          nro: payload.endereco?.numero || "S/N",
          xBairro: payload.endereco?.bairro || "Centro",
          cMun: getCodigoMunicipio(payload.destinatario.uf || "SP", payload.endereco?.cidade || "São Paulo"),
          xMun: payload.endereco?.cidade || "São Paulo",
          UF: payload.endereco?.uf || payload.destinatario.uf || "SP",
          CEP: (payload.endereco?.cep || "01000000").replace(/\D/g, ""),
        },
      };

      const itensNfe = itensProcessados.map((item) => ({
        cProd: String(item.produtoId).slice(0, 20),
        xProd: item.nome,
        NCM: String(item.ncm || "6109.10"),
        CFOP: String(item.cfop || "5102"),
        uCom: "UN",
        qCom: Number(item.quantidade),
        vUnCom: Number(item.valorUnitario),
      }));

      const resultadoNfe = await emitirNFeViaPhp({
        numero,
        serie: 900,
        emitente,
        cliente,
        itens: itensNfe,
      });

      const statusFiscal = resultadoNfe.sucesso ? "autorizada" : "rejeitada";
      const motivoRejeicao = resultadoNfe.sucesso ? null : (resultadoNfe.motivoRejeicao || resultadoNfe.mensagem || "NF-e rejeitada pela SEFAZ.");

      const nota = await tx.notaFiscal.create({
        data: {
          numero,
          destinatarioTipo: payload.destinatario.tipo,
          destinatarioDoc: payload.destinatario.doc,
          destinatarioNome: payload.destinatario.nome,
          destinatarioIe: payload.destinatario.ie || null,
          destinatarioUf: payload.destinatario.uf,
          enderecoEntrega: payload.endereco ? JSON.parse(JSON.stringify(payload.endereco)) : undefined,
          csosn: payload.csosn,
          formaPagamento: payload.formaPagamento,
          valorTotal: total,
          statusFiscal,
          motivoRejeicao,
          itens: {
            create: itensProcessados.map((item) => ({
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
        for (const item of itensProcessados) {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { quantidade: { decrement: item.quantidade } },
          });
        }
      }

      if (statusFiscal === "autorizada") {
        await tx.notificacao.create({
          data: {
            tipo: "fiscal",
            titulo: `NF-e #${String(numero).padStart(5, "0")} emitida com sucesso`,
            descricao: `Nota fiscal com ${itensProcessados.length} item(ns) e total de ${brl(total)} autorizada pela SEFAZ.`,
            prioridade: "baixa",
          },
        });
      } else {
        await tx.notificacao.create({
          data: {
            tipo: "fiscal",
            titulo: `NF-e #${String(numero).padStart(5, "0")} rejeitada pela SEFAZ`,
            descricao: motivoRejeicao || "A nota foi rejeitada. Corrija os dados e emita novamente.",
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
